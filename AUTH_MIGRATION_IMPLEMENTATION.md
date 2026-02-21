# Auth Migration Implementation Report (Phase 1)

**Date:** February 21, 2026  
**Scope:** Email/password auth migration in existing React Native CLI + Spring Boot stack  
**Reference:** `AUTH_MIGRATION_PRD.md`

---

## 1. What Was Implemented

### Backend

- Added schema migration `backend/src/main/resources/db/migration/V5__Email_Auth_Foundation.sql`:
  - Evolved `users` table with `username`, `password_hash`, `auth_provider`
  - Made `google_user_id` nullable
  - Added `refresh_tokens` and `password_reset_tokens` tables
- Updated core auth model and repositories:
  - `backend/src/main/java/com/onlyyours/model/User.java`
  - `backend/src/main/java/com/onlyyours/model/RefreshToken.java`
  - `backend/src/main/java/com/onlyyours/model/PasswordResetToken.java`
  - `backend/src/main/java/com/onlyyours/repository/UserRepository.java`
  - `backend/src/main/java/com/onlyyours/repository/RefreshTokenRepository.java`
  - `backend/src/main/java/com/onlyyours/repository/PasswordResetTokenRepository.java`
- Added deterministic token hashing utility:
  - `backend/src/main/java/com/onlyyours/util/TokenHashUtil.java`
  - Method: `TokenHashUtil.hashToken(String rawToken)` using SHA-256
- Refactored auth service and API:
  - `backend/src/main/java/com/onlyyours/service/AuthService.java`
    - `registerEmailUser(...)`
    - `loginEmailUser(...)`
    - `refreshAccessToken(...)`
    - `revokeRefreshToken(...)`
    - `requestPasswordReset(...)`
    - `resetPassword(...)`
  - `backend/src/main/java/com/onlyyours/controller/AuthController.java`
    - `POST /api/auth/register`
    - `POST /api/auth/login`
    - `POST /api/auth/refresh`
    - `POST /api/auth/logout`
    - `POST /api/auth/forgot-password`
    - `POST /api/auth/reset-password`
  - Legacy Google path retained but disabled (recoverable)
- Updated JWT/access token behavior:
  - `backend/src/main/java/com/onlyyours/service/JwtService.java`
  - Access token expiry set to 15 minutes (`900` seconds)
- Added password encoder config without circular dependency:
  - `backend/src/main/java/com/onlyyours/config/PasswordConfig.java`

### Frontend

- Replaced Google Sign-In with email/password in:
  - `OnlyYoursApp/src/screens/SignInScreen.js`
- Added new auth screens:
  - `OnlyYoursApp/src/screens/SignUpScreen.js`
  - `OnlyYoursApp/src/screens/ForgotPasswordScreen.js`
  - `OnlyYoursApp/src/screens/ResetPasswordScreen.js`
- Updated auth navigation stack:
  - `OnlyYoursApp/src/navigation/AppNavigator.js`
- Refactored token lifecycle and session bootstrap:
  - `OnlyYoursApp/src/state/AuthContext.js`
  - stores `accessToken`, `refreshToken`, `userData`
  - silent refresh on app start
  - logout revocation call
- Implemented refresh-and-retry interceptor with single-flight queue:
  - `OnlyYoursApp/src/services/api.js`
- Updated WebSocket auth token source:
  - `OnlyYoursApp/src/services/WebSocketService.js` now uses `accessToken`
- Removed app-level Google SDK configure call:
  - `OnlyYoursApp/App.js`

---

## 2. DTOs Added/Updated

- Added backend request DTOs:
  - `RegisterRequestDto`
  - `LoginRequestDto`
  - `RefreshTokenRequestDto`
  - `ForgotPasswordRequestDto`
  - `ResetPasswordRequestDto`
- Updated response DTO:
  - `AuthResponseDto` now returns `accessToken`, `refreshToken`, `expiresInSeconds`, and `user`
- Added generic message DTO:
  - `MessageResponseDto`

---

## 3. Test Coverage Added

### Backend Tests Added

- `backend/src/test/java/com/onlyyours/service/AuthServiceTest.java`
- `backend/src/test/java/com/onlyyours/integration/EmailAuthIntegrationTest.java`
- `backend/src/test/java/com/onlyyours/integration/AuthSecurityNegativeTest.java`

Coverage includes:
- register/login success and failure cases
- refresh token rotation and invalid refresh rejection
- forgot/reset password flows
- reused reset token rejection
- tampered token rejection
- generic invalid-credential messaging (enumeration-safe)

### Frontend Tests Added

- `OnlyYoursApp/src/screens/__tests__/SignInScreen.test.js`
- `OnlyYoursApp/src/screens/__tests__/SignUpScreen.test.js`
- `OnlyYoursApp/src/screens/__tests__/ForgotPasswordScreen.test.js`
- `OnlyYoursApp/src/screens/__tests__/ResetPasswordScreen.test.js`

Coverage includes:
- form validation
- API submit wiring
- auth payload handoff to context login
- navigation links

---

## 4. Test Execution Results

### Backend

Command executed:

```bash
cd backend && ./gradlew test
```

Result:
- ✅ Passed
- Test suites include existing regression coverage (gameplay/couple/content) plus new auth suites

### Frontend

Command executed:

```bash
cd OnlyYoursApp && yarn test --runInBand
```

Result:
- ✅ Passed
- 7 test suites passed, 28 tests passed

---

## 5. Remaining Work Before Phase 1 Closure

- [ ] Validate Flyway V5 migration against local non-test PostgreSQL (outside H2 test profile)
- [ ] Update remaining docs:
  - [ ] `TESTING_GUIDE.md` auth sections
  - [x] `MANUAL_TESTING_GUIDE_SPRINT6.md` auth flow updates
  - [x] broader `PROJECT_STATUS.md` auth architecture refresh
- [ ] Manual sign-off matrix:
  - [ ] emulator auth matrix
  - [ ] at least one physical Android device pass
  - [ ] final security checklist sign-off

---

## 6. Notes

- Passwords are hashed with BCrypt.
- Refresh/reset tokens are hashed with SHA-256 for deterministic lookup.
- Google auth code path is retained but disabled to preserve recoverability for future re-introduction.
