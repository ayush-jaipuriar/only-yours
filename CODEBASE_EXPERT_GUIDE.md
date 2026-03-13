# Only Yours Codebase Expert Guide

Last updated: March 14, 2026

This guide captures the current reality of the repository after a full code-reading pass across the backend, the Expo app, the legacy React Native CLI app, and the main docs/tests.

## Why this document exists

The repo already contains plans, sprint notes, and status documents, but several of them describe older states of the project. This guide focuses on what the code currently does, which app is active, where the business logic lives, and what to watch out for when making changes.

## High-level architecture

Only Yours is a realtime couples game with three main codebases:

- `backend/`
  - System-of-record for auth, couples, games, stats, badges, history, notification preferences, unlink cooldowns, and realtime events.
- `OnlyYoursExpo/`
  - Current mobile client.
  - Has the most complete user-facing feature set.
  - Uses Expo, raw WebSocket STOMP, Expo Notifications, theming, onboarding, accessibility helpers, and additional profile/settings/history screens.
- `OnlyYoursApp/`
  - Older React Native CLI client.
  - Still usable as a reference, but behind the Expo app in UX and feature surface.

The backend owns nearly all durable business rules. Frontends mostly orchestrate API requests, manage navigation, present state, and react to REST/WebSocket/push events.

## Repo structure

### Root

- Planning and implementation docs: sprint plans, PRDs, feasibility docs, status docs.
- `README.md`
  - Project entry point, now updated to reflect the current Expo-first reality.
- `TESTING_GUIDE.md`
  - Mostly historical; still useful as background, but not fully aligned with the current code.

### `backend/`

- `src/main/java/com/onlyyours/controller/`
  - REST controllers and the WebSocket controller.
- `src/main/java/com/onlyyours/service/`
  - Core domain logic.
- `src/main/java/com/onlyyours/model/`
  - JPA entities.
- `src/main/java/com/onlyyours/repository/`
  - Spring Data repositories.
- `src/main/java/com/onlyyours/security/`
  - JWT auth and rate limiting.
- `src/main/java/com/onlyyours/config/`
  - Password encoder and WebSocket config.
- `src/main/resources/db/migration/`
  - Flyway migrations from base schema through auth, continuation, stats indexes, unlink cooldowns, and user preferences.
- `src/test/java/com/onlyyours/`
  - Unit, integration, REST, and WebSocket tests.

### `OnlyYoursExpo/`

- `src/navigation/`
  - App-level routing.
- `src/state/`
  - Auth, game state, onboarding storage.
- `src/services/`
  - REST API client, WebSocket client, notification handling.
- `src/screens/`
  - Main product flows.
- `src/components/`
  - Shared UI primitives and guardrails.
- `src/theme/`
  - Theme tokens, gradients, motion, and provider.
- `src/accessibility/`
  - Accessibility helpers used across components.

### `OnlyYoursApp/`

- Mirrors much of the older flow, but without the newer Expo app's onboarding/history/settings/theme/accessibility depth.

## Current product features

### Authentication

Implemented in backend `AuthService` and Expo auth screens:

- Email/password registration
- Email/password login
- Access token + refresh token model
- Refresh-token rotation
- Logout revocation
- Forgot-password request
- Reset-password confirmation with one-time token

Important detail:

- Google sign-in is intentionally disabled in `AuthController` and `AuthService`.
- Historical docs still mention Google as primary auth, but that is no longer true in current runtime behavior.

### Couple linking

Implemented mainly in `CoupleService` and `CoupleController`:

- Generate a one-time partner code
- Redeem a partner code
- Prevent self-linking
- Prevent relinking while already linked
- Prevent new links during unlink cooldown
- Track `PENDING`, `ACTIVE`, and `UNLINKED` relationship states

### Gameplay

Implemented mainly in `GameService` and `GameController`:

- Inviter selects a category
- Backend creates one active invitation/session per couple
- Partner accepts or declines over WebSocket
- Round 1: both players answer 8 questions about themselves
- Round 2: both players guess the partner's answers
- Scores are calculated from guess correctness
- Final results are broadcast in realtime and can also be fetched over REST

### Continuation and recovery

Implemented in `GameService` and used by Expo:

- Active session summary endpoint
- Current-question recovery endpoint
- 7-day TTL for active sessions
- Automatic expiry promotion from active states to `EXPIRED`
- Duplicate invitation prevention if a couple already has an active session

### Dashboard, history, stats, badges

Implemented in `GameService` and exposed via `GameQueryController`:

- Active session summary
- Paginated game history
- Dashboard stats
- Badge milestones

### Profile and settings

Implemented via `UserController` and Expo screens:

