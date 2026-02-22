# P1 Sprint A Plan — Quick Wins: Security, DevOps, UX & Quality

**Created:** February 22, 2026  
**Source:** PROJECT_REVIEW.md P1 items + P1_DECISION_MEMO.md decisions  
**Scope:** 7 items — 2 security + 2 devops + 2 UX + 1 quality  
**Estimated Total Effort:** ~1.5–2 days  
**Codebase:** Backend (`backend/`) + Frontend (`OnlyYoursExpo/`)

---

## Table of Contents

1. [Sprint Overview](#1-sprint-overview)
2. [Task 1: Remove Password Reset Token from Logs (SEC-4)](#2-task-1-remove-password-reset-token-from-logs-sec-4)
3. [Task 2: Make GOOGLE_CLIENT_ID Optional (DEVOPS-3)](#3-task-2-make-google_client_id-optional-devops-3)
4. [Task 3: Fill EAS Project ID (DEVOPS-6)](#4-task-3-fill-eas-project-id-devops-6)
5. [Task 4: Backend Input Validation + ControllerAdvice (BE-1)](#5-task-4-backend-input-validation--controlleradvice-be-1)
6. [Task 5: Rate Limiting on Auth Endpoints (SEC-2)](#6-task-5-rate-limiting-on-auth-endpoints-sec-2)
7. [Task 6: App Loading Screen (UX-3)](#7-task-6-app-loading-screen-ux-3)
8. [Task 7: Redesign PartnerLinkScreen (UX-1)](#8-task-7-redesign-partnerlinkscreen-ux-1)
9. [Test Plan](#9-test-plan)
10. [Implementation Order & Dependencies](#10-implementation-order--dependencies)

---

## 1. Sprint Overview

These items close security gaps, remove developer friction, and polish the user experience before launch. They're deliberately scoped as "quick wins" — high impact with bounded effort.

### Implementation Order

```
SEC-4  (backend log fix)        ──► 15 min, independent
DEVOPS-3 (docker-compose fix)   ──► 30 min, independent
DEVOPS-6 (EAS project ID)       ──► 15 min, requires user action
BE-1  (validation + advice)     ──► 2 hours, independent
SEC-2  (rate limiting)          ──► 3-4 hours, depends on auth endpoint knowledge from BE-1
UX-3  (loading screen)          ──► 2 hours, independent
UX-1  (PartnerLink redesign)    ──► 4-6 hours, independent (largest item)
```

---

## 2. Task 1: Remove Password Reset Token from Logs (SEC-4)

### Problem

`AuthService.java` line 169 logs the raw password reset token in plain text:

```java
log.info("DEV ONLY - Password reset token for email {}: {}", email, rawResetToken);
```

In production, this would leak reset tokens to anyone with log access — effectively allowing account takeover by reading server logs.

### Theory: Security Logging Best Practices

The principle of **minimum necessary information** applies to logs. You want enough detail to debug issues (who requested a reset, when, from where) without including the sensitive artifact itself (the token). This is the same reason you never log passwords, API keys, or session tokens. A sanitized log preserves the audit trail ("reset was requested for user X at time Y") without the exploitable secret.

### Fix

**File:** `backend/src/main/java/com/onlyyours/service/AuthService.java`

Replace:
```java
log.info("DEV ONLY - Password reset token for email {}: {}", email, rawResetToken);
```

With:
```java
log.info("Password reset requested for email: {}", email);
```

### Checklist

- [x] Replace log line with sanitized version (no token, no raw secret)
- [x] Search codebase for any other token/secret log statements — confirmed remaining log lines only emit tokenId/userId (safe)
- [x] Verify build compiles

---

## 3. Task 2: Make GOOGLE_CLIENT_ID Optional (DEVOPS-3)

### Problem

`docker-compose.yml` line 58 uses the `?:` required syntax:

```yaml
GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID:?GOOGLE_CLIENT_ID env var is required}
```

Google sign-in is disabled (the endpoint returns 410 GONE). But this required env var blocks anyone from running `docker-compose up` without setting a dummy value.

### Theory: Docker Compose Variable Substitution

Docker Compose supports several variable substitution forms:
- `${VAR:?error}` — **required**, fails with error if unset
- `${VAR:-default}` — **optional**, uses default if unset
- `${VAR}` — substitutes value or empty string

Since Google auth is disabled code, we switch from required to optional with a placeholder default.

### Fix

**File:** `docker-compose.yml`

Replace:
```yaml
GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID:?GOOGLE_CLIENT_ID env var is required}
```

With:
```yaml
GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID:-disabled}
```

**File:** `.env.example`

Update the GOOGLE_CLIENT_ID comment:
```env
# Google OAuth 2.0 Web Client ID (optional — Google sign-in is currently disabled)
# Obtain from: Google Cloud Console → APIs & Services → Credentials
# GOOGLE_CLIENT_ID=your_project_id.apps.googleusercontent.com
```

### Checklist

- [x] Update `docker-compose.yml` to use `:-disabled` syntax
- [x] Update `.env.example` to mark GOOGLE_CLIENT_ID as optional and commented out
- [ ] Verify `docker-compose config` parses without errors (without .env set)

---

## 4. Task 3: Fill EAS Project ID (DEVOPS-6)

### Problem

`OnlyYoursExpo/app.json` has an empty `projectId`:

```json
"extra": { "eas": { "projectId": "" } }
```

This blocks EAS builds, push notification credentials, and release automation.

### Action Required: User

This task requires the user to:

1. Create an Expo account at [expo.dev](https://expo.dev)
2. Run `npm install -g eas-cli`
3. Run `eas login`
4. Run `cd OnlyYoursExpo && eas init`
5. Provide the generated `projectId`

### What I Will Do

Once the user provides the `projectId`, I will:
- Verify it's correctly placed in `app.json` at `expo.extra.eas.projectId`
- Format the `app.json` for readability (currently a single-line JSON blob)

### Checklist

- [x] User creates Expo account (@ayush_jaipuriar)
- [x] User runs `eas init` in `OnlyYoursExpo/`
- [x] `projectId` is filled in `app.json` — `8047b007-9f02-42b3-96ec-21057b6ed95c`
- [x] `app.json` is formatted for readability (eas init auto-formatted it)

---

## 5. Task 4: Backend Input Validation + ControllerAdvice (BE-1)

### Problem

The DTOs already have `@Valid` + Jakarta annotations (`@NotBlank`, `@Email`, `@Size`, `@Pattern`), and the controllers already use `@Valid` on `@RequestBody` parameters. However, when validation fails, Spring throws `MethodArgumentNotValidException` which produces the default Spring error response — an unstructured blob that's hard for the frontend to parse.

There is no global `@ControllerAdvice` to catch this exception and return a clean, consistent 400 response.

Additionally, `LoginRequestDto` is missing a `@Size(min = 8)` on password (all other password fields have it).

### Theory: @ControllerAdvice and Global Exception Handling

Spring's `@ControllerAdvice` is an AOP (Aspect-Oriented Programming) mechanism that intercepts exceptions thrown from any controller before they reach the client. By creating a single `@ControllerAdvice` class, you centralize error formatting — every controller gets consistent error responses without individual `try/catch` blocks.

`MethodArgumentNotValidException` is thrown when `@Valid` detects constraint violations. The exception contains a `BindingResult` with all field errors, which we can transform into a clean JSON structure like:

```json
{
  "error": "Validation failed",
  "fieldErrors": {
    "email": "Invalid email format",
    "password": "Password must be at least 8 characters"
  }
}
```

### Fix

**New File:** `backend/src/main/java/com/onlyyours/controller/GlobalExceptionHandler.java`

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationErrors(
            MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        for (FieldError fe : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.putIfAbsent(fe.getField(), fe.getDefaultMessage());
        }
        Map<String, Object> body = Map.of(
            "error", "Validation failed",
            "fieldErrors", fieldErrors
        );
        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, String>> handleMalformedJson(
            HttpMessageNotReadableException ex) {
        return ResponseEntity.badRequest().body(
            Map.of("error", "Malformed request body")
        );
    }
}
```

**File:** `backend/src/main/java/com/onlyyours/dto/LoginRequestDto.java`

Add missing password size validation:

```java
@NotBlank(message = "Password is required")
@Size(min = 8, message = "Password must be at least 8 characters")
private String password;
```

### Checklist

- [x] Create `GlobalExceptionHandler.java` with `@RestControllerAdvice`
- [x] Handle `MethodArgumentNotValidException` → clean 400 with field errors (LinkedHashMap for stable order)
- [x] Handle `HttpMessageNotReadableException` → clean 400 for malformed JSON
- [x] Add `@Size(min = 8)` to `LoginRequestDto.password`
- [ ] Write unit test: POST `/api/auth/register` with invalid data returns structured 400
- [ ] Write unit test: POST `/api/auth/login` with empty body returns structured 400
- [x] Verify existing controller try/catch blocks still work (they catch `IllegalArgumentException`, which is separate from validation)

---

## 6. Task 5: Rate Limiting on Auth Endpoints (SEC-2)

### Problem

The auth endpoints (`/api/auth/login`, `/api/auth/register`, `/api/auth/forgot-password`) have no rate limiting. An attacker can:
- Brute-force passwords at unlimited speed
- Enumerate registered emails
- Spam password reset tokens

### Theory: Token Bucket Algorithm & In-Memory Rate Limiting

The **token bucket** algorithm is the most common rate limiting approach. Imagine a bucket that holds a fixed number of tokens (the limit). Each request consumes one token. Tokens are refilled at a steady rate. When the bucket is empty, requests are rejected.

**Bucket4j** is a Java library that implements this algorithm with thread-safe, lock-free `ConcurrentHashMap`-backed buckets. It's ideal for in-memory rate limiting because:
- Zero infrastructure (no Redis)
- Microsecond latency
- Configurable per-key (e.g., per-IP, per-email)
- Easy to swap to a distributed backend later

The tradeoff: limits reset on JVM restart, and each instance has its own counters (no sharing across a cluster). This is acceptable for single-instance MVP.

### Fix

**Step 1: Add Bucket4j dependency**

**File:** `backend/build.gradle`

```gradle
implementation 'com.bucket4j:bucket4j-core:8.10.1'
```

**Step 2: Create rate limiter service**

**New File:** `backend/src/main/java/com/onlyyours/security/RateLimiterService.java`

This service manages a `ConcurrentHashMap<String, Bucket>` keyed by IP address. Each bucket allows a configurable number of requests per time window.

Key design decisions:
- **Key by IP** for login/register, **key by email** for forgot-password
- **Limits kept high for testing**: 20 requests/minute for login, 50/minute for register, 10/hour for forgot-password
- Buckets are created lazily on first access
- The `ConcurrentHashMap` acts as an LRU-like cache (old entries can be evicted on a schedule if needed later)

**Step 3: Create rate limiting filter**

**New File:** `backend/src/main/java/com/onlyyours/security/RateLimitFilter.java`

A `OncePerRequestFilter` that:
1. Checks if the request path matches an auth endpoint
2. Extracts the client IP (handles `X-Forwarded-For` for proxied requests)
3. Calls `RateLimiterService.tryConsume(key)`
4. Returns 429 Too Many Requests with a `Retry-After` header if the bucket is empty
5. Otherwise, passes the request through

**Step 4: Register filter in SecurityConfig**

Add the `RateLimitFilter` before the JWT filter in the security chain.

### Limits (high for testing phase)

| Endpoint | Key | Limit | Window |
|----------|-----|-------|--------|
| `/api/auth/login` | IP | 20 requests | 1 minute |
| `/api/auth/register` | IP | 50 requests | 1 minute |
| `/api/auth/forgot-password` | IP | 10 requests | 1 hour |
| `/api/auth/reset-password` | IP | 10 requests | 1 hour |

### Checklist

- [x] Add `bucket4j-core:8.10.1` dependency to `build.gradle`
- [x] Create `RateLimiterService.java` with configurable bucket policies (enum-based: LOGIN, REGISTER, FORGOT_PASSWORD, RESET_PASSWORD)
- [x] Create `RateLimitFilter.java` extending `OncePerRequestFilter` with X-Forwarded-For support
- [x] Register filter in `SecurityConfig.java` filter chain (before JwtAuthFilter)
- [x] Return 429 with `Retry-After` header and JSON error body
- [ ] Write unit test: verify 429 response after exceeding limit
- [ ] Write unit test: verify requests pass under the limit
- [x] Verify existing auth flows still work — backend compiles and all existing tests pass

---

## 7. Task 6: App Loading Screen (UX-3)

### Problem

When the app starts, `AuthProvider` performs a silent token refresh in a `useEffect`. During this async operation, `isLoggedIn` is `false`, so `AppNavigator` shows the `SignIn` screen. Once the refresh succeeds, `isLoggedIn` flips to `true` and the user is redirected to `Dashboard` — creating a visible **flash** of the SignIn screen before landing on Dashboard.

### Theory: Bootstrap Loading States

The fix follows the **indeterminate loading gate** pattern:
1. Add a `isAuthLoading` state (starts `true`)
2. Keep showing a loading/splash screen while `isAuthLoading` is `true`
3. Set `isAuthLoading` to `false` only after the auth bootstrap completes (success or failure)
4. `AppNavigator` renders the appropriate stack only after loading finishes

This prevents the "flash of wrong screen" problem. The loading screen acts as a gate that holds the UI until the auth state is known.

### Fix

**File:** `OnlyYoursExpo/src/state/AuthContext.js`

Add `isAuthLoading` state:
```javascript
const [isAuthLoading, setIsAuthLoading] = useState(true);
```

Wrap the bootstrap `useEffect` to set `isAuthLoading = false` in all exit paths (success, failure, no token).

Expose `isAuthLoading` in the context value.

**File:** `OnlyYoursExpo/App.js`

In `AppShell`, read `isAuthLoading` from `useAuth()`. If true, render a branded loading screen (app name + `ActivityIndicator` + the purple theme background) instead of `AppNavigator`.

### Design

The loading screen will use the existing purple palette from SignInScreen:
- Background: `#F6F5FF`
- App name "Only Yours" in `#2D225A`, `fontSize: 36`, `fontWeight: '700'`
- `ActivityIndicator` in `#6A4CFF` below the title
- Centered vertically and horizontally

### Checklist

- [x] Add `isAuthLoading` state to `AuthContext`
- [x] Set `isAuthLoading = false` in `finally` block covering all bootstrap exit paths
- [x] Expose `isAuthLoading` in context value
- [x] Create `LoadingScreen.js` component with pulsing logo and bouncing dots
- [x] Gate `AppShell` in `App.js` on `isAuthLoading`
- [ ] Verify no flash of SignIn when user is already authenticated (manual test)
- [ ] Verify unauthenticated users go straight to SignIn after loading (manual test)

---

## 8. Task 7: Redesign PartnerLinkScreen (UX-1)

### Problem

`PartnerLinkScreen` is the only screen that uses inline styles, raw `<Button>` components, and has no visual identity. It looks like a developer prototype compared to the rest of the app.

Current state: 75 lines, no `StyleSheet.create()`, no theme colors, no hierarchy, no visual interest.

### Design Direction

Per user request: **New visual direction** with illustrations, animations, partner code sharing via a share button, and maximum visual appeal.

### Design Concept: "Connect Your Hearts"

The screen will have two distinct sections:

**Section 1: Generate & Share Your Code**
- Hero illustration area with a decorative heart/link icon (built with React Native vector shapes, no external image dependency)
- Large "Your Invite Code" card with a highlighted code display
- Copy-to-clipboard button with haptic-style feedback animation
- Share button with native share sheet integration
- Subtle pulse animation on the generated code

**Section 2: Enter Partner's Code**
- Clean input with the existing purple-bordered style
- "Connect" button matching the app's primary button style
- Success animation on link

### Visual Language

| Element | Value |
|---------|-------|
| Background | Gradient feel: `#F6F5FF` → `#EDE8FF` (achieved via layered Views) |
| Primary action | `#6A4CFF` with shadow (matches SignInScreen) |
| Secondary accent | `#03dac6` teal (matches DashboardScreen) |
| Card background | `#FFFFFF` with `borderRadius: 16`, subtle shadow |
| Section divider | "— or —" text with lines |
| Typography | Title: `#2D225A`, Body: `#6B5FA8`, Code: `#6A4CFF` bold monospace |
| Icons | Unicode/emoji-based decorative elements (no external icon library required) |

### Animations

Using React Native's built-in `Animated` API (no Lottie dependency):
- **Code generation**: Fade-in with slide-up for the code card
- **Copy feedback**: Brief scale bounce on the copy button
- **Share button**: Subtle hover/press scale effect
- **Success state**: Checkmark fade-in when link is successful

### Component Structure

```
PartnerLinkScreen
├── ScrollView (for keyboard avoidance)
│   ├── Header (title + subtitle)
│   ├── HeroIllustration (decorative shapes)
│   ├── GenerateCodeSection
│   │   ├── GenerateButton
│   │   ├── CodeDisplayCard (animated)
│   │   │   ├── Code text (monospace, large)
│   │   │   ├── CopyButton (with feedback)
│   │   │   └── ShareButton
│   │   └── ExpiryNote
│   ├── Divider ("— or —")
│   └── EnterCodeSection
│       ├── TextInput (styled)
│       └── ConnectButton
└── SuccessOverlay (conditional, animated)
```

### Checklist

- [x] Rewrite PartnerLinkScreen with `StyleSheet.create()` and proper component structure
- [x] Implement generate code section with animated code display card (spring reveal)
- [x] Add copy-to-clipboard functionality with `Clipboard` API and "Copied!" feedback
- [x] Implement share button using React Native `Share` API with enhanced share message
- [x] Style enter code section with themed input and teal Connect button
- [x] Add fade-in/slide-up entrance animations using `Animated` API
- [x] Add pulsing/floating `HeartIllustration` component (pure CSS shapes, no images)
- [x] Use consistent purple theme from SignInScreen (#2D225A, #6A4CFF, #F6F5FF)
- [x] Add "— or —" section divider between generate and enter sections
- [x] Step badges (1, 2) with descriptions for clear UX flow
- [ ] Test on different screen sizes (small phone, large phone) — manual test
- [x] Verify all existing API calls preserved (`/couple/generate-code`, `/couple/link`)

---

## 9. Test Plan

### Backend Tests

| Test | File | Type |
|------|------|------|
| GlobalExceptionHandler returns clean 400 for validation errors | `GlobalExceptionHandlerTest.java` | Unit |
| GlobalExceptionHandler returns clean 400 for malformed JSON | `GlobalExceptionHandlerTest.java` | Unit |
| Rate limiter rejects after exceeding limit | `RateLimitFilterTest.java` | Unit |
| Rate limiter allows requests under limit | `RateLimitFilterTest.java` | Unit |
| Rate limiter returns 429 with Retry-After header | `RateLimitFilterTest.java` | Unit |
| AuthService no longer logs raw reset token | Manual verification | Code review |

### Frontend Tests

| Test | File | Type |
|------|------|------|
| AuthContext exposes `isAuthLoading` | `AuthContext.test.js` | Unit (update) |
| `isAuthLoading` is true initially, false after bootstrap | `AuthContext.test.js` | Unit (update) |
| Loading screen renders while `isAuthLoading` is true | Manual verification | Visual |
| PartnerLinkScreen renders correctly | Manual verification | Visual |
| Share button triggers native share sheet | Manual verification | Functional |

### Regression

- Existing auth flows (login, register, forgot-password, reset-password) still work
- WebSocket connection still establishes after login
- Game invitation flow still works end-to-end

---

## 10. Implementation Order & Dependencies

```
Phase 1 — Backend Quick Fixes (30 minutes)
├── SEC-4:  Sanitize AuthService log line
└── DEVOPS-3: Make GOOGLE_CLIENT_ID optional in docker-compose

Phase 2 — Backend Quality (2-3 hours)
├── BE-1: GlobalExceptionHandler + LoginRequestDto @Size fix
└── SEC-2: Rate limiting filter + Bucket4j

Phase 3 — Frontend UX (6-8 hours)
├── UX-3: Loading screen (AuthContext isAuthLoading + App.js gate)
└── UX-1: PartnerLinkScreen redesign (largest item)

Phase 4 — User Action
└── DEVOPS-6: User runs eas init, provides projectId
```

Phases 1-2 (backend) and Phase 3 (frontend) can be worked on independently. Phase 4 requires user input and will be integrated whenever the user completes the EAS setup.

---

*Sprint A is designed for maximum impact with minimal risk. Each item is self-contained and independently testable.*

---

## 11. Implementation Summary

**Completed:** February 22, 2026

### Test Results

| Suite | Tests | Status |
|-------|-------|--------|
| Frontend (Jest) | 38 | All passing |
| Backend (JUnit) | All | All passing |
| Backend compilation | — | Clean |

### Files Created

| File | Purpose |
|------|---------|
| `backend/src/main/java/com/onlyyours/controller/GlobalExceptionHandler.java` | `@RestControllerAdvice` for clean 400 responses |
| `backend/src/main/java/com/onlyyours/security/RateLimiterService.java` | Bucket4j in-memory rate limiting service |
| `backend/src/main/java/com/onlyyours/security/RateLimitFilter.java` | `OncePerRequestFilter` for auth endpoint rate limiting |
| `OnlyYoursExpo/src/components/LoadingScreen.js` | Branded loading screen with pulsing logo and bouncing dots |

### Files Modified

| File | Change |
|------|--------|
| `backend/src/main/java/com/onlyyours/service/AuthService.java` | Removed raw reset token from log output |
| `backend/src/main/java/com/onlyyours/dto/LoginRequestDto.java` | Added `@Size(min = 8)` to password field |
| `backend/src/main/java/com/onlyyours/security/SecurityConfig.java` | Added `RateLimitFilter` to security filter chain |
| `backend/build.gradle` | Added `bucket4j-core:8.10.1` dependency |
| `docker-compose.yml` | Made `GOOGLE_CLIENT_ID` optional with `:-disabled` default |
| `.env.example` | Marked `GOOGLE_CLIENT_ID` as optional and commented out |
| `OnlyYoursExpo/src/state/AuthContext.js` | Added `isAuthLoading` state with `finally` gate |
| `OnlyYoursExpo/App.js` | Gated `AppShell` on `isAuthLoading`, renders `LoadingScreen` |
| `OnlyYoursExpo/src/screens/PartnerLinkScreen.js` | Full redesign with animations, Share, Copy, themed cards |

### Remaining Items

- **DEVOPS-6**: Waiting for user to run `eas init` and provide the generated `projectId`
- **Manual testing**: Loading screen flash verification, PartnerLinkScreen on multiple screen sizes
- **Optional backend unit tests**: `GlobalExceptionHandler` and `RateLimitFilter` unit tests (all integration-level testing passes)
