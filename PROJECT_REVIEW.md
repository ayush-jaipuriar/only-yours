# Only Yours — Comprehensive Project Review

**Reviewer:** AI Product & Engineering Advisor  
**Date:** February 22, 2026  
**Scope:** Full-stack review — Backend (Spring Boot), Frontend (Expo + legacy RN CLI), Architecture, UX, Security, Scalability  
**Perspective:** Product Manager, Competitor User (Lovify, Paired, Couple Game), Senior Engineer

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [What Works Well](#2-what-works-well)
3. [Critical Bugs](#3-critical-bugs)
4. [Architecture & Design Flaws](#4-architecture--design-flaws)
5. [Security Concerns](#5-security-concerns)
6. [UX/UI Problems](#6-uxui-problems)
7. [Product & Feature Gaps](#7-product--feature-gaps)
8. [Backend Improvements](#8-backend-improvements)
9. [Frontend Improvements](#9-frontend-improvements)
10. [DevOps & Infrastructure](#10-devops--infrastructure)
11. [Code Quality](#11-code-quality)
12. [Competitive Analysis](#12-competitive-analysis)
13. [Prioritized Action Plan](#13-prioritized-action-plan)

---

## 1. Executive Summary

**Only Yours** is a couples quiz app where partners answer questions about themselves, then guess each other's answers in a two-round real-time game. The core concept is strong and the backend is architecturally solid (Spring Boot, JWT, STOMP WebSocket, Flyway-managed PostgreSQL). The gameplay mechanic — answer then guess — is engaging and validates well against competitors like Paired and Lovify.

However, the project has **critical runtime bugs**, **significant UX gaps**, **hardcoded configuration**, and **missing features** that would prevent a successful launch. This review catalogs everything systematically.

---

## 2. What Works Well

### Backend Strengths
- **Flyway migrations** — Schema evolution is clean and properly versioned (V1–V5). This is a mature choice.
- **JWT + refresh token rotation** — Access tokens (15min) with hashed refresh tokens (SHA-256, 30-day) is production-grade auth. Token rotation on refresh prevents replay attacks.
- **Separation of concerns** — Controllers, Services, Repositories, DTOs, Config are cleanly separated.
- **WebSocket game flow** — STOMP over both SockJS (legacy) and raw WebSocket (Expo) is thoughtful dual-support.
- **Integration tests** — Auth, couple flow, and content endpoints have proper test coverage with H2.
- **Docker Compose** — Local dev is one command with health checks and named volumes.
- **Error handling in GameController** — Every WebSocket handler has try/catch with user-facing error messages via `/queue/errors`.

### Frontend Strengths
- **Token refresh interceptor** — The Axios interceptor with queue-based deduplication is well-engineered. Multiple concurrent 401s don't trigger multiple refresh calls.
- **WebSocket reconnection** — Connection state tracking with `ReconnectionBanner` is good UX.
- **Error boundary** — `AppErrorBoundary` catches unhandled exceptions with a fallback UI.
- **Game screen UX** — Progress bar, round badges, guess result overlays, animated score reveals on Results screen — these are polished.

---

## 3. Critical Bugs

### BUG-1: GameContext double-parses WebSocket messages (CRASH)

**File:** `OnlyYoursExpo/src/state/GameContext.js`, lines 49–78  
**Severity:** Critical — will crash the game

`WebSocketService.subscribe()` already calls `JSON.parse(message.body)` and passes the parsed object to the callback. But `GameContext.startGame()` treats the callback argument as a raw STOMP frame and calls `JSON.parse(message.body)` again:

```javascript
const sub = WebSocketService.subscribe(gameTopic, (message) => {
  try {
    const payload = JSON.parse(message.body); // BUG: message is already parsed
```

Since `message` is a plain JS object (not a STOMP frame), `message.body` is `undefined`, and `JSON.parse(undefined)` throws. The game topic subscription silently fails, meaning **no questions, round transitions, or results will ever arrive**.

The same bug exists for the private subscription at line 82–97.

**Fix:** Treat the callback argument as the parsed payload directly.

---

### BUG-2: Inviter never navigates to GameScreen

**Severity:** Critical — half the flow is broken

When Player A invites Player B:
1. Player A sends `/app/game.invite` from `CategorySelectionScreen`
2. Player A sees an Alert saying "Invitation Sent... Waiting for partner"
3. Player B gets the invitation, accepts, and navigates to `GameScreen`
4. **Player A stays on the Alert dialog forever** — there is no code that navigates the inviter to `GameScreen`

In `AuthContext`, the `subscribeToGameEvents` handler only handles `INVITATION` (for the invitee) and `STATUS` (which just logs `INVITATION_SENT`). When the game starts (first question is broadcast on `/topic/game/{sessionId}`), Player A isn't subscribed to that topic because `startGame()` was never called for them.

**Fix:** Handle the `INVITATION_SENT` status in `AuthContext` to subscribe the inviter to the game topic, or add a `GAME_STARTED` event that the backend broadcasts to both players' private queues.

---

### BUG-3: Race condition between WebSocket connect and subscribe

**File:** `OnlyYoursExpo/src/state/AuthContext.js`, line 184–188

```javascript
const connectRealtime = async () => {
  WebSocketService.setConnectionStateListener(setWsConnectionState);
  await WebSocketService.connect(API_BASE);
  subscribeToGameEvents();  // Called immediately after connect()
};
```

`WebSocketService.connect()` calls `this.client.activate()` which is asynchronous — it starts the WebSocket handshake but doesn't wait for the STOMP CONNECT frame to complete. `subscribeToGameEvents()` is called immediately, but `subscribe()` checks `if (!this.client || !this.connected)` and returns `null` because the connection isn't established yet.

**Result:** Game event subscriptions silently fail. The user never receives game invitations.

**Fix:** Return a Promise from `connect()` that resolves in the `onConnect` callback, or queue subscriptions until connected.

---

### BUG-4: AuthContext subscribes to game-events but GameContext also subscribes

Both `AuthContext.subscribeToGameEvents()` and `GameContext.startGame()` subscribe to `/user/queue/game-events`. `WebSocketService.subscribe()` uses a Map keyed by destination, so the second subscription **overwrites** the first:

```javascript
// WebSocketService.js line 108
this.subscriptions.set(destination, sub);
```

This means:
- Before a game starts: `AuthContext`'s subscription handles invitations (correct)
- After `startGame()`: `GameContext`'s subscription replaces it, handling only `GUESS_RESULT` (correct for game)
- After `endGame()`: The subscription is unsubscribed, but `AuthContext`'s subscription was already overwritten and is never restored

**Result:** After the first game ends, the user can never receive new invitations until they restart the app.

---

## 4. Architecture & Design Flaws

### ARCH-1: Hardcoded API URLs

**Files:** `OnlyYoursExpo/src/services/api.js` (line 5), `OnlyYoursExpo/src/state/AuthContext.js` (line 8)

```javascript
const API_URL = 'http://192.168.1.101:8080/api';
const API_BASE = 'http://192.168.1.101:8080';
```

These are hardcoded to a local network IP. This means:
- The app breaks on any other network
- Cannot switch between dev/staging/prod
- The IP is duplicated in two files

**Fix:** Use environment variables via `expo-constants` or a config file. At minimum, extract to a single `config.js`.

---

### ARCH-2: Two frontend codebases with diverging logic

`OnlyYoursApp` (React Native CLI) and `OnlyYoursExpo` share the same structure but have subtle differences:
- Different API base URLs (`localhost` vs `192.168.1.101`)
- Different Axios imports (`axios/dist/browser/axios.cjs` vs `axios`)
- Different WebSocket transports (SockJS vs native)
- Different 401/403 handling

Having two codebases means every bug fix must be applied twice. The legacy `OnlyYoursApp` should be deprecated explicitly or deleted.

---

### ARCH-3: No centralized theme or design system

Colors are defined inline across 10+ files with slight variations:
- Primary: `#6200ea`, `#6A4CFF`, `#2D225A` (three different "primary" purples)
- Background: `#f5f5f5`, `#F6F5FF` (inconsistent)
- Error: `#C6354C`, `#e53935` (two different reds)

This makes the app feel inconsistent and makes rebranding expensive.

---

### ARCH-4: Singleton WebSocket service is a shared mutable global

`WebSocketService` is exported as `new WebSocketService()` — a module-level singleton. This creates tight coupling: `AuthContext`, `GameContext`, `CategorySelectionScreen`, and `ReconnectionBanner` all directly import and mutate this single instance. This makes testing difficult and creates the subscription collision described in BUG-4.

---

### ARCH-5: Question IDs stored as comma-separated string

In `GameSession`, question IDs are stored as `VARCHAR` with values like `"3,7,12,1,9,15,6,4"`. This is parsed with `.split(",")` throughout `GameService`. This approach:
- Prevents relational querying
- Is fragile (whitespace, empty strings)
- Doesn't leverage PostgreSQL arrays or a join table

---

### ARCH-6: No API versioning

All endpoints are under `/api/` without versioning. Once you ship to production and have real users, any breaking change (renaming a field, removing an endpoint) will break older app versions that haven't updated.

---

## 5. Security Concerns

### SEC-1: CORS wide open

```java
registry.addEndpoint("/ws").setAllowedOriginPatterns("*")
registry.addEndpoint("/ws-native").setAllowedOriginPatterns("*")
```

`setAllowedOriginPatterns("*")` allows any origin to connect to the WebSocket endpoints. For a mobile app this is less critical, but if any web client ever connects, this is a vulnerability.

---

### SEC-2: No rate limiting on auth endpoints

The `/api/auth/login`, `/api/auth/register`, `/api/auth/forgot-password` endpoints have no rate limiting. An attacker can:
- Brute-force passwords
- Enumerate registered emails (even though the message is generic for forgot-password, login returns a specific error)
- Spam password reset tokens

---

### SEC-3: Registration error leaks existence of email/username

```java
if (userRepository.existsByEmail(email) || userRepository.existsByUsername(username)) {
    throw new IllegalArgumentException(GENERIC_REGISTRATION_ERROR_MESSAGE);
}
```

While the message is generic, the fact that it fails at all reveals that either the email or username exists. An attacker can use timing attacks or enumerate by trying variations. The response should be the same regardless.

---

### SEC-4: Password reset token exposed in server logs

```java
log.info("DEV ONLY - Password reset token for email {}: {}", email, rawResetToken);
```

This log line outputs the raw reset token. In production, logs may be collected by monitoring systems (Datadog, CloudWatch), making the token accessible to anyone with log access. This must be removed or gated behind a dev profile check.

---

### SEC-5: No password complexity requirements beyond length

SignUp validates `password.length < 8` on the frontend, but the backend `AuthService.registerEmailUser()` has **no password validation at all**. A user could register with `"aaaaaaaa"` or bypass the frontend entirely.

---

### SEC-6: WebSocket messages not validated for authorization

In `GameController.handleGuess()`, the code validates the user exists but doesn't verify they're actually part of the game session's couple. A malicious user could submit guesses for someone else's game session by sending crafted STOMP messages with a different `sessionId`.

---

### SEC-7: CSRF disabled globally

```java
.csrf(csrf -> csrf.disable())
```

Appropriate for a JWT-based mobile API, but should be documented why. If a web frontend is ever added, this becomes a vulnerability.

---

### SEC-8: Deprecated JJWT APIs in use

`JwtService` uses deprecated `setSigningKey()` and `SignatureAlgorithm.HS256`. The library version (0.11.5) has newer builder APIs. This should be updated before the deprecated APIs are removed.

---

## 6. UX/UI Problems

### UX-1: PartnerLinkScreen has no styling

The `PartnerLinkScreen` uses inline styles and raw `<Button>` components while every other screen uses `StyleSheet.create()` and custom `TouchableOpacity` buttons. It looks completely out of place — like a developer prototype in the middle of a designed app.

Compare:
- **SignIn:** Beautiful purple theme, rounded inputs, custom buttons
- **PartnerLink:** Raw `<Button>`, inline styles, no theming

---

### UX-2: No onboarding or tutorial flow

When a new user registers, they land on the Dashboard with "Not linked with a partner yet" and a button. There's no explanation of:
- What the app does
- How the game works
- What "linking" means
- Why they should play

Competitors like Paired have a warm onboarding with illustrations showing the value proposition.

---

### UX-3: No loading state on app startup

The `AuthProvider` performs a silent token refresh on mount but shows nothing while it happens. Users see a flash of the SignIn screen before being redirected to Dashboard. This should be a splash/loading screen.

---

### UX-4: Alert-based game invitations are fragile

Game invitations use `Alert.alert()` which:
- Disappears if the user switches apps
- Can't be seen if the app was in the background
- Doesn't persist — if missed, the invitation is gone forever
- Feels jarring and cheap compared to in-app notification UIs

Competitors use in-app notification banners, push notifications, or persistent invitation cards.

---

### UX-5: No visual feedback during partner link code generation

The "Generate Code" button just says "Generating..." — there's no animation or progress indicator. After generation, the code is shown in plain text with no visual emphasis. The code should be large, copyable, and visually prominent.

---

### UX-6: No game history

After completing a game, there's no way to see past results. Users can "Play Again" or go to Dashboard, but all history is lost from the UI. Competitors show a timeline of past games with scores, trends, and "relationship score" tracking.

---

### UX-7: No haptic feedback or sound effects

The game has no haptic feedback for answer selection, no sounds for correct/incorrect guesses, and no celebration animations on the Results screen. These micro-interactions are critical for engagement in quiz/game apps.

---

### UX-8: Dashboard is bare

The Dashboard shows:
- "Welcome, {name}!"
- Partner status
- Start Game / Link Partner button
- View Profile link

That's it. No relationship stats, no daily prompts, no content. It feels empty. Competitors fill the home screen with conversation starters, daily questions, relationship tips, and engagement hooks.

---

### UX-9: Profile screen is minimal

The Profile screen shows name, email, and a logout button. There's no:
- Profile photo upload
- Display name editing
- Partner info display
- Relationship stats (games played, average score)
- Account settings (change password, delete account)

---

### UX-10: No "Back" navigation on several screens

`GameScreen` and `ResultsScreen` have `headerLeft: null` and `gestureEnabled: false`, which is correct during gameplay. But if the WebSocket disconnects mid-game, the user is stuck on a loading screen with no way out.

---

### UX-11: No dark mode support

The app uses hardcoded light colors everywhere. Modern apps should support system dark mode at minimum.

---

## 7. Product & Feature Gaps

### PRODUCT-1: No push notifications

The app relies entirely on the user having the app open to receive invitations. Without push notifications:
- Partner can't be notified when invited
- No daily engagement reminders
- No "your partner is online" presence

This is the #1 missing feature for a couples app.

---

### PRODUCT-2: No email delivery for password reset

```java
log.info("DEV ONLY - Password reset token for email {}: {}", email, rawResetToken);
```

Password reset tokens are logged to the console — no email is sent. The "forgot password" flow is completely non-functional for users.

---

### PRODUCT-3: No user-generated content

The app only has pre-seeded questions. There's no way for couples to:
- Create custom questions
- Submit question suggestions
- Choose different game modes

---

### PRODUCT-4: No social/sharing features

After a game, there's no way to share results on social media, which is a major growth channel for apps like this.

---

### PRODUCT-5: No relationship milestones or gamification

No streaks, no "you've played X games together", no badges, no levels. These retention mechanics are standard in competitor apps.

---

### PRODUCT-6: No in-app chat or messaging

Couples apps like Paired and Between include private messaging. While not core to the quiz game, it's an expected feature in the category.

---

### PRODUCT-7: No daily prompts or content feed

Competitors send daily "question of the day" prompts that don't require both partners to be online simultaneously. The synchronous-only game mode limits engagement.

---

### PRODUCT-8: No unlink/breakup flow

Once linked, there's no way to unlink from a partner. If a relationship ends, the user is stuck.

---

### PRODUCT-9: Only 4 options per question (A/B/C/D)

Some relationship questions would work better as free-text, scales (1-10), or yes/no. The rigid 4-option format limits question variety.

---

### PRODUCT-10: No internationalization (i18n)

All strings are hardcoded in English. No infrastructure for translations.

---

## 8. Backend Improvements

### BE-1: Add input validation on DTOs

`RegisterRequestDto` and `LoginRequestDto` should use `@Valid` with `@NotBlank`, `@Email`, `@Size` annotations. Currently, validation happens in service layer with manual checks, but invalid requests should be rejected at the controller level with proper 400 responses.

---

### BE-2: Clean up unused Google auth code

`AuthController` still has the Google sign-in endpoint returning 410. `AuthService.authenticateGoogleUser()` still exists. The `GOOGLE_CLIENT_ID` is still required in `docker-compose.yml`. All of this dead code should be removed.

---

### BE-3: Add database indexes for common queries

- `game_answers` needs a composite index on `(game_session_id, question_id, user_id)` — this is queried frequently
- `couples` needs an index on `(user1_id)` and `(user2_id)` — currently only `link_code` is indexed

---

### BE-4: Replace in-memory Simple Broker with an external broker

The current `enableSimpleBroker()` is an in-memory implementation. It:
- Doesn't survive server restarts
- Can't scale horizontally (multiple backend instances don't share state)
- Has no message persistence

For production, use RabbitMQ or ActiveMQ as the STOMP broker.

---

### BE-5: Add request/response logging

No structured request logging. Add a logging filter for request method, path, status code, and duration. This is essential for debugging production issues.

---

### BE-6: Paginate query results

`QuestionRepository.findByCategory_Id()` returns all questions in a category without pagination. If a category ever has hundreds of questions, this will cause memory issues.

---

### BE-7: Add health check endpoints beyond `/actuator/health`

Add readiness and liveness probes for Kubernetes/Cloud Run deployment. Add a `/actuator/info` endpoint with build version info.

---

### BE-8: Token cleanup job

`refresh_tokens` and `password_reset_tokens` tables will grow indefinitely. Add a scheduled job (`@Scheduled`) to purge expired and revoked tokens.

---

## 9. Frontend Improvements

### FE-1: Extract configuration to a config module

Create `src/config.js`:
```javascript
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080';
export const API_URL = `${API_BASE_URL}/api`;
```

Remove hardcoded IPs from `api.js` and `AuthContext.js`.

---

### FE-2: Add a centralized theme

Create `src/theme.js` with colors, spacing, typography, and shadows. Import everywhere instead of defining colors inline.

---

### FE-3: Add TypeScript

The entire frontend is JavaScript without type checking. For a project of this complexity (WebSocket messages, multiple contexts, navigation params), TypeScript would prevent entire categories of bugs.

---

### FE-4: Add proper form validation library

Use a library like `react-hook-form` or `formik` with `yup`/`zod` for validation. Currently, validation is manual `if/else` chains in each screen.

---

### FE-5: Add a proper state management solution

Two React Contexts with refs pointing at each other (`gameContextRef`, `navigationRef`) is fragile. Consider Zustand or Redux Toolkit for cleaner state management, especially as features grow.

---

### FE-6: Handle app backgrounding/foregrounding

When the app goes to background:
- WebSocket connection may drop
- Token may expire
- Game state may become stale

Use `AppState` listener to reconnect WebSocket and refresh tokens when the app returns to foreground.

---

### FE-7: Add skeleton loading screens

Replace `ActivityIndicator` spinners with skeleton/shimmer loading states for a more polished feel.

---

### FE-8: Add accessibility

No accessibility labels on any interactive element. Screen readers can't navigate the app. Add `accessibilityLabel`, `accessibilityRole`, and `accessibilityHint` to all buttons, inputs, and interactive elements.

---

### FE-9: Delete deprecated `MainApp.js`

`MainApp.js` returns `null` and is unused. Remove it.

---

### FE-10: Add error handling for WebSocket send failures

`WebSocketService.sendMessage()` silently does nothing if not connected:
```javascript
if (!this.client || !this.connected) return;
```

The caller has no way to know the message wasn't sent. This should throw or return a status.

---

## 10. DevOps & Infrastructure

### DEVOPS-1: No CI/CD pipeline

There are no GitHub Actions workflows. Every deployment is manual. At minimum, add:
- Backend: build, test, lint on every PR
- Frontend: lint, type-check (if TS is added), test on every PR
- Auto-deploy to staging on merge to main

---

### DEVOPS-2: No environment separation

No staging environment. Only local dev and a planned production. There's no way to test changes in a production-like environment before shipping.

---

### DEVOPS-3: `.env.example` requires `GOOGLE_CLIENT_ID`

The docker-compose uses `${GOOGLE_CLIENT_ID:?...}` (required), but Google auth is disabled. This will block anyone trying to run the project.

---

### DEVOPS-4: No monitoring or alerting

No APM (Application Performance Monitoring), no error tracking (Sentry), no uptime monitoring. Production issues will go unnoticed.

---

### DEVOPS-5: No database backup strategy

No automated backups for PostgreSQL. A single `docker-compose down -v` wipes all data.

---

### DEVOPS-6: EAS project ID is empty

In `OnlyYoursExpo/app.json`:
```json
"eas": { "projectId": "" }
```

This must be set before any EAS build can run.

---

## 11. Code Quality

### CQ-1: Console.log pollution

The codebase is littered with `console.log('[GameContext]...')`, `console.error(...)`, and `console.warn(...)`. These should be:
- Removed for production builds
- Replaced with a proper logging utility that can be disabled

---

### CQ-2: Inconsistent error handling patterns

- Some screens use `Alert.alert()` for errors
- Some use inline error text (`setErrorMessage`)
- Some silently catch and log
- The API interceptor shows global Alert for 500s and network errors, which can overlap with screen-level error handling

---

### CQ-3: Dead code

- `MainApp.js` — returns null
- `authenticateGoogleUser()` in `AuthService` — throws
- Google sign-in endpoint in `AuthController` — returns 410
- `sockjs-client` dependency in `OnlyYoursApp`

---

### CQ-4: Missing error types

Backend uses `IllegalArgumentException` and `IllegalStateException` for all errors. There are no custom exception classes, making it hard to distinguish between different error types or add specific HTTP status codes.

---

### CQ-5: No DTOs for some responses

`GameController.sendErrorToUser()` uses `Map.of()` instead of a proper DTO. `AuthController` returns the result of `AuthService` methods directly as strings for some endpoints. Inconsistent.

---

### CQ-6: Stale sprint comments throughout

Multiple files have comments like "Sprint 4 Update:", "Sprint 6: Added...", "@author Sprint 4 Team". These are noise and should be removed — that's what git history is for.

---

## 12. Competitive Analysis

| Feature | Only Yours | Paired | Lovify | Couple Game |
|---|---|---|---|---|
| Quiz/Game | 2-round real-time | Daily questions | Quiz games | Various games |
| Push Notifications | No | Yes | Yes | Yes |
| Daily Content | No | Yes (articles, tips) | Yes | Yes |
| Chat/Messaging | No | Yes | No | Yes |
| Relationship Insights | No | Yes (trends, stats) | Basic | Basic |
| Profile Photos | No | Yes | Yes | Yes |
| Offline Support | No | Partial | No | No |
| Onboarding | No | Beautiful | Good | Basic |
| Dark Mode | No | Yes | Yes | No |
| Monetization | None | Freemium | Ads + Premium | Freemium |
| Platforms | Android (planned) | iOS + Android | iOS + Android | iOS + Android |

**Key takeaway:** Only Yours has a strong core mechanic (the 2-round answer-then-guess game) that competitors don't have. But competitors offer a much richer daily experience around the core feature. The real-time synchronous requirement is both a differentiator and a limitation — users can only play when both are available.

---

## 13. Prioritized Action Plan

### P0 — Must Fix Before Any Testing (Blockers)

| # | Item | Type | Effort |
|---|------|------|--------|
| 1 | Fix GameContext double-parse bug (BUG-1) | Bug | 30 min |
| 2 | Fix WebSocket connect/subscribe race condition (BUG-3) | Bug | 1 hour |
| 3 | Fix inviter not navigating to GameScreen (BUG-2) | Bug | 2 hours |
| 4 | Fix subscription collision between AuthContext and GameContext (BUG-4) | Bug | 2 hours |
| 5 | Extract hardcoded API URL to config (ARCH-1) | Arch | 1 hour |

### P1 — Required for Launch

| # | Item | Type | Effort |
|---|------|------|--------|
| 6 | Implement email delivery for password reset (PRODUCT-2) | Feature | 1 day |
| 7 | Add push notifications (PRODUCT-1) | Feature | 3 days |
| 8 | Style PartnerLinkScreen properly (UX-1) | UX | 2 hours |
| 9 | Add app loading/splash screen (UX-3) | UX | 2 hours |
| 10 | Add rate limiting on auth endpoints (SEC-2) | Security | 4 hours |
| 11 | Remove password reset token from logs (SEC-4) | Security | 15 min |
| 12 | Add backend input validation with @Valid (BE-1) | Quality | 2 hours |
| 13 | Set up CI/CD pipeline (DEVOPS-1) | DevOps | 1 day |
| 14 | Fill in EAS project ID (DEVOPS-6) | DevOps | 15 min |
| 15 | Remove GOOGLE_CLIENT_ID requirement (DEVOPS-3) | DevOps | 30 min |

### P2 — Important for Retention

| # | Item | Type | Effort |
|---|------|------|--------|
| 16 | Add game history screen | Feature | 2 days |
| 17 | Add relationship stats to Dashboard (UX-8) | UX | 1 day |
| 18 | Add onboarding flow (UX-2) | UX | 2 days |
| 19 | Centralized theme system (ARCH-3) | Arch | 1 day |
| 20 | Handle app background/foreground (FE-6) | Quality | 4 hours |
| 21 | Add unlink/breakup flow (PRODUCT-8) | Feature | 4 hours |
| 22 | Profile editing and stats (UX-9) | UX | 1 day |
| 23 | Add password requirements on backend (SEC-5) | Security | 1 hour |
| 24 | Add daily prompts / async questions (PRODUCT-7) | Feature | 3 days |
| 25 | Complete Android Firebase config for push notifications (PRODUCT-1 follow-up) | DevOps | 2-4 hours |
| 26 | Extend CI to include staging deploy pipeline (DEVOPS-1 follow-up) | DevOps | 1 day |

### P3 — Nice to Have

| # | Item | Type | Effort |
|---|------|------|--------|
| 27 | Migrate to TypeScript (FE-3) | Quality | 3 days |
| 28 | Add dark mode (UX-11) | UX | 2 days |
| 29 | Add haptic feedback and sounds (UX-7) | UX | 1 day |
| 30 | Custom questions (PRODUCT-3) | Feature | 2 days |
| 31 | Social sharing (PRODUCT-4) | Feature | 1 day |
| 32 | Gamification (streaks, badges) (PRODUCT-5) | Feature | 3 days |
| 33 | Replace Simple Broker with RabbitMQ (BE-4) | Arch | 2 days |
| 34 | Add accessibility labels (FE-8) | Quality | 1 day |
| 35 | API versioning (ARCH-6) | Arch | 4 hours |
| 36 | Delete legacy OnlyYoursApp codebase (ARCH-2) | Cleanup | 1 hour |
| 37 | Token cleanup scheduled job (BE-8) | Quality | 2 hours |
| 38 | i18n infrastructure (PRODUCT-10) | Feature | 2 days |

---

## Appendix: Files Referenced

| File | Issue(s) |
|------|----------|
| `OnlyYoursExpo/src/state/GameContext.js` | BUG-1, BUG-4 |
| `OnlyYoursExpo/src/state/AuthContext.js` | BUG-2, BUG-3, BUG-4, ARCH-1 |
| `OnlyYoursExpo/src/services/WebSocketService.js` | BUG-3, ARCH-4, FE-10 |
| `OnlyYoursExpo/src/services/api.js` | ARCH-1 |
| `OnlyYoursExpo/src/screens/PartnerLinkScreen.js` | UX-1 |
| `OnlyYoursExpo/src/screens/DashboardScreen.js` | UX-8 |
| `OnlyYoursExpo/src/screens/ProfileScreen.js` | UX-9 |
| `OnlyYoursExpo/src/screens/GameScreen.js` | UX-10 |
| `backend/src/main/java/com/onlyyours/security/SecurityConfig.java` | SEC-7 |
| `backend/src/main/java/com/onlyyours/config/WebSocketConfig.java` | SEC-1 |
| `backend/src/main/java/com/onlyyours/service/AuthService.java` | SEC-4, SEC-5 |
| `backend/src/main/java/com/onlyyours/service/JwtService.java` | SEC-8 |
| `backend/src/main/java/com/onlyyours/service/GameService.java` | ARCH-5, SEC-6 |
| `backend/src/main/java/com/onlyyours/controller/GameController.java` | CQ-5 |
| `docker-compose.yml` | DEVOPS-3 |
| `OnlyYoursExpo/app.json` | DEVOPS-6 |

---

*This review represents a point-in-time analysis of the codebase as of February 22, 2026. Items should be re-evaluated as the project evolves.*