- Profile view/edit
- Username normalization and uniqueness enforcement
- Optional bio
- Notification preferences
  - timezone
  - reminder time
  - quiet hours start/end
- Theme mode selection in Expo app
- Onboarding replay in Expo app

### Relationship unlink and recovery

Implemented in `CoupleService` and surfaced strongly in Expo `SettingsScreen`:

- Unlink requires a preview step and confirmation token
- Unlink blocked if an active game session exists
- Unlink starts a 24-hour cooldown
- Recovery with previous partner allowed during cooldown
- Recovery blocked if previous partner is already linked elsewhere

### Push notifications

Implemented across backend `PushNotificationService` and Expo `NotificationService`:

- Expo push-token registration/unregistration
- Invitation notifications
- Continue-game notifications
- Results-ready notifications
- Unlink/recovery notifications
- Notification taps can deep-link into `Game`, `Results`, `Dashboard`, or `Settings`

## Backend deep dive

## Core entities

### `User`

Key fields:

- `email`
- `name`
- `username`
- `bio`
- `passwordHash`
- `authProvider`
- `timezone`
- `reminderTimeLocal`
- `quietHoursStart`
- `quietHoursEnd`

Meaning:

- A user is both an authenticated principal and part of most business flows.
- Notification preference fields already exist in persistence, even though there is no background reminder scheduler in this repo yet.

### `Couple`

Key fields:

- `user1`
- `user2`
- `linkCode`
- `status`
- `createdAt`
- `linkedAt`
- `unlinkedAt`
- `cooldownEndsAt`
- `unlinkedByUser`
- `unlinkReason`

Meaning:

- A couple record is lifecycle-aware, not just a simple join table.
- It supports pending invites, active relationships, and recoverable unlink state.

### `GameSession`

Key fields:

- `couple`
- `status`
- `categoryId`
- `questionIds`
- `currentQuestionIndex`
- `player1Score`
- `player2Score`
- `createdAt`
- `startedAt`
- `completedAt`
- `expiresAt`
- `lastActivityAt`

Meaning:

- This entity is the game state machine.
- The backend persists selected question ids as a comma-separated string rather than a separate join table.

### `GameAnswer`

Key fields:

- `gameSession`
- `question`
- `user`
- `round1Answer`
- `round2Guess`

Meaning:

- One record per user per question.
- Score calculation compares each player's `round2Guess` with the partner's `round1Answer`.

## Backend controllers

### `AuthController`

