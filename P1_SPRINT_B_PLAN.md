# P1 Sprint B Plan — Features: Email Reset, Push Notifications, CI Pipeline

**Created:** February 22, 2026  
**Source:** PROJECT_REVIEW.md P1 items + P1_DECISION_MEMO.md decisions  
**Scope:** 3 items — PRODUCT-1 (Email Reset), PRODUCT-2 (Push Notifications), DEVOPS-1 (CI Pipeline)  
**Status:** Implementation complete

---

## Table of Contents

1. [Sprint Overview](#1-sprint-overview)
2. [Task 1: Email Password Reset via Resend (PRODUCT-1)](#2-task-1-email-password-reset-via-resend-product-1)
3. [Task 2: Expo Push Notifications (PRODUCT-2)](#3-task-2-expo-push-notifications-product-2)
4. [Task 3: GitHub Actions CI Pipeline (DEVOPS-1)](#4-task-3-github-actions-ci-pipeline-devops-1)
5. [Implementation Summary](#5-implementation-summary)

---

## 1. Sprint Overview

Sprint B delivers three features that transform the app from "developer prototype" to "shippable product":

- **Email Reset**: Makes the forgot-password flow actually usable (previously, the token was generated but never delivered)
- **Push Notifications**: Keeps users engaged even when the app is backgrounded (invitations, game events, partner linking)
- **CI Pipeline**: Ensures every push/PR is automatically built and tested

---

## 2. Task 1: Email Password Reset via Resend (PRODUCT-1)

### Problem

The `requestPasswordReset` method generates a raw UUID token, hashes it with SHA-256, stores the hash in the database — but never delivers the raw token to the user. The forgot-password feature is completely broken from a user's perspective.

### Theory: Transactional Email APIs

Traditional email delivery requires configuring an SMTP server, managing TLS certificates, setting up SPF/DKIM/DMARC DNS records for deliverability, and monitoring bounce rates. **Resend** abstracts all of this behind a simple REST API:

```
POST https://api.resend.com/emails
Authorization: Bearer re_xxxxx
{
  "from": "noreply@onlyyours.app",
  "to": ["user@example.com"],
  "subject": "Password Reset",
  "text": "Your code is: abc123"
}
```

The free tier provides 100 emails/day — perfect for MVP. No SMTP configuration, no infrastructure.

### Architecture

```
User clicks "Forgot Password"
  → Frontend POST /api/auth/forgot-password { email }
  → AuthService.requestPasswordReset(email)
    → Generate raw UUID token
    → Hash with SHA-256, store hash in DB
    → EmailService.sendPasswordResetEmail(email, rawToken)
      → POST to Resend API (or log in dev mode if no API key)
  → Return generic "check your email" message
  → User receives email, copies code
  → Frontend POST /api/auth/reset-password { token, newPassword }
```

### Dev Mode Fallback

When `RESEND_API_KEY` is empty (local development without Resend), the `EmailService` logs the raw token to console instead of sending an email. This preserves the existing dev workflow.

### Files

| File | Change |
|------|--------|
| `backend/src/main/java/com/onlyyours/service/EmailService.java` | **NEW** — Resend API client with RestClient |
| `backend/src/main/java/com/onlyyours/service/AuthService.java` | Injected `EmailService`, call `sendPasswordResetEmail()` |
| `backend/src/main/resources/application.properties` | Added `resend.api-key` and `resend.from-email` |
| `docker-compose.yml` | Added `RESEND_API_KEY` env var passthrough |
| `.env.example` | Added `RESEND_API_KEY` placeholder |

### Checklist

- [x] Create `EmailService.java` with Resend HTTP API integration
- [x] Add dev-mode fallback (log token when no API key)
- [x] Inject `EmailService` into `AuthService`
- [x] Call `sendPasswordResetEmail()` in `requestPasswordReset()`
- [x] Add `resend.api-key` and `resend.from-email` to `application.properties`
- [x] Add `RESEND_API_KEY` to `docker-compose.yml` and `.env.example`
- [x] Backend compiles and all tests pass

---

## 3. Task 2: Expo Push Notifications (PRODUCT-2)

### Problem

Users have no way to know about game invitations, partner linking, or other events when the app is backgrounded. This is critical for a couples app where asynchronous interaction is the primary use case.

### Theory: Expo Push Notification Architecture

Expo Push works in three layers:

**Layer 1 — Client Registration:**
The app calls `Notifications.getExpoPushTokenAsync()` which:
1. Checks device capabilities (`Device.isDevice` — push doesn't work on emulators)
2. Requests OS-level permission
3. Registers with Firebase Cloud Messaging (Android) behind the scenes
4. Returns a token like `ExponentPushToken[xxxx]`

**Layer 2 — Token Storage:**
The app sends this token to the backend via REST. The backend stores it in a `push_tokens` table, associated with the user. One user can have multiple tokens (multiple devices).

**Layer 3 — Server-Side Sending:**
When an event occurs, the backend sends a POST to `https://exp.host/--/api/v2/push/send` with:
```json
{
  "to": "ExponentPushToken[xxxx]",
  "title": "Game Invitation",
  "body": "Partner wants to play!",
  "sound": "default",
  "data": { "type": "INVITATION", "sessionId": "uuid" }
}
```

Expo's push service handles the routing to FCM (Android) or APNs (iOS).

### Token Bucket Algorithm (again)

The push token is registered once per login session. If the user logs out, we don't unregister (tokens expire naturally on Expo's side). If they log in on a new device, a new token is registered. The `UNIQUE(token)` constraint prevents duplicates.

### Trigger Events

| Event | Title | Body | Where |
|-------|-------|------|-------|
| Invitation Received | "Game Invitation" | "{name} wants to play with you!" | `GameController.handleInvitation` |
| Invitation Declined | "Invitation Declined" | "{name} declined the game invitation" | `GameController.handleDecline` |
| Partner Linked | "Partner Linked!" | "{name} just linked with you on Only Yours" | `CoupleController.link` |

### Files

**Backend:**

| File | Change |
|------|--------|
| `backend/src/main/resources/db/migration/V6__Push_Notification_Tokens.sql` | **NEW** — push_tokens table |
| `backend/src/main/java/com/onlyyours/model/PushToken.java` | **NEW** — JPA entity |
| `backend/src/main/java/com/onlyyours/repository/PushTokenRepository.java` | **NEW** — Spring Data repository |
| `backend/src/main/java/com/onlyyours/dto/PushTokenRequestDto.java` | **NEW** — Registration DTO |
| `backend/src/main/java/com/onlyyours/service/PushNotificationService.java` | **NEW** — Token management + Expo Push API |
| `backend/src/main/java/com/onlyyours/controller/PushTokenController.java` | **NEW** — REST endpoints for register/unregister |
| `backend/src/main/java/com/onlyyours/controller/GameController.java` | Added push sends on invitation/decline |
| `backend/src/main/java/com/onlyyours/controller/CoupleController.java` | Added push send on partner link |

**Frontend:**

| File | Change |
|------|--------|
| `OnlyYoursExpo/src/services/NotificationService.js` | **NEW** — Push registration + listeners |
| `OnlyYoursExpo/src/state/AuthContext.js` | Added `registerPushNotifications()` call after login |
| `OnlyYoursExpo/app.json` | Added `expo-notifications` plugin config |
| `OnlyYoursExpo/package.json` | Added `expo-notifications`, `expo-device`, `expo-constants` |

### Checklist

- [x] Create Flyway migration V6 for `push_tokens` table
- [x] Create `PushToken` JPA entity
- [x] Create `PushTokenRepository`
- [x] Create `PushTokenRequestDto`
- [x] Create `PushNotificationService` (register/unregister/sendToUser)
- [x] Create `PushTokenController` with register/unregister endpoints
- [x] Add push send on game invitation received
- [x] Add push send on game invitation declined
- [x] Add push send on partner linked
- [x] Install `expo-notifications`, `expo-device`, `expo-constants`
- [x] Create `NotificationService.js` with registration and listeners
- [x] Integrate push registration into `AuthContext` login flow
- [x] Configure `expo-notifications` plugin in `app.json`
- [x] Set Android notification channel (purple accent)
- [x] Backend compiles and all tests pass
- [x] Frontend tests pass (38/38)

---

## 4. Task 3: GitHub Actions CI Pipeline (DEVOPS-1)

### Problem

No CI pipeline exists. Code changes are pushed directly without automated testing.

### Theory: Monorepo CI with Path Filters

In a monorepo, you don't want every push to run every job. **Path filtering** solves this:

1. A `changes` job uses `dorny/paths-filter@v3` to detect which directories changed
2. Downstream jobs use `if: needs.changes.outputs.backend == 'true'` to skip irrelevant work
3. This saves CI minutes and provides faster feedback

The workflow structure:

```
push/PR to main
  └── changes (path detection)
        ├── backend job (if backend/** changed)
        │   ├── JDK 17 setup
        │   ├── Gradle cache
        │   ├── ./gradlew build
        │   └── Upload test results
        └── frontend job (if OnlyYoursExpo/** changed)
            ├── Node.js 24 setup
            ├── npm ci
            └── jest --ci
```

### Files

| File | Change |
|------|--------|
| `.github/workflows/ci.yml` | **NEW** — CI workflow with path-filtered jobs |

### Checklist

- [x] Create `.github/workflows/ci.yml`
- [x] Add `changes` job with `dorny/paths-filter`
- [x] Add `backend` job (JDK 17, Gradle cache, build+test, artifact upload)
- [x] Add `frontend` job (Node 24, npm ci, jest)
- [x] Both jobs conditionally skip based on path changes

---

## 5. Implementation Summary

**Completed:** February 22, 2026

### Test Results

| Suite | Tests | Status |
|-------|-------|--------|
| Frontend (Jest) | 38 | All passing |
| Backend (JUnit) | All | All passing |
| Backend compilation | — | Clean |

### Files Created (11 new files)

| File | Purpose |
|------|---------|
| `backend/src/main/java/com/onlyyours/service/EmailService.java` | Resend API email delivery |
| `backend/src/main/java/com/onlyyours/service/PushNotificationService.java` | Push token management + Expo push API |
| `backend/src/main/java/com/onlyyours/controller/PushTokenController.java` | REST endpoints for push registration |
| `backend/src/main/java/com/onlyyours/model/PushToken.java` | JPA entity for push tokens |
| `backend/src/main/java/com/onlyyours/repository/PushTokenRepository.java` | Spring Data repository |
| `backend/src/main/java/com/onlyyours/dto/PushTokenRequestDto.java` | Push token registration DTO |
| `backend/src/main/resources/db/migration/V6__Push_Notification_Tokens.sql` | Flyway migration |
| `OnlyYoursExpo/src/services/NotificationService.js` | Frontend push notification service |
| `.github/workflows/ci.yml` | GitHub Actions CI pipeline |

### Files Modified (8 files)

| File | Change |
|------|--------|
| `backend/src/main/java/com/onlyyours/service/AuthService.java` | Injected EmailService, sends email on password reset |
| `backend/src/main/java/com/onlyyours/controller/GameController.java` | Push sends on invitation/decline events |
| `backend/src/main/java/com/onlyyours/controller/CoupleController.java` | Push send on partner link |
| `backend/src/main/resources/application.properties` | Added Resend config |
| `docker-compose.yml` | Added RESEND_API_KEY env var |
| `.env.example` | Added RESEND_API_KEY placeholder |
| `OnlyYoursExpo/src/state/AuthContext.js` | Push registration after login |
| `OnlyYoursExpo/app.json` | expo-notifications plugin + Android config |

### Local Build Priority Updates

| File | Change |
|------|--------|
| `.cursor/rules/local-build-priority.mdc` | Added always-on rule to prefer local mobile builds over cloud builds by default |
| `OnlyYoursExpo/.npmrc` | Added `legacy-peer-deps=true` to prevent Expo/EAS npm peer resolution failures |
| `OnlyYoursExpo/scripts/local-android-build.sh` | Added deterministic local Android build script (Node 24 check + Java 17 + SDK env setup + prebuild + assembleDebug) |
| `OnlyYoursExpo/package.json` | Added `android:local-build` npm script |
| `backend/src/main/resources/application.properties` | `RESEND_FROM_EMAIL` now env-driven with default `onboarding@resend.dev` for no-domain mode |
| `docker-compose.yml` | Added `RESEND_FROM_EMAIL` passthrough |
| `.env.example` | Added `RESEND_FROM_EMAIL` guidance for no-domain and verified-domain modes |

### Local Device Networking Update

| File | Change |
|------|--------|
| `OnlyYoursExpo/.env` | Set `EXPO_PUBLIC_API_URL` to LAN endpoint `http://192.168.1.101:8080` so a phone on the same Wi-Fi can reach local backend |
| `OnlyYoursExpo/.env.example` | Added guidance for LAN-IP based backend URL for physical device testing |

### Post-Implementation Stabilization Fixes (Local Runtime)

| File | Fix | Why |
|------|-----|-----|
| `backend/src/main/java/com/onlyyours/security/SecurityConfig.java` | Permitted `/ws-native` and `/ws-native/**` | Native mobile STOMP connects to `/ws-native`; it was blocked by Spring Security causing WebSocket timeouts |
| `backend/src/main/resources/application.properties` | Added `spring.config.import=optional:file:.env[.properties],optional:file:../.env[.properties]` | Ensures local backend picks up root `.env` values (including `RESEND_API_KEY`) even when launched from backend module/IDE |
| `OnlyYoursExpo/src/services/WebSocketService.js` | Added robust connect lifecycle (in-flight guard, close/error rejection, richer timeout context) | Prevents silent timeout paths and gives explicit failure reasons for mobile WebSocket issues |
| `OnlyYoursExpo/src/services/WebSocketService.js` | Enabled React Native STOMP compatibility (`forceBinaryWSFrames`, `appendMissingNULLonIncoming`, explicit subprotocols) | Fixes Android dev-client scenario where socket opens but STOMP `CONNECTED` is never parsed due NULL frame terminator truncation |
| `OnlyYoursExpo/src/state/AuthContext.js` | Added retry/backoff connect flow + background reconnect attempts | Improves realtime reliability if first connect happens before backend/network are fully ready |
| `OnlyYoursExpo/src/screens/CategorySelectionScreen.js` | Added `isConnected()` guard before sending invites | Prevents false “Invitation Sent” UI when realtime connection is actually down |
| `backend/src/main/java/com/onlyyours/service/EmailService.java` | Added startup diagnostics + sanitized key/from-email normalization | Makes `RESEND_API_KEY` status explicit at startup and avoids repeated per-request warning noise |
| `OnlyYoursExpo/src/state/AuthContext.js` | Replaced broad destination unsubscribe with owned-subscription cleanup + handled `INVITATION_ACCEPTED` status | Prevents AuthContext reconnect logic from accidentally removing GameContext listeners and improves sender/receiver game synchronization |
| `OnlyYoursExpo/src/state/GameContext.js` | Added explicit teardown of previous topic/private subscriptions before each `startGame()` | Fixes stale multi-session listeners that could cause duplicate or mismatched game events across repeated invitations |
| `OnlyYoursExpo/src/screens/CategorySelectionScreen.js` | Replaced blocking "Invitation Sent" alert with non-blocking Android toast | Eliminates sender-side stuck "Waiting for partner..." modal while game state transitions in background |
| `backend/src/main/java/com/onlyyours/controller/GameController.java` | Reordered invitation event sequence and added `INVITATION_ACCEPTED` status emission | Reduces race window where inviter could miss early game setup events if invitee accepts quickly |
| `OnlyYoursExpo/src/services/NotificationService.js` | Added Firebase-init specific diagnostics + projectId fallback + deviceId registration | Makes push failures actionable and improves backend token metadata for multi-device testing |
| `OnlyYoursExpo/app.config.js` | Added dynamic Expo config to wire `googleServicesFile` only when file exists | Keeps local builds stable without Firebase file while enabling push setup as soon as config file is added |
| `OnlyYoursExpo/scripts/local-android-build.sh` | Added `EXPO_FORCE_PREBUILD=1` path + Firebase config copy step | Ensures native config/plugins can be resynced deterministically and reduces local push setup drift |
| `OnlyYoursExpo/src/state/GameContext.js` | Made `startGame()` idempotent per session and added shared payload handler for topic/private channels | Prevents duplicate resets that can blank `currentQuestion` and avoids diverging state between sender/receiver |
| `backend/src/main/java/com/onlyyours/controller/GameController.java` | Added first-question private fallback to both users on accept (in addition to topic broadcast) | Covers rare subscribe timing race where one device can miss initial `/topic/game/{sessionId}` question |
| `OnlyYoursExpo/src/screens/CategorySelectionScreen.js` | Added invite-in-flight guard and disabled repeated category taps until screen refocus | Prevents accidental multi-session invitation spam that can desynchronize both devices |
| `OnlyYoursExpo/src/state/AuthContext.js` | Added same-route navigation guard before navigating to `Game` | Reduces duplicate navigation churn during rapid `INVITATION_SENT` + `INVITATION_ACCEPTED` event sequences |

### User Action Required

**Create `.env` file** at the repository root with your secrets:

```bash
cp .env.example .env
# Then edit .env and fill in:
# - DATABASE_PASSWORD
# - JWT_SECRET
# - RESEND_API_KEY (your actual key)
# - RESEND_FROM_EMAIL (use onboarding@resend.dev until domain is verified)
```

**Important:** The Resend `from` email (`noreply@onlyyours.app`) requires a verified domain in Resend. During development, Resend allows sending from `onboarding@resend.dev` to your own email. To send to any address, you'll need to verify your domain in Resend's dashboard.
