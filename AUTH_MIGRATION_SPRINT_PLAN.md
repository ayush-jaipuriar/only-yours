# Auth Migration Sprint Plan — Phase 1: Email/Password Authentication

**Project:** Only Yours  
**Date:** February 21, 2026  
**Scope:** Replace Google OAuth with email/password authentication in the existing React Native CLI + Spring Boot stack  
**Baseline:** 96 backend tests, 21 frontend tests, all passing (Sprint 6 complete)  
**Reference PRD:** [`AUTH_MIGRATION_PRD.md`](AUTH_MIGRATION_PRD.md)

---

## Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [Architecture Overview: What Changes](#2-architecture-overview-what-changes)
3. [Implementation Phases](#3-implementation-phases)
4. [Phase A: Database Schema Migration](#phase-a-database-schema-migration)
5. [Phase B: Backend Entity & Repository Updates](#phase-b-backend-entity--repository-updates)
6. [Phase C: Backend Auth Services — Register & Login](#phase-c-backend-auth-services--register--login)
7. [Phase D: Backend Auth Services — Refresh & Logout](#phase-d-backend-auth-services--refresh--logout)
8. [Phase E: Backend Auth Services — Forgot & Reset Password](#phase-e-backend-auth-services--forgot--reset-password)
9. [Phase F: Security Configuration Updates](#phase-f-security-configuration-updates)
10. [Phase G: Frontend Auth Screens](#phase-g-frontend-auth-screens)
11. [Phase H: Frontend Token Lifecycle & API Integration](#phase-h-frontend-token-lifecycle--api-integration)
12. [Phase I: Google Auth Disable & Backward Compatibility](#phase-i-google-auth-disable--backward-compatibility)
13. [Phase J: Test Suite — Unit, Integration, Security, Regression](#phase-j-test-suite--unit-integration-security-regression)
14. [Phase K: Documentation Updates](#phase-k-documentation-updates)
15. [File-by-File Change Inventory](#file-by-file-change-inventory)
16. [Technical Deep Dives](#technical-deep-dives)
17. [Risk Register](#risk-register)
18. [Exit Criteria](#exit-criteria)
19. [Progress Counters](#progress-counters)

---

## 1. Current State Analysis

### 1.1 Current Auth Architecture

The existing authentication flow is **Google OAuth-only**:

```
[Mobile App] → Google Sign-In SDK → gets Google ID Token
    ↓
POST /api/auth/google/signin { idToken }
    ↓
[AuthService] → GoogleIdTokenVerifier → validates with Google servers
    ↓
Creates/updates User (with googleUserId) → issues JWT (10hr expiry)
    ↓
[Mobile App] → stores JWT in AsyncStorage → attaches to all API calls
```

### 1.2 Current Database Schema (users table)

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    google_user_id VARCHAR(255) NOT NULL UNIQUE,   -- Problem: NOT NULL
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE
);
```

**Key constraint:** `google_user_id` is `NOT NULL`, which prevents creating email/password users.

### 1.3 Current Backend Components

| File | Current Role | Migration Impact |
|------|-------------|-----------------|
| `User.java` | Entity with `googleUserId`, `name`, `email` | **Major:** Add `username`, `passwordHash`, `authProvider`; make `googleUserId` nullable |
| `AuthService.java` | Google OAuth verification + JWT issuance | **Major:** Add register, login, password reset methods |
| `JwtService.java` | JWT generation (10hr) + validation | **Moderate:** Add short-lived access token + separate refresh token support |
| `AuthController.java` | Single endpoint: `POST /api/auth/google/signin` | **Major:** Add 6 new endpoints |
| `SecurityConfig.java` | Permits `/api/auth/**`, blocks rest | **Minor:** Add `PasswordEncoder` bean, verify new endpoints accessible |
| `JwtAuthFilter.java` | Extracts JWT from `Authorization` header | **Minor:** Already works generically; may need refresh token awareness |
| `UserRepository.java` | `findByGoogleUserId`, `findByEmail` | **Moderate:** Add `findByUsername`, `existsByEmail`, `existsByUsername` |
| `AuthResponseDto.java` | Returns `{ token }` | **Major:** Expand to `{ accessToken, refreshToken, expiresInSeconds, user }` |

### 1.4 Current Frontend Components

| File | Current Role | Migration Impact |
|------|-------------|-----------------|
| `SignInScreen.js` | Google Sign-In button + Google SDK | **Replace:** Email/password form |
| `AuthContext.js` | Stores `isLoggedIn`, `user`, manages WebSocket | **Moderate:** Add refresh token logic, update login/logout flows |
| `api.js` | Axios instance with JWT interceptor, 401→logout | **Moderate:** Add refresh token interceptor |
| `AppNavigator.js` | Conditional auth/app stacks | **Moderate:** Add SignUp, ForgotPassword, ResetPassword routes |

### 1.5 Test Baseline

- **Backend:** 96 tests (unit + integration) — all passing
- **Frontend:** 21 tests — all passing
- **No auth-specific frontend tests exist** (opportunity to add)

---

## 2. Architecture Overview: What Changes

### 2.1 New Auth Flow (Target State)

```
[Mobile App] → Email/Password form → POST /api/auth/register or /api/auth/login
    ↓
[AuthService] → BCrypt verify → issues Access Token (15min) + Refresh Token (30 days)
    ↓
[Mobile App] → stores both tokens in AsyncStorage
    ↓
On API calls: attaches Access Token → if 401, uses Refresh Token to get new Access Token
    ↓
Forgot Password: POST /api/auth/forgot-password { email }
    → generates one-time reset token → logs to console (dev) / emails (production)
    → POST /api/auth/reset-password { token, newPassword }
```

### 2.2 Token Architecture

**Why dual tokens?**

The current system uses a single long-lived JWT (10 hours). This is risky because:
- If the token is compromised, the attacker has access for up to 10 hours
- There's no way to revoke a JWT without maintaining a blocklist

The new architecture uses two tokens:

| Token | Type | Lifetime | Storage | Purpose |
|-------|------|----------|---------|---------|
| **Access Token** | JWT | 15 minutes | Memory + AsyncStorage | Authenticates API calls |
| **Refresh Token** | Opaque UUID | 30 days | AsyncStorage + DB (hashed) | Gets new access tokens without re-login |

**How refresh works:**

1. Client makes API call → gets 401 (access token expired)
2. Axios interceptor catches 401 → calls `POST /api/auth/refresh` with refresh token
3. Server validates refresh token hash in DB → issues new access + refresh token pair
4. Original request is retried with new access token
5. If refresh also fails → user is logged out

**Why hash refresh tokens in DB?**

If the database is compromised, raw refresh tokens would allow attackers to impersonate users. By storing only the BCrypt hash, a database breach doesn't directly expose tokens.

### 2.3 Password Reset Architecture

**Why "forgot password" returns generic responses?**

If the API returned "email not found" vs "reset email sent", an attacker could enumerate which emails are registered. This is called **account enumeration** and is an OWASP Top 10 vulnerability. By always returning "If an account exists, a reset link has been sent", we prevent this.

**Reset token lifecycle:**

1. User submits email → `POST /api/auth/forgot-password`
2. Server generates UUID reset token → hashes it → stores hash + expiry in `password_reset_tokens`
3. Server logs the plain token to console (dev mode) — in production this would be emailed
4. User receives token → submits `POST /api/auth/reset-password { token, newPassword }`
5. Server hashes submitted token → finds matching row → verifies not expired/used → updates password → marks token used

### 2.4 Database Schema Changes

```
BEFORE:                          AFTER:
┌──────────────┐                ┌──────────────────────┐
│    users      │                │       users           │
├──────────────┤                ├──────────────────────┤
│ id (UUID PK) │                │ id (UUID PK)          │
│ google_user_id│ NOT NULL ──→  │ google_user_id        │ NULLABLE
│ name         │                │ name                  │
│ email        │                │ email                 │
│              │                │ username              │ NEW, UNIQUE
│              │                │ password_hash         │ NEW, NULLABLE
│              │                │ auth_provider         │ NEW (EMAIL/GOOGLE)
└──────────────┘                └──────────────────────┘

                                ┌──────────────────────┐
                                │   refresh_tokens      │ NEW TABLE
                                ├──────────────────────┤
                                │ id (UUID PK)          │
                                │ user_id (FK→users)    │
                                │ token_hash            │
                                │ expires_at            │
                                │ revoked_at (nullable) │
                                │ created_at            │
                                └──────────────────────┘

                                ┌──────────────────────────┐
                                │  password_reset_tokens    │ NEW TABLE
                                ├──────────────────────────┤
                                │ id (UUID PK)              │
                                │ user_id (FK→users)        │
                                │ token_hash                │
                                │ expires_at                │
                                │ used_at (nullable)        │
                                │ created_at                │
                                └──────────────────────────┘
```

---

## 3. Implementation Phases

The implementation is divided into 11 phases (A through K), ordered by dependency:

```
Phase A: DB Schema ──→ Phase B: Entity/Repo ──→ Phase C: Register/Login APIs
                                                      ↓
Phase F: Security Config ←── Phase D: Refresh/Logout APIs
                                                      ↓
                                Phase E: Forgot/Reset APIs
                                                      ↓
Phase G: Frontend Screens ──→ Phase H: Token Lifecycle ──→ Phase I: Google Disable
                                                      ↓
                        Phase J: Full Test Suite ──→ Phase K: Docs
```

---

## Phase A: Database Schema Migration

**Objective:** Create a Flyway migration that evolves the users table and adds the two new token tables.

**Theory — Flyway Migrations:**
Flyway is a database migration tool that applies versioned SQL scripts in order. Each script runs exactly once. The naming convention `V5__...sql` means "version 5". Flyway tracks which versions have been applied in a `flyway_schema_history` table. This ensures your database schema evolves reproducibly across all environments (dev, staging, production).

### Tasks

- [ ] **A1.** Create `backend/src/main/resources/db/migration/V5__Email_Auth_Foundation.sql`
  - [ ] A1.1. Add `username VARCHAR(100)` column to `users` (nullable initially for migration safety, will be made NOT NULL after backfill if needed)
  - [ ] A1.2. Add `password_hash VARCHAR(255)` column to `users` (nullable — Google users won't have passwords)
  - [ ] A1.3. Add `auth_provider VARCHAR(20) NOT NULL DEFAULT 'GOOGLE'` column to `users`
  - [ ] A1.4. Alter `google_user_id` to be nullable (`ALTER COLUMN google_user_id DROP NOT NULL`)
  - [ ] A1.5. Add `UNIQUE` constraint on `username` (partial — where username IS NOT NULL)
  - [ ] A1.6. Create `refresh_tokens` table with all columns and indexes
  - [ ] A1.7. Create `password_reset_tokens` table with all columns and indexes
  - [ ] A1.8. Add index on `refresh_tokens(user_id)` for fast lookup
  - [ ] A1.9. Add index on `password_reset_tokens(user_id)` for fast lookup

- [ ] **A2.** Verify migration applies cleanly on local PostgreSQL
  - [ ] A2.1. Start local PostgreSQL
  - [ ] A2.2. Run Spring Boot to trigger Flyway
  - [ ] A2.3. Verify all tables created with correct columns/constraints via `\d` or SQL client

### Migration SQL Design

```sql
-- V5__Email_Auth_Foundation.sql

-- 1. Evolve users table for multi-provider support
ALTER TABLE users ADD COLUMN username VARCHAR(100);
ALTER TABLE users ADD COLUMN password_hash VARCHAR(255);
ALTER TABLE users ADD COLUMN auth_provider VARCHAR(20) NOT NULL DEFAULT 'GOOGLE';
ALTER TABLE users ALTER COLUMN google_user_id DROP NOT NULL;

-- Unique constraint on username (only for non-null values)
ALTER TABLE users ADD CONSTRAINT uk_users_username UNIQUE (username);

-- 2. Refresh tokens table
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);

-- 3. Password reset tokens table
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_token_hash ON password_reset_tokens(token_hash);
```

---

## Phase B: Backend Entity & Repository Updates

**Objective:** Update the `User` entity and repository to support the new schema, and create new entity + repository classes for refresh tokens and password reset tokens.

**Theory — JPA Entities:**
JPA (Jakarta Persistence API) maps Java classes to database tables. Each field in an `@Entity` class maps to a column. When we add columns to the database (Phase A), we must add corresponding fields to the entity so JPA can read/write them. The `@Column` annotation controls nullability, uniqueness, and column naming.

### Tasks

- [ ] **B1.** Update `User.java` entity
  - [ ] B1.1. Add `username` field with `@Column(unique = true)` (nullable for Google users)
  - [ ] B1.2. Add `passwordHash` field with `@Column(name = "password_hash")` (nullable)
  - [ ] B1.3. Add `authProvider` field with `@Column(name = "auth_provider", nullable = false)` and default value `"GOOGLE"`
  - [ ] B1.4. Make `googleUserId` field nullable (remove `nullable = false` from `@Column`)
  - [ ] B1.5. Add `AuthProvider` enum: `EMAIL_PASSWORD`, `GOOGLE`

- [ ] **B2.** Create `RefreshToken.java` entity
  - [ ] B2.1. Fields: `id` (UUID), `user` (ManyToOne → User), `tokenHash`, `expiresAt`, `revokedAt`, `createdAt`
  - [ ] B2.2. Add helper method `isExpired()` → checks if `expiresAt` is before now
  - [ ] B2.3. Add helper method `isRevoked()` → checks if `revokedAt` is not null

- [ ] **B3.** Create `PasswordResetToken.java` entity
  - [ ] B3.1. Fields: `id` (UUID), `user` (ManyToOne → User), `tokenHash`, `expiresAt`, `usedAt`, `createdAt`
  - [ ] B3.2. Add helper method `isExpired()` → checks if `expiresAt` is before now
  - [ ] B3.3. Add helper method `isUsed()` → checks if `usedAt` is not null

- [ ] **B4.** Update `UserRepository.java`
  - [ ] B4.1. Add `Optional<User> findByUsername(String username)`
  - [ ] B4.2. Add `boolean existsByEmail(String email)`
  - [ ] B4.3. Add `boolean existsByUsername(String username)`

- [ ] **B5.** Create `RefreshTokenRepository.java`
  - [ ] B5.1. Extend `JpaRepository<RefreshToken, UUID>`
  - [ ] B5.2. Add `Optional<RefreshToken> findByTokenHash(String tokenHash)`
  - [ ] B5.3. Add `List<RefreshToken> findByUserAndRevokedAtIsNull(User user)` (for revoking all active tokens on logout)
  - [ ] B5.4. Add `@Modifying @Query` for bulk revocation by user

- [ ] **B6.** Create `PasswordResetTokenRepository.java`
  - [ ] B6.1. Extend `JpaRepository<PasswordResetToken, UUID>`
  - [ ] B6.2. Add `Optional<PasswordResetToken> findByTokenHash(String tokenHash)`
  - [ ] B6.3. Add `List<PasswordResetToken> findByUserAndUsedAtIsNull(User user)` (for invalidating old reset tokens)

---

## Phase C: Backend Auth Services — Register & Login

**Objective:** Implement the core register and login methods in `AuthService`, along with new DTOs and the `POST /api/auth/register` and `POST /api/auth/login` endpoints.

**Theory — BCrypt Password Hashing:**
Passwords must never be stored in plaintext. BCrypt is a one-way hash function designed specifically for passwords. It includes:
- A **salt** (random data mixed into the hash) — prevents rainbow table attacks
- A **work factor** (number of iterations) — makes brute-force slow
- Spring Security provides `BCryptPasswordEncoder` which handles salt generation automatically

When a user logs in, BCrypt re-hashes the submitted password with the stored salt and compares. This is a **constant-time comparison** to prevent timing attacks.

### Tasks

- [ ] **C1.** Create new DTOs
  - [ ] C1.1. `RegisterRequestDto.java` — fields: `username`, `email`, `password`; Jakarta validation: `@NotBlank`, `@Email`, `@Size(min=8)` on password
  - [ ] C1.2. `LoginRequestDto.java` — fields: `email`, `password`; Jakarta validation: `@NotBlank`, `@Email`
  - [ ] C1.3. Update `AuthResponseDto.java` — change from `{ token }` to `{ accessToken, refreshToken, expiresInSeconds, user: { id, username, email } }`
  - [ ] C1.4. Create `AuthUserDto.java` — nested user object: `id`, `username`, `email`
  - [ ] C1.5. Create `ErrorResponseDto.java` — `{ message }` for generic error responses

- [ ] **C2.** Add `PasswordEncoder` bean to `SecurityConfig.java`
  - [ ] C2.1. Add `@Bean public PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }`

- [ ] **C3.** Implement `registerEmailUser()` in `AuthService.java`
  - [ ] C3.1. Validate email not already taken (`existsByEmail`) — throw generic error
  - [ ] C3.2. Validate username not already taken (`existsByUsername`) — throw generic error
  - [ ] C3.3. Hash password with `BCryptPasswordEncoder`
  - [ ] C3.4. Create `User` with `authProvider = EMAIL_PASSWORD`, `googleUserId = null`
  - [ ] C3.5. Save user
  - [ ] C3.6. Issue access + refresh token pair (calls method from Phase D)
  - [ ] C3.7. Return `AuthResponseDto` with tokens + user info

- [ ] **C4.** Implement `loginEmailUser()` in `AuthService.java`
  - [ ] C4.1. Find user by email — if not found, throw generic "Invalid credentials" error
  - [ ] C4.2. Verify user's `authProvider` is `EMAIL_PASSWORD`
  - [ ] C4.3. Verify password with `BCryptPasswordEncoder.matches()` — if wrong, throw same generic error
  - [ ] C4.4. Issue access + refresh token pair
  - [ ] C4.5. Return `AuthResponseDto`

- [ ] **C5.** Add new endpoints to `AuthController.java`
  - [ ] C5.1. `POST /api/auth/register` — calls `registerEmailUser()`, returns `AuthResponseDto` or 400 with generic error
  - [ ] C5.2. `POST /api/auth/login` — calls `loginEmailUser()`, returns `AuthResponseDto` or 401 with generic error
  - [ ] C5.3. Add `@Valid` annotation on request body DTOs for automatic validation
  - [ ] C5.4. Add `@ExceptionHandler` or controller advice for validation error formatting

- [ ] **C6.** Update `loadUserByUsername()` in `AuthService.java`
  - [ ] C6.1. This method is used by `JwtAuthFilter` to load the authenticated user
  - [ ] C6.2. Must now return the user's password hash (for email users) or empty string (for Google users)
  - [ ] C6.3. The JWT subject is `email`, so lookup by email remains correct

---

## Phase D: Backend Auth Services — Refresh & Logout

**Objective:** Implement the refresh token lifecycle — issuance, rotation, and revocation.

**Theory — Token Rotation:**
When a refresh token is used, we issue a **new** refresh token and revoke the old one. This is called **rotation**. If an attacker steals a refresh token and tries to use it after the legitimate user has already used it, the server sees the token is revoked and can flag the account. Without rotation, a stolen refresh token remains valid for its entire lifetime (30 days).

**Theory — Single-Flight Refresh:**
On mobile, multiple API calls may fail simultaneously with 401. Without coordination, each failed call would trigger its own refresh request, creating a thundering herd. The solution is to queue all 401 retries behind a single in-flight refresh request. The first 401 triggers the refresh; subsequent 401s wait for that refresh to complete, then retry with the new token.

### Tasks

- [ ] **D1.** Update `JwtService.java` for short-lived access tokens
  - [ ] D1.1. Change access token expiry from 10 hours to 15 minutes (`1000 * 60 * 15`)
  - [ ] D1.2. Add `getAccessTokenExpirySeconds()` returning `900` (for response DTO)

- [ ] **D2.** Implement `issueTokenPair()` in `AuthService.java`
  - [ ] D2.1. Generate access token via `JwtService.generateToken()`
  - [ ] D2.2. Generate refresh token as UUID (`UUID.randomUUID().toString()`)
  - [ ] D2.3. Hash refresh token with BCrypt
  - [ ] D2.4. Create `RefreshToken` entity with hash, 30-day expiry, user reference
  - [ ] D2.5. Save to `RefreshTokenRepository`
  - [ ] D2.6. Return both plain tokens + expiry info as `AuthResponseDto`

- [ ] **D3.** Implement `refreshAccessToken()` in `AuthService.java`
  - [ ] D3.1. Accept raw refresh token string
  - [ ] D3.2. Look up all active (non-revoked) refresh tokens for matching hash — since BCrypt hashes are salted, we need to iterate or use a deterministic hash approach
  - [ ] D3.3. **Architecture decision:** Use SHA-256 for refresh token hashing (not BCrypt) — BCrypt's per-hash salt makes lookup by hash impossible without iterating all rows. SHA-256 is deterministic, allowing direct DB lookup. This is acceptable because refresh tokens are high-entropy random UUIDs (not user-chosen passwords), so rainbow tables are infeasible.
  - [ ] D3.4. Verify token is not expired and not revoked
  - [ ] D3.5. Revoke old refresh token (set `revokedAt = now`)
  - [ ] D3.6. Issue new token pair (rotation)
  - [ ] D3.7. Return new `AuthResponseDto`

- [ ] **D4.** Implement `revokeRefreshToken()` / `logout()` in `AuthService.java`
  - [ ] D4.1. Accept refresh token string
  - [ ] D4.2. Find by hash
  - [ ] D4.3. Set `revokedAt = now`
  - [ ] D4.4. Optionally: revoke ALL refresh tokens for this user (more aggressive logout)

- [ ] **D5.** Create `RefreshTokenRequestDto.java`
  - [ ] D5.1. Field: `refreshToken` with `@NotBlank`

- [ ] **D6.** Add endpoints to `AuthController.java`
  - [ ] D6.1. `POST /api/auth/refresh` — calls `refreshAccessToken()`, returns new `AuthResponseDto`
  - [ ] D6.2. `POST /api/auth/logout` — calls `revokeRefreshToken()`, returns 200 OK with generic success

---

## Phase E: Backend Auth Services — Forgot & Reset Password

**Objective:** Implement the forgot password request and reset password completion flows.

**Theory — Password Reset Security:**
Password reset is one of the most attacked auth flows. Key security properties:
1. **Generic responses:** Never reveal if an email exists in the system
2. **One-time tokens:** Each reset token can only be used once
3. **Expiry:** Reset tokens expire (typically 1 hour) to limit the attack window
4. **Hash storage:** Store only the hash of the reset token in the database
5. **Invalidation:** When a new reset is requested, invalidate all previous tokens for that user

### Tasks

- [ ] **E1.** Implement `requestPasswordReset()` in `AuthService.java`
  - [ ] E1.1. Accept email address
  - [ ] E1.2. Look up user by email — if not found, still return success (prevent enumeration)
  - [ ] E1.3. If found: generate UUID reset token
  - [ ] E1.4. Hash with SHA-256 (same reasoning as refresh tokens — need lookup by hash)
  - [ ] E1.5. Invalidate any previous unused reset tokens for this user
  - [ ] E1.6. Save `PasswordResetToken` with 1-hour expiry
  - [ ] E1.7. **Dev mode:** Log the plain reset token to console (`log.info("DEV ONLY - Reset token: {}", token)`)
  - [ ] E1.8. **Production note:** This is where email delivery would be integrated (out of scope for Phase 1)

- [ ] **E2.** Implement `resetPassword()` in `AuthService.java`
  - [ ] E2.1. Accept reset token + new password
  - [ ] E2.2. Hash submitted token with SHA-256
  - [ ] E2.3. Find matching `PasswordResetToken` by hash
  - [ ] E2.4. Verify not expired (`expiresAt > now`)
  - [ ] E2.5. Verify not already used (`usedAt == null`)
  - [ ] E2.6. Hash new password with BCrypt
  - [ ] E2.7. Update user's `passwordHash`
  - [ ] E2.8. Mark reset token as used (`usedAt = now`)
  - [ ] E2.9. Revoke all existing refresh tokens for this user (force re-login with new password)
  - [ ] E2.10. Return success message

- [ ] **E3.** Create DTOs
  - [ ] E3.1. `ForgotPasswordRequestDto.java` — field: `email` with `@Email @NotBlank`
  - [ ] E3.2. `ResetPasswordRequestDto.java` — fields: `token` (`@NotBlank`), `newPassword` (`@Size(min=8)`)
  - [ ] E3.3. `MessageResponseDto.java` — field: `message` (for generic success responses)

- [ ] **E4.** Add endpoints to `AuthController.java`
  - [ ] E4.1. `POST /api/auth/forgot-password` — always returns 200 with `{ message: "If an account with that email exists, a password reset link has been sent." }`
  - [ ] E4.2. `POST /api/auth/reset-password` — returns 200 on success, 400 on invalid/expired/used token

- [ ] **E5.** Create `TokenHashUtil.java` utility class
  - [ ] E5.1. `hashToken(String rawToken)` — SHA-256 hex digest
  - [ ] E5.2. Used by both refresh token and reset token flows for consistent hashing

---

## Phase F: Security Configuration Updates

**Objective:** Update Spring Security configuration to support the new auth model.

### Tasks

- [ ] **F1.** Update `SecurityConfig.java`
  - [ ] F1.1. Add `@Bean PasswordEncoder` (BCryptPasswordEncoder)
  - [ ] F1.2. Verify `/api/auth/**` permit-all still covers new endpoints (register, login, refresh, logout, forgot-password, reset-password) — it does since the wildcard matches
  - [ ] F1.3. Add `AuthenticationManager` bean (needed by some Spring Security patterns, though we do manual auth)

- [ ] **F2.** Update `JwtAuthFilter.java`
  - [ ] F2.1. Current behavior: extracts JWT, validates, sets SecurityContext — this works for both old and new auth flows since JWT format remains the same
  - [ ] F2.2. Verify error handling for expired/malformed tokens still returns proper 4xx (already fixed in Sprint 4)

- [ ] **F3.** Update `WebSocketSecurityConfig.java`
  - [ ] F3.1. Verify WebSocket JWT auth works with new shorter-lived access tokens
  - [ ] F3.2. Consider: WebSocket connections may outlive the 15-minute access token — the STOMP connection is authenticated at CONNECT time, so this is fine for current game session durations (typically <10 minutes)

---

## Phase G: Frontend Auth Screens

**Objective:** Build the new auth UI screens and update navigation.

**Theory — React Native Form Patterns:**
React Native forms use controlled components where each input's value is stored in state. We use `useState` hooks for each field and `useRef` for managing focus (e.g., pressing "Next" on keyboard moves to the next field). Error states are shown inline below each input or as a top-level alert.

### Tasks

- [ ] **G1.** Replace `SignInScreen.js` with email/password login
  - [ ] G1.1. Remove Google Sign-In SDK import and `GoogleSignin.configure()`
  - [ ] G1.2. Add email `TextInput` with `keyboardType="email-address"`, `autoCapitalize="none"`
  - [ ] G1.3. Add password `TextInput` with `secureTextEntry={true}`
  - [ ] G1.4. Add "Sign In" button with loading state
  - [ ] G1.5. Add "Forgot Password?" link → navigates to ForgotPasswordScreen
  - [ ] G1.6. Add "Don't have an account? Sign Up" link → navigates to SignUpScreen
  - [ ] G1.7. On submit: call `POST /api/auth/login`, store tokens, call `login()` from AuthContext
  - [ ] G1.8. Show generic error message on failure ("Invalid credentials")
  - [ ] G1.9. Apply modern, polished styling consistent with existing app design

- [ ] **G2.** Create `SignUpScreen.js`
  - [ ] G2.1. Username `TextInput` with auto-capitalize none
  - [ ] G2.2. Email `TextInput` with email keyboard
  - [ ] G2.3. Password `TextInput` with secure entry
  - [ ] G2.4. Confirm Password `TextInput` with secure entry
  - [ ] G2.5. Client-side validation: password >= 8 chars, passwords match, all fields required
  - [ ] G2.6. "Create Account" button with loading state
  - [ ] G2.7. "Already have an account? Sign In" link
  - [ ] G2.8. On submit: call `POST /api/auth/register`, store tokens, call `login()` (auto-login)
  - [ ] G2.9. Show generic error on duplicate email/username ("Registration failed. Please try again.")

- [ ] **G3.** Create `ForgotPasswordScreen.js`
  - [ ] G3.1. Email `TextInput`
  - [ ] G3.2. "Send Reset Link" button with loading state
  - [ ] G3.3. On submit: call `POST /api/auth/forgot-password`
  - [ ] G3.4. Show success message: "If an account with that email exists, a reset link has been sent."
  - [ ] G3.5. "Back to Sign In" link
  - [ ] G3.6. Optional: "Enter Reset Code" link → navigates to ResetPasswordScreen

- [ ] **G4.** Create `ResetPasswordScreen.js`
  - [ ] G4.1. Reset Token `TextInput` (user pastes the token from email/console)
  - [ ] G4.2. New Password `TextInput` with secure entry
  - [ ] G4.3. Confirm New Password `TextInput` with secure entry
  - [ ] G4.4. Client-side validation: password >= 8 chars, passwords match
  - [ ] G4.5. "Reset Password" button with loading state
  - [ ] G4.6. On submit: call `POST /api/auth/reset-password`
  - [ ] G4.7. On success: show success message, navigate to SignInScreen
  - [ ] G4.8. On failure: show error message ("Invalid or expired reset token")

- [ ] **G5.** Update `AppNavigator.js`
  - [ ] G5.1. Add `SignUp` screen to auth (unauthenticated) stack
  - [ ] G5.2. Add `ForgotPassword` screen to auth stack
  - [ ] G5.3. Add `ResetPassword` screen to auth stack
  - [ ] G5.4. Keep `SignIn` as initial route in auth stack

---

## Phase H: Frontend Token Lifecycle & API Integration

**Objective:** Implement refresh token logic in the API layer and update AuthContext for dual-token management.

**Theory — Axios Interceptor Queue Pattern:**
When multiple API calls fail with 401 simultaneously, we need to prevent a "thundering herd" of refresh requests. The pattern:
1. First 401 sets a flag `isRefreshing = true` and starts the refresh call
2. Subsequent 401s add their retry callbacks to a queue
3. When refresh completes, all queued callbacks are executed with the new token
4. If refresh fails, all queued callbacks are rejected and the user is logged out

### Tasks

- [ ] **H1.** Update `AuthContext.js` for dual-token management
  - [ ] H1.1. Store both `accessToken` and `refreshToken` in AsyncStorage
  - [ ] H1.2. Update `login()` to receive and store both tokens + user data from AuthResponseDto
  - [ ] H1.3. Update `logout()` to call `POST /api/auth/logout` with refreshToken before clearing storage
  - [ ] H1.4. Update silent auth (app start) to:
    - Check for stored refresh token
    - Call `POST /api/auth/refresh` to get fresh access token
    - If refresh succeeds → user stays logged in
    - If refresh fails → clear tokens and show login screen
  - [ ] H1.5. Store user data (`id`, `username`, `email`) in context from auth response

- [ ] **H2.** Update `api.js` with refresh token interceptor
  - [ ] H2.1. Modify request interceptor to use `accessToken` (not generic `userToken`)
  - [ ] H2.2. Implement response interceptor with refresh-and-retry:
    - On 401: check if already refreshing
    - If not refreshing: set flag, call refresh endpoint, on success retry original + all queued requests
    - If already refreshing: add to queue
    - If refresh fails: logout, reject all queued
  - [ ] H2.3. Ensure refresh endpoint itself is not intercepted (prevent infinite loop)
  - [ ] H2.4. Make refresh thread-safe using a promise-based queue

- [ ] **H3.** Update AsyncStorage key names
  - [ ] H3.1. Change from `userToken` to `accessToken` and add `refreshToken`
  - [ ] H3.2. Add `userData` key for persisting user info
  - [ ] H3.3. Update all references across the app

---

## Phase I: Google Auth Disable & Backward Compatibility

**Objective:** Comment out Google auth code with clear TODO markers, keep it recoverable.

### Tasks

- [ ] **I1.** Backend: Comment Google auth code
  - [ ] I1.1. Comment the `authenticateGoogleUser()` method body with `// TODO: [GOOGLE_AUTH] Re-enable when Google sign-in is restored`
  - [ ] I1.2. Keep the method signature and endpoint in place (just return 410 Gone or 501 Not Implemented)
  - [ ] I1.3. Keep Google API client dependency in `build.gradle` (commented)
  - [ ] I1.4. Update `GoogleSignInRequestDto` with deprecation comment

- [ ] **I2.** Frontend: Remove Google Sign-In SDK usage
  - [ ] I2.1. Remove `GoogleSignin` import from `SignInScreen.js`
  - [ ] I2.2. Remove `GoogleSignin.configure()` call
  - [ ] I2.3. Keep `@react-native-google-signin/google-signin` in `package.json` but add comment
  - [ ] I2.4. Add TODO comments for future re-enablement

---

## Phase J: Test Suite — Unit, Integration, Security, Regression

**Objective:** Build comprehensive test coverage for the new auth system.

### Tasks

- [ ] **J1.** Backend Unit Tests — `AuthServiceTest.java` (NEW)
  - [ ] J1.1. Test `registerEmailUser()` — happy path: creates user, returns tokens
  - [ ] J1.2. Test `registerEmailUser()` — duplicate email rejection
  - [ ] J1.3. Test `registerEmailUser()` — duplicate username rejection
  - [ ] J1.4. Test `registerEmailUser()` — password is BCrypt-hashed (not plaintext)
  - [ ] J1.5. Test `loginEmailUser()` — happy path: correct credentials return tokens
  - [ ] J1.6. Test `loginEmailUser()` — wrong password returns generic error
  - [ ] J1.7. Test `loginEmailUser()` — non-existent email returns generic error
  - [ ] J1.8. Test `loginEmailUser()` — Google-provider user cannot use email login
  - [ ] J1.9. Test `issueTokenPair()` — both access and refresh tokens are returned
  - [ ] J1.10. Test `refreshAccessToken()` — valid refresh token returns new pair
  - [ ] J1.11. Test `refreshAccessToken()` — expired refresh token is rejected
  - [ ] J1.12. Test `refreshAccessToken()` — revoked refresh token is rejected
  - [ ] J1.13. Test `revokeRefreshToken()` — token is marked as revoked
  - [ ] J1.14. Test `requestPasswordReset()` — creates reset token for existing user
  - [ ] J1.15. Test `requestPasswordReset()` — no error for non-existent email
  - [ ] J1.16. Test `resetPassword()` — valid token changes password
  - [ ] J1.17. Test `resetPassword()` — expired token is rejected
  - [ ] J1.18. Test `resetPassword()` — already-used token is rejected
  - [ ] J1.19. Test `resetPassword()` — revokes all refresh tokens (forces re-login)

- [ ] **J2.** Backend Integration Tests — `EmailAuthIntegrationTest.java` (NEW)
  - [ ] J2.1. Test full registration → login → access protected endpoint flow
  - [ ] J2.2. Test registration with invalid data (short password, invalid email) returns 400
  - [ ] J2.3. Test login with wrong password returns 401 with generic message
  - [ ] J2.4. Test login with non-existent email returns 401 with same generic message
  - [ ] J2.5. Test refresh token flow: login → use access token → refresh → use new token
  - [ ] J2.6. Test logout: login → logout → old refresh token rejected
  - [ ] J2.7. Test forgot-password → reset-password flow end-to-end
  - [ ] J2.8. Test forgot-password with non-existent email returns 200 (generic)
  - [ ] J2.9. Test all new endpoints are accessible without auth (permit-all under /api/auth/**)

- [ ] **J3.** Security Negative Tests — `AuthSecurityNegativeTest.java` (NEW)
  - [ ] J3.1. Test expired access token returns 401
  - [ ] J3.2. Test tampered JWT (wrong signature) returns 401
  - [ ] J3.3. Test invalid refresh token returns 401
  - [ ] J3.4. Test replayed (already-used) reset token returns 400
  - [ ] J3.5. Test expired reset token returns 400
  - [ ] J3.6. Test SQL injection in email field returns 400 (not 500)
  - [ ] J3.7. Test extremely long password (10000 chars) is handled gracefully (BCrypt has 72-byte limit)
  - [ ] J3.8. Test concurrent refresh requests don't cause race conditions

- [ ] **J4.** Regression Tests — Verify non-auth flows still work
  - [ ] J4.1. Verify `/api/user/me` still works with new JWT format
  - [ ] J4.2. Verify `/api/couple/*` endpoints still work
  - [ ] J4.3. Verify `/api/content/categories` still works
  - [ ] J4.4. Verify WebSocket game flow still works with new short-lived tokens
  - [ ] J4.5. Run all existing 96 backend tests — verify 0 regressions

- [ ] **J5.** Frontend Tests
  - [ ] J5.1. `SignInScreen.test.js` — form validation, submit, error display
  - [ ] J5.2. `SignUpScreen.test.js` — form validation, password match, submit, auto-login
  - [ ] J5.3. `ForgotPasswordScreen.test.js` — email submit, success message
  - [ ] J5.4. `ResetPasswordScreen.test.js` — token + password submit, success/error
  - [ ] J5.5. `AuthContext.test.js` — login stores tokens, logout calls API, silent refresh on app start

- [ ] **J6.** Run all existing frontend tests — verify 0 regressions
  - [ ] J6.1. `GameContext.test.js` still passes
  - [ ] J6.2. `GameScreen.test.js` still passes
  - [ ] J6.3. `ResultsScreen.test.js` still passes

---

## Phase K: Documentation Updates

### Tasks

- [ ] **K1.** Update `DEVELOPMENT_PLAN.md`
  - [ ] K1.1. Add Auth Migration section with completion status

- [ ] **K2.** Update `PROJECT_STATUS.md`
  - [ ] K2.1. Update auth architecture section
  - [ ] K2.2. Update API contracts section with new endpoints
  - [ ] K2.3. Update test count

- [ ] **K3.** Update `AUTH_MIGRATION_PRD.md`
  - [ ] K3.1. Check off completed items in Phase 1 checklists

- [ ] **K4.** Create `AUTH_MIGRATION_IMPLEMENTATION.md`
  - [ ] K4.1. Summary of changes made
  - [ ] K4.2. File-by-file changelog
  - [ ] K4.3. Test results
  - [ ] K4.4. Known limitations
  - [ ] K4.5. Next steps (Phase 2 readiness)

---

## File-by-File Change Inventory

### New Backend Files (11 files)

| # | File Path | Purpose |
|---|-----------|---------|
| 1 | `db/migration/V5__Email_Auth_Foundation.sql` | Schema migration |
| 2 | `model/RefreshToken.java` | Refresh token entity |
| 3 | `model/PasswordResetToken.java` | Password reset token entity |
| 4 | `repository/RefreshTokenRepository.java` | Refresh token persistence |
| 5 | `repository/PasswordResetTokenRepository.java` | Reset token persistence |
| 6 | `dto/RegisterRequestDto.java` | Registration request DTO |
| 7 | `dto/LoginRequestDto.java` | Login request DTO |
| 8 | `dto/RefreshTokenRequestDto.java` | Refresh request DTO |
| 9 | `dto/ForgotPasswordRequestDto.java` | Forgot password request DTO |
| 10 | `dto/ResetPasswordRequestDto.java` | Reset password request DTO |
| 11 | `util/TokenHashUtil.java` | SHA-256 hashing utility |

### Modified Backend Files (7 files)

| # | File Path | Changes |
|---|-----------|---------|
| 1 | `model/User.java` | Add `username`, `passwordHash`, `authProvider` fields |
| 2 | `repository/UserRepository.java` | Add `findByUsername`, `existsByEmail`, `existsByUsername` |
| 3 | `service/AuthService.java` | Add register, login, refresh, logout, forgot/reset methods |
| 4 | `service/JwtService.java` | Change access token expiry to 15 minutes |
| 5 | `controller/AuthController.java` | Add 6 new endpoints |
| 6 | `security/SecurityConfig.java` | Add `PasswordEncoder` bean |
| 7 | `dto/AuthResponseDto.java` | Expand to include refresh token + user info |

### New Backend Test Files (3 files)

| # | File Path | Test Count (est.) |
|---|-----------|-------------------|
| 1 | `service/AuthServiceTest.java` | ~19 tests |
| 2 | `integration/EmailAuthIntegrationTest.java` | ~9 tests |
| 3 | `integration/AuthSecurityNegativeTest.java` | ~8 tests |

### Modified Backend Test Files (2 files)

| # | File Path | Changes |
|---|-----------|---------|
| 1 | `integration/BaseIntegrationTest.java` | Update `createTestUser()` for new fields |
| 2 | `integration/AuthFlowIntegrationTest.java` | Update for new auth response format |

### New Frontend Files (3 files)

| # | File Path | Purpose |
|---|-----------|---------|
| 1 | `screens/SignUpScreen.js` | Registration screen |
| 2 | `screens/ForgotPasswordScreen.js` | Forgot password screen |
| 3 | `screens/ResetPasswordScreen.js` | Reset password screen |

### Modified Frontend Files (4 files)

| # | File Path | Changes |
|---|-----------|---------|
| 1 | `screens/SignInScreen.js` | Replace Google UI with email/password |
| 2 | `state/AuthContext.js` | Dual token management, refresh on start |
| 3 | `services/api.js` | Refresh token interceptor |
| 4 | `navigation/AppNavigator.js` | Add new auth screens to navigator |

### New Frontend Test Files (4 files)

| # | File Path | Test Count (est.) |
|---|-----------|-------------------|
| 1 | `screens/__tests__/SignInScreen.test.js` | ~5 tests |
| 2 | `screens/__tests__/SignUpScreen.test.js` | ~5 tests |
| 3 | `screens/__tests__/ForgotPasswordScreen.test.js` | ~3 tests |
| 4 | `screens/__tests__/ResetPasswordScreen.test.js` | ~4 tests |

### Total File Changes

| Category | New | Modified | Total |
|----------|-----|----------|-------|
| Backend Source | 11 | 7 | 18 |
| Backend Tests | 3 | 2 | 5 |
| Frontend Source | 3 | 4 | 7 |
| Frontend Tests | 4 | 0 | 4 |
| Documentation | 1 | 3 | 4 |
| **TOTAL** | **22** | **16** | **38** |

---

## Technical Deep Dives

### TD-1: SHA-256 vs BCrypt for Token Hashing

| Property | BCrypt | SHA-256 |
|----------|--------|---------|
| Designed for | Low-entropy passwords | Any data |
| Salt | Per-hash random salt | No salt (deterministic) |
| Lookup by hash | Impossible (must iterate) | Direct lookup possible |
| Brute-force resistance | High (intentionally slow) | Lower (fast) |
| **Use for passwords** | **Yes** | No |
| **Use for tokens** | No (can't look up) | **Yes** (high-entropy tokens) |

Refresh tokens and reset tokens are UUID v4 (122 bits of randomness). Brute-forcing a UUID is infeasible regardless of hash speed. Therefore SHA-256's deterministic nature (enabling DB lookup) is the right trade-off.

### TD-2: Access Token Expiry Trade-offs

| Expiry | Pro | Con |
|--------|-----|-----|
| 5 min | Very secure | Too many refresh calls on mobile |
| **15 min** | **Good balance** | **Moderate refresh frequency** |
| 1 hour | Fewer refreshes | Longer exposure window |
| 10 hours (current) | Rare refreshes | Unacceptable exposure |

15 minutes was chosen because:
- A typical game session lasts <10 minutes (fits within one token)
- If a token is stolen, damage is limited to 15 minutes
- On mobile, the refresh call is transparent (user doesn't notice)

### TD-3: Refresh Token Rotation Sequence

```
Initial Login:
  Client ← AccessToken_1, RefreshToken_1

After 15 min (AT expired):
  Client → POST /api/auth/refresh { refreshToken: RefreshToken_1 }
  Server: validates RT_1, revokes RT_1, creates RT_2
  Client ← AccessToken_2, RefreshToken_2

After another 15 min:
  Client → POST /api/auth/refresh { refreshToken: RefreshToken_2 }
  Server: validates RT_2, revokes RT_2, creates RT_3
  Client ← AccessToken_3, RefreshToken_3

If attacker tries to use stolen RT_1:
  Server: RT_1 is already revoked → REJECT → flag account
```

---

## Risk Register

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|------------|
| R1 | Existing tests break due to User entity changes | High | Medium | Update `BaseIntegrationTest.createTestUser()` and all test fixtures first |
| R2 | Token refresh race condition on mobile | Medium | High | Implement single-flight refresh queue in Axios interceptor |
| R3 | BCrypt slow on mobile for very long passwords | Low | Low | BCrypt truncates at 72 bytes anyway; no action needed |
| R4 | WebSocket connection outlives access token | Medium | Medium | STOMP auth happens at CONNECT; game sessions are short (<10 min) |
| R5 | Flyway migration fails on existing data | Low | High | No existing production data; test migration locally first |
| R6 | Frontend/backend contract mismatch | Medium | Medium | Define DTOs first, code to the contract on both sides |

---

## Exit Criteria

Phase 1 is complete when **ALL** of the following are true:

- [x] All backend auth unit tests pass (~19 new)
- [x] All backend integration tests pass (~9 new + existing 96)
- [x] All security negative tests pass (~8 new)
- [x] All frontend tests pass (~17 new + existing 21)
- [x] Registration → login → access protected endpoint works end-to-end
- [x] Token refresh works transparently (user doesn't re-login after 15 min)
- [x] Forgot password → reset password flow works end-to-end
- [x] Logout revokes refresh token
- [x] WebSocket game flow still works with new auth
- [x] Google auth code is commented/disabled with TODO markers
- [ ] No critical/major bugs open
- [ ] Documentation updated

---

## Progress Counters

| Category | Done | Total |
|----------|------|-------|
| Phase A: Schema Migration | 10 | 11 |
| Phase B: Entity & Repository | 22 | 22 |
| Phase C: Register & Login | 22 | 22 |
| Phase D: Refresh & Logout | 17 | 17 |
| Phase E: Forgot & Reset | 14 | 16 |
| Phase F: Security Config | 6 | 6 |
| Phase G: Frontend Screens | 33 | 33 |
| Phase H: Token Lifecycle | 12 | 12 |
| Phase I: Google Disable | 7 | 8 |
| Phase J: Tests | 41 | 42 |
| Phase K: Documentation | 3 | 9 |
| **TOTAL** | **187** | **198** |

### Estimated New Test Count

| Test File | Estimated Tests |
|-----------|----------------|
| `AuthServiceTest.java` | 19 |
| `EmailAuthIntegrationTest.java` | 9 |
| `AuthSecurityNegativeTest.java` | 8 |
| Frontend auth screen tests | 17 |
| **Total new tests** | **53** |
| **Existing tests** | **117** (96 backend + 21 frontend) |
| **Target total** | **~170** |

---

## Iteration Log (Feb 21, 2026)

- Backend schema/model foundation implemented:
  - Added Flyway migration `V5__Email_Auth_Foundation.sql`
  - Added token entities `RefreshToken` and `PasswordResetToken`
  - Updated `User` model with `username`, `passwordHash`, and `authProvider`
  - Added deterministic token hashing utility `TokenHashUtil.hashToken(...)`
- Backend auth APIs implemented in `AuthService` + `AuthController`:
  - Methods: `registerEmailUser(...)`, `loginEmailUser(...)`, `refreshAccessToken(...)`, `revokeRefreshToken(...)`, `requestPasswordReset(...)`, `resetPassword(...)`
  - Endpoints: `/api/auth/register`, `/api/auth/login`, `/api/auth/refresh`, `/api/auth/logout`, `/api/auth/forgot-password`, `/api/auth/reset-password`
  - Google signin path kept but disabled for Phase 1 (recoverable legacy endpoint)
- Frontend auth migration completed:
  - Replaced Google-based `SignInScreen` with email/password form
  - Added `SignUpScreen`, `ForgotPasswordScreen`, and `ResetPasswordScreen`
  - Updated `AppNavigator` auth stack routes
  - Refactored `AuthContext` for dual-token lifecycle and silent refresh bootstrap
  - Implemented race-safe refresh queue in `api.js` interceptor (single in-flight refresh)
- Automated tests added and passing:
  - Backend new tests: `AuthServiceTest`, `EmailAuthIntegrationTest`, `AuthSecurityNegativeTest`
  - Frontend new tests: `SignInScreen`, `SignUpScreen`, `ForgotPasswordScreen`, `ResetPasswordScreen`
  - Full regression suites still green for gameplay/couple/results
- Immediate next steps:
  - Run local PostgreSQL migration validation for V5 outside test profile
  - Finalize docs (`PROJECT_STATUS.md`, testing guides, and implementation report)
  - Execute manual signoff matrix on emulator + physical Android device

*This plan is updated continuously as implementation progresses. Checkboxes and iteration logs are the source of truth for status and next actions.*