REST endpoints:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/google/signin`
  - returns `410 GONE` because Google auth is disabled

### `UserController`

REST endpoints:

- `GET /api/user/me`
- `PUT /api/user/profile`
- `GET /api/user/preferences`
- `PUT /api/user/preferences`

### `CoupleController`

REST endpoints:

- `POST /api/couple/generate-code`
- `POST /api/couple/link`
- `GET /api/couple`
- `GET /api/couple/status`
- `POST /api/couple/unlink`
- `POST /api/couple/recover`

### `ContentController`

REST endpoints:

- `GET /api/content/categories`

### `GameQueryController`

REST endpoints:

- `GET /api/game/active`
- `GET /api/game/history`
- `GET /api/game/stats`
- `GET /api/game/badges`
- `GET /api/game/{sessionId}/current-question`
- `GET /api/game/{sessionId}/results`

### `GameController`

WebSocket message mappings:

- `/app/game.invite`
- `/app/game.accept`
- `/app/game.decline`
- `/app/game.answer`
- `/app/game.guess`

Destinations used for fanout:

- Private queue: `/user/queue/game-events`
- Private queue: `/user/queue/game-status`
- Private queue: `/user/queue/errors`
- Shared topic: `/topic/game/{sessionId}`

## Backend business logic that matters most

### Auth rules

- Emails and usernames are normalized to lowercase in `AuthService`.
- Registration returns a generic failure if either email or username already exists.
- Refresh tokens are stored hashed and rotated on refresh.
- Password reset invalidates older reset tokens for the same user.
- Password reset revokes all existing refresh tokens for the user.

### Couple rules

- A user cannot redeem their own link code.
- A user cannot create or redeem a link while already linked.
- A user in unlink cooldown cannot start a new link unless they recover the previous relationship or wait until cooldown ends.
- Unlink is blocked while the couple has an active game session.

### Game rules

- Exactly one active session per couple is enforced by both code and a partial unique index.
- Categories must have at least 8 questions or invitation acceptance fails.
- Session states are:
  - `INVITED`
  - `DECLINED`
  - `ROUND1`
  - `ROUND2`
  - `EXPIRED`
  - `COMPLETED`
- Active sessions automatically expire after 7 days.
- Duplicate answer/guess submissions are intentionally idempotent.
- Round 1 advances only when both players answer the same current question.
- Round 2 calculates correctness per player against the partner's original answer.

### History/stats/badges rules

- History only includes completed sessions.
- Stats include:
  - games played
  - average score
  - best score
  - streak days
  - invitation acceptance rate
  - average invitation response time
- Badges are derived, not separately persisted.

## Database evolution

The Flyway migrations tell the product story:

- `V1`
  - base tables for users, couples, categories, questions, game sessions, answers
- `V2`
  - seeds initial categories/questions
- `V3`
  - adds game-session flow tracking fields
- `V4`
  - adds more questions so categories support 8-question games
- `V5`
  - email/password auth, refresh tokens, password reset
- `V6`
  - Expo push tokens
- `V7`
  - session continuation metadata and unique active-session constraint
- `V8`
  - read/query indexes for history and stats
- `V9`
  - unlink/cooldown/recovery couple metadata
- `V10`
  - profile bio
- `V11`
  - notification preferences

## Expo app deep dive

## App shell and navigation

`OnlyYoursExpo/App.js` composes:

- `AppErrorBoundary`
- `GestureHandlerRootView`
- `ThemeProvider`
- `AuthProvider`
- `GameProvider`
- `AppNavigator`
- `ReconnectionBanner`

`AppNavigator` is split into:

- logged-out stack
  - `SignIn`
  - `SignUp`
  - `ForgotPassword`
  - `ResetPassword`
- logged-in stack
  - optional `Onboarding`
  - `Dashboard`
  - `Profile`
  - `Settings`
  - `GameHistory`
  - `PartnerLink`
  - `CategorySelection`
  - `Game`
  - `Results`

## `AuthContext`

Responsibilities:

- persist auth payload in AsyncStorage
- silent session bootstrap using refresh token
- manage WebSocket lifecycle
- subscribe to private game-event queue
- handle invitation/status alerts
- register Expo push tokens after realtime connects
- translate notification taps into navigation intents
- track onboarding status

Important design detail:

- AuthContext owns the navigation ref and a game-context ref so background events can open the right screen.

## `GameContext`

Responsibilities:

- track active session id
- subscribe to game topic and private event queue
- keep current question, current round, waiting state, guess results, scores
- recover current question from REST if topic timing is missed
- surface invitation-pending state for invited sessions

Important design detail:

- This context exists because realtime gameplay requires state shared across multiple screens and event sources.

## Expo services

### `api.js`

- Adds bearer access token automatically
- Refreshes token on `401` or `403` for non-auth endpoints
- Uses a single-flight queue so parallel expired requests only trigger one refresh

### `WebSocketService.js`

- Connects to `/ws-native`
- Uses access token in STOMP `Authorization` header
- Tracks `connected`, `disconnected`, and `reconnecting`
- Supports multiple subscriptions per destination

### `NotificationService.js`

- Registers device permissions and Expo push token
- Maps push payloads into in-app navigation intents
- Supports routes:
  - `Game`
  - `Results`
  - `Dashboard`
  - `Settings`

## Expo screens

### Auth screens

- `SignInScreen`
  - logs in with email/password
- `SignUpScreen`
  - registers and immediately logs in
- `ForgotPasswordScreen`
  - requests reset token
- `ResetPasswordScreen`
  - submits token + new password

### `OnboardingScreen`

- Three-step orientation flow:
  - link with partner
  - play round-by-round
  - track growth via history/stats/badges
- Backed by `onboardingStorage.js`

### `DashboardScreen`

- Main landing screen after auth
- Shows whether the user is linked
- Shows active game continuation if one exists
- Shows stats and badges
- Routes into history/profile/game setup

### `PartnerLinkScreen`

- Generate code flow
- Copy/share generated code
- Redeem partner code flow

### `CategorySelectionScreen`

- Loads categories from backend
- Warns before sensitive categories
- Sends invitation over WebSocket
- Prevents duplicate invite taps while an invite is in flight

### `GameScreen`

- Main realtime gameplay surface
- Handles:
  - round badge
  - progress
  - answer/guess choices
  - waiting state
  - invitation pending acceptance UI
  - round transition UI
  - temporary guess-result overlay

### `ResultsScreen`

- Displays scores either from realtime payload or by fetching `/game/{sessionId}/results`
- Animates scores
- Offers play-again and dashboard actions

### `ProfileScreen`

- Loads profile + badges
- Supports editing username and bio
- Routes into settings
- Logs out

### `SettingsScreen`

- Theme selection
- Notification preference editing
- Relationship status, unlink, recovery
- Onboarding replay

### `GameHistoryScreen`

- Paginated history browsing
- Sort and winner filters
- Uses `useGameHistoryFlow.js`

## Legacy React Native CLI app status

The legacy app still shares much of the original architecture:

- auth context
- game context
- sign-in/sign-up/reset flows
- dashboard
- partner link
- category selection
- game/results

But compared to Expo it is missing or behind on:

- onboarding
- settings
- history
- theme system
- accessibility helper layer
- Expo notifications
- richer reconnection handling
- `/ws-native` realtime client adaptation

Practical recommendation:

- Treat `OnlyYoursApp` as a migration artifact and fallback reference.
- Treat `OnlyYoursExpo` as the real frontend unless a task explicitly targets native-cli.

## Test coverage overview

## Backend tests

Strong coverage exists across:

- auth service
- couple service
- game service
- push notification dedupe
- REST controllers
- WebSocket controller flows
- integration tests for auth, couple linking, content

Notable signal:

- There are dedicated tests for stuck-round recovery and idempotent duplicate submissions, which suggests those were real failure modes the code intentionally hardens against.

## Expo tests

There are tests for:

- WebSocket service
- notification service
- config
- auth/game contexts
- onboarding storage
- dashboard/history flows
- settings/profile/onboarding flows
- theme provider
- several screens

## Legacy app tests

Exists, but the Expo app has the richer and more current test surface.

## Important inconsistencies and risks

### Docs are partially stale

- Root `README.md` was previously centered on Google auth and the old React Native CLI app.
- `PROJECT_STATUS.md` still describes some features as not started even though the code implements them.
- `TESTING_GUIDE.md` is still heavily Google-auth and `OnlyYoursApp` oriented.

### Backend/controller payload contracts rely on frontend expectations

- WebSocket event handling assumes payloads can be classified by `type` or `status`.
- This works today, but the contract is implicit in places and could drift if backend DTOs change without paired frontend updates.

### `GameSession.questionIds` is stored as comma-separated text

- This simplifies persistence but makes some data validation and querying less explicit than a normalized join table.
- It is fine for current scale, but worth remembering if analytics or auditing grows.

### Push preferences are persisted but not scheduled

- Users can edit reminder settings, but there is no reminder scheduler in this repo yet.
- The current implementation stores preference intent, not a completed reminder system.

### Some styling in gameplay screens still carries legacy hardcoded values

- The Expo app is much more theme-aware than the legacy app, but `GameScreen` still contains a fair amount of base style constants that are then partially overridden dynamically.

## Where to start for future work

If you want to change:

- auth/session behavior
  - start in `backend/src/main/java/com/onlyyours/service/AuthService.java`
  - then check `OnlyYoursExpo/src/state/AuthContext.js`
  - then check `OnlyYoursExpo/src/services/api.js`
- couple linking/unlinking
  - start in `backend/src/main/java/com/onlyyours/service/CoupleService.java`
  - then check `OnlyYoursExpo/src/screens/PartnerLinkScreen.js`
  - then check `OnlyYoursExpo/src/screens/SettingsScreen.js`
- gameplay flow
  - start in `backend/src/main/java/com/onlyyours/service/GameService.java`
  - then check `backend/src/main/java/com/onlyyours/controller/GameController.java`
  - then check `OnlyYoursExpo/src/state/GameContext.js`
  - then check `OnlyYoursExpo/src/screens/GameScreen.js`
- history/stats/badges
  - start in `backend/src/main/java/com/onlyyours/service/GameService.java`
  - then check `OnlyYoursExpo/src/screens/useDashboardGameFlow.js`
  - then check `OnlyYoursExpo/src/screens/useGameHistoryFlow.js`
- profile/settings UX
  - start in `backend/src/main/java/com/onlyyours/controller/UserController.java`
  - then check `OnlyYoursExpo/src/screens/ProfileScreen.js`
  - then check `OnlyYoursExpo/src/screens/SettingsScreen.js`

## What changed while producing this guide

Documentation changes in this iteration:

- Updated `README.md`
  - corrected the repo overview
  - marked Expo as the current mobile app
  - noted Google sign-in is no longer the active auth path
  - added a pointer to this guide
- Added `CODEBASE_EXPERT_GUIDE.md`
  - documented repo structure
  - documented current feature set
  - summarized backend architecture and business rules
  - summarized Expo frontend architecture
  - compared the Expo and legacy mobile apps
  - captured notable risks and stale-doc issues

No product code was changed.

## Suggested next documentation updates

- Refresh `TESTING_GUIDE.md` so it matches email/password auth and the Expo-first workflow.
- Bring `PROJECT_STATUS.md` back in sync with current implementation reality.
- Add a short API/WebSocket contract doc generated from the current controllers/DTOs if the team expects more parallel frontend/backend work.
