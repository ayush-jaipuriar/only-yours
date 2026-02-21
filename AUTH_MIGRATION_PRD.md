# Auth Migration PRD (Phase 1 + Phase 2)

**Project:** Only Yours  
**Author:** Planning baseline from product decisions (Feb 2026)  
**Status:** Ready for implementation planning  
**Scope:** Replace Google auth with email/password in current RN CLI app first, then migrate frontend workflow to Expo after auth stabilizes.

---

## 1. Executive Summary

This PRD defines a two-phase migration strategy:

- **Phase 1 (Auth):** Move from Google sign-in to username/email/password authentication in the existing React Native CLI app and Spring Boot backend.
- **Phase 2 (Platform):** Migrate frontend workflow to Expo only after Phase 1 is stable and production-safe.

This sequencing reduces risk by avoiding simultaneous auth + platform changes.

---

## 2. Locked Product Decisions

These are final decisions from product discussion and are treated as requirements:

- Google login code is temporarily disabled/commented (not deleted permanently).
- No existing users exist (data migration complexity is low).
- Signup fields: `username`, `email`, `password`.
- Email verification: deferred to later.
- Forgot password: required in Phase 1.
- Password policy: minimum 8 chars only.
- Refresh token flow: required (mobile-friendly persistent login).
- Brute-force protection/rate-limit: not required in Phase 1.
- DB migration freedom: allowed (no production users yet).
- Frontend Phase 1 screens in scope: Sign In, Sign Up, Forgot Password, Reset Password.
- Signup behavior: auto-login after successful registration.
- Error style: generic, Android-standard, no account enumeration leaks.
- Profile settings: password updates only via forgot/reset flow (no profile password editor in Phase 1).
- Testing required: backend unit + integration + regression; frontend + manual regression.
- Sign-off requires at least one physical Android device test pass.
- Security negative tests: mandatory.
- Phase 2 migration target recommendation: **Expo managed workflow with EAS development builds** (not Expo Go dependency assumptions).
- Platform target for Phase 2: Android first.
- Expo goals: easier local testing, faster mobile CI automation, long-term dev productivity.

---

## 3. Problem Statement

Current authentication relies on Google OAuth and native Google Sign-In integration.  
This creates friction for:

1. broader user onboarding strategy (users without/avoiding Google flow),
2. auth flow control (password reset, credential lifecycle),
3. future platform tooling simplification.

We need first-party credential authentication with robust token lifecycle and reset flows before considering runtime tooling migration (Expo).

---

## 4. Goals and Non-Goals

## 4.1 Phase 1 Goals (Email/Password Auth)

- Replace primary login/signup with username/email/password.
- Keep JWT auth model but add refresh-token architecture.
- Implement forgot/reset password end-to-end.
- Keep existing non-auth features working (couple linking, game flow, results).
- Provide production-quality auth tests and regression coverage.

## 4.2 Phase 1 Non-Goals

- Email verification (deferred).
- Multi-factor auth.
- Brute-force lockout/rate limiting hardening (deferred by decision).
- iOS-specific auth UX optimization.
- Removing Google support permanently (only disable/comment for now).

## 4.3 Phase 2 Goals (Expo Workflow Migration)

- Migrate Android frontend workflow to Expo (managed + EAS dev builds).
- Preserve all Phase 1 auth behavior and existing gameplay features.
- Improve local developer experience and CI mobile automation readiness.

## 4.4 Phase 2 Non-Goals

- iOS migration in first pass.
- full redesign of UI architecture.
- backend auth protocol changes (Phase 1 auth contracts remain stable).

---

## 5. Functional Requirements (Phase 1)

## FR-1 Registration

- User can register with `username`, `email`, `password`.
- Password must be >= 8 chars.
- Duplicate email and duplicate username rejected with generic user-facing message.
- On successful registration, user is auto-logged-in and receives access + refresh tokens.

## FR-2 Login

- User can log in with email + password.
- Invalid credentials return generic error (no "email not found" leakage).

## FR-3 Token Lifecycle

- Access token short-lived.
- Refresh token long-lived and revocable.
- Client auto-refreshes access token when expired.
- User remains logged in without daily relogin.

## FR-4 Forgot Password

- User enters email to request reset.
- API returns generic success message regardless of account existence.
- Reset token is one-time-use and expires.
- User sets a new password via reset endpoint.

## FR-5 Logout

- Logout revokes refresh token (server-side) and clears client auth state.

## FR-6 Backward Compatibility in Codebase

- Existing Google auth paths are commented/disabled behind clear TODO markers.
- Google provider code remains recoverable for later re-introduction.

---

## 6. Security Requirements (Phase 1)

- Passwords stored as strong hashes (BCrypt recommended).
- Never store plaintext passwords.
- Refresh tokens stored hashed server-side (not plaintext).
- Reset tokens stored hashed and one-time-use.
- Generic auth error responses for login/forgot-password.
- Avoid logging credentials/tokens.
- JWT signing keys remain environment-secret driven.
- Include negative tests for tampered token, expired token, replayed reset token.

---

## 7. Data Model and Migration Plan (Phase 1)

Because there are no existing users, schema migration can be straightforward.

## 7.1 Users table changes

Current model depends on `google_user_id NOT NULL UNIQUE`.  
Update to support multi-provider readiness:

- `username VARCHAR(...) NOT NULL UNIQUE`
- `google_user_id` -> nullable
- `password_hash` nullable for non-email providers
- optional provider marker `auth_provider` (`EMAIL_PASSWORD`, `GOOGLE`)

## 7.2 New table: refresh_tokens

Suggested columns:

- `id UUID PK`
- `user_id UUID FK users(id)`
- `token_hash VARCHAR(...) NOT NULL`
- `expires_at TIMESTAMP NOT NULL`
- `revoked_at TIMESTAMP NULL`
- `created_at TIMESTAMP NOT NULL`
- optional metadata (`device_info`, `ip_address`)

## 7.3 New table: password_reset_tokens

- `id UUID PK`
- `user_id UUID FK users(id)`
- `token_hash VARCHAR(...) NOT NULL`
- `expires_at TIMESTAMP NOT NULL`
- `used_at TIMESTAMP NULL`
- `created_at TIMESTAMP NOT NULL`

## 7.4 Flyway migration strategy

- Add new migration (e.g., `V5__Email_Auth_Foundation.sql`)
- Include explicit constraints and indexes.
- Verify migration idempotency and rollback strategy for local/staging.

---

## 8. API Contracts (Phase 1)

## 8.1 New/updated endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

Legacy endpoint:

- `POST /api/auth/google/signin` -> kept but disabled from frontend usage.

## 8.2 Suggested response model

Use consistent auth response payload:

```json
{
  "accessToken": "jwt",
  "refreshToken": "opaque-or-jwt-refresh",
  "expiresInSeconds": 900,
  "user": {
    "id": "uuid",
    "username": "john",
    "email": "john@example.com"
  }
}
```

Error response (generic):

```json
{
  "message": "Invalid credentials"
}
```

---

## 9. Frontend UX and Screen Requirements (Phase 1)

Required screens:

1. `SignInScreen` (email/password)
2. `SignUpScreen` (username/email/password/confirm)
3. `ForgotPasswordScreen` (email input)
4. `ResetPasswordScreen` (token + new password)

Behavior requirements:

- Generic errors only.
- Loading and disabled button states.
- Auto-login after successful signup.
- Token persistence and silent session restore.
- Existing protected navigation logic remains intact.

---

## 10. Technical Architecture Notes (Phase 1)

## Backend

- Introduce dedicated auth service methods:
  - `registerEmailUser(...)`
  - `loginEmailUser(...)`
  - `issueAccessAndRefreshTokens(...)`
  - `refreshAccessToken(...)`
  - `revokeRefreshToken(...)`
  - `requestPasswordReset(...)`
  - `resetPassword(...)`

## Frontend

- Replace Google sign-in action in `SignInScreen` with email/password submit.
- Add refresh-token interceptor workflow in API layer.
- Keep `AuthContext` as source of truth for login state.

---

## 11. Phase 1 Implementation Plan (Checklist by Section)

## Section A - Backend Schema and Models

- [x] Create Flyway migration for users + auth token tables.
- [x] Update `User` entity fields (`username`, `passwordHash`, optional provider).
- [x] Update repositories for username/email/token lookups.
- [ ] Validate schema with local migration run.

## Section B - Backend Auth APIs

- [x] Implement register endpoint + DTOs + validation.
- [x] Implement login endpoint + credential validation.
- [x] Implement refresh endpoint + rotation/revocation policy.
- [x] Implement logout endpoint (refresh token revocation).
- [x] Implement forgot-password endpoint (generic response).
- [x] Implement reset-password endpoint (one-time token).
- [x] Add centralized auth error mapping to generic messages.

## Section C - Frontend Auth UX

- [x] Replace Google sign-in button with email/password form.
- [x] Build signup screen with username/email/password.
- [x] Add forgot password request flow.
- [x] Add reset password completion flow.
- [x] Implement auto-login after registration.
- [x] Update navigation/auth guards for new auth screens.
- [x] Keep loading/empty/error states consistent with Sprint 6 polish.

## Section D - Token Lifecycle

- [x] Add refresh token storage strategy client-side.
- [x] Add axios interceptor flow:
  - [x] on 401, attempt refresh once
  - [x] retry original request on success
  - [x] force logout on refresh failure
- [x] Ensure race-safe refresh behavior (single refresh in-flight).

## Section E - Forgot Password Delivery

- [x] Implement reset token generation and persistence.
- [ ] Implement delivery adapter strategy (dev + production-ready abstraction).
- [x] Ensure generic responses regardless of account existence.
- [x] Ensure token expiry and one-time consumption.

## Section F - Tests (Mandatory)

- [x] Backend unit tests for auth services and token logic.
- [x] Backend integration tests for all auth endpoints.
- [x] Security negative tests:
  - [x] invalid creds
  - [x] expired access token
  - [x] invalid refresh token
  - [x] reused reset token
  - [x] tampered token
- [x] Frontend auth screen tests (validation, submit, error states).
- [x] Regression tests for non-auth user journey (couple/game/results).

## Section G - Manual Sign-off

- [ ] Emulator tests pass full auth matrix.
- [ ] At least one physical Android device pass before sign-off.
- [ ] No critical or major bugs open.
- [ ] Security checklist reviewed and signed.

## Section H - Documentation Updates

- [ ] Update `TESTING_GUIDE.md` auth sections.
- [x] Update `MANUAL_TESTING_GUIDE_SPRINT6.md` auth flow section.
- [x] Update `PROJECT_STATUS.md` auth architecture.
- [x] Add implementation report for this migration phase.

---

## 12. Phase 1 Exit Criteria ("Auth Stabilized")

Phase 1 is considered stabilized only when all are true:

- All backend auth unit + integration tests pass.
- Security negative tests pass.
- Regression tests pass for gameplay/couple flows.
- Manual testing passes (including >=1 physical Android device).
- No critical/major bugs.
- No known high-risk security gaps in implemented scope.

Only after this gate do we start Phase 2.

---

## 13. Phase 2 PRD - Expo Workflow Migration (After Stabilization)

## 13.1 Target Recommendation

Use **Expo managed workflow + EAS development builds** for Android-first migration.

Reason:

- better dev workflow and CI integration than raw RN CLI
- avoids relying on Expo Go limitations while still gaining Expo tooling benefits

## 13.2 Phase 2 Checklist

## Section A - Compatibility Discovery

- [ ] Confirm Expo SDK version compatible with current React/React Native stack.
- [ ] Audit all dependencies for Expo compatibility.
- [ ] Identify replacements for non-compatible modules.

## Section B - Migration Foundation

- [ ] Add Expo config files and scripts.
- [ ] Align bundler/dev workflow for Expo.
- [ ] Ensure Android build succeeds via Expo/EAS dev build.

## Section C - Runtime Validation

- [ ] Verify auth flows still pass (register/login/refresh/forgot/reset).
- [ ] Verify WebSocket gameplay flows still pass.
- [ ] Verify notifications/permissions (if any later) still behave.

## Section D - CI Automation

- [ ] Add Android Expo build/test jobs in CI.
- [ ] Add smoke automation integration (Maestro or equivalent).
- [ ] Keep release tag deploy workflow intact.

## Section E - Docs and Team Workflow

- [ ] Update setup docs for Expo-based dev flow.
- [ ] Update manual testing runbook for Expo commands.
- [ ] Add troubleshooting for Expo-specific issues.

---

## 14. Effort Estimate (Refined for Option 2)

## Phase 1 (Auth in current RN CLI)

- **Likely:** 3-5 weeks (single developer, full tests + regression)

## Phase 2 (Expo migration after stabilization)

- **Likely:** 2-4 weeks (Android-first, if Phase 1 contracts remain stable)

## Total Option 2

- **Likely:** 5-9 weeks

---

## 15. Risks and Mitigations

### Risk: auth scope creep

- Mitigation: keep phase 1 limited to decisions in Section 2.

### Risk: token refresh race bugs on mobile

- Mitigation: single-flight refresh control + integration tests.

### Risk: regression in existing gameplay

- Mitigation: regression suite and manual gameplay matrix as release gate.

### Risk: Expo migration blocked by dependency mismatch

- Mitigation: start Phase 2 with compatibility spike before code-heavy migration.

---

## 16. Suggested Implementation Order

1. Schema + entities
2. Register/login APIs
3. Refresh/logout APIs
4. Forgot/reset APIs
5. Frontend auth screens + navigation
6. Token refresh integration
7. Full test hardening
8. Manual sign-off
9. Start Phase 2 discovery spike

---

## 17. Progress Tracking Dashboard

Use this PRD checklist as the source of truth.

Global progress:

- [ ] Phase 1 complete
- [ ] Phase 1 stabilized
- [ ] Phase 2 complete
- [ ] Deployment-ready after migration

---

## 18. Week-by-Week Implementation Sprint Plan (Detailed)

This is the execution schedule for Option 2.

Planning baseline:

- Single primary developer flow
- Android-first delivery
- Existing Sprint 6 quality bar retained
- Release tags remain the deployment trigger

## 18.1 Master Timeline (Likely Path: 8 Weeks)

| Week | Phase | Primary Outcome |
|---|---|---|
| Week 1 | Phase 1 | Backend schema foundation + register/login core |
| Week 2 | Phase 1 | Refresh/logout + forgot/reset backend flows complete |
| Week 3 | Phase 1 | Frontend auth screens + context/token flow integration |
| Week 4 | Phase 1 | Integration, security-negative, and regression test hardening |
| Week 5 | Phase 1 | Stabilization, bugfix, physical-device signoff, docs complete |
| Week 6 | Phase 2 | Expo discovery spike + compatibility matrix + final migration plan |
| Week 7 | Phase 2 | Expo Android workflow migration foundation + EAS build path |
| Week 8 | Phase 2 | Validation, CI updates, docs, and Phase 2 signoff |

---

## 18.2 Week 1 Plan - Backend Schema + Register/Login Core

### Objectives

- Introduce data model required for email/password auth.
- Implement baseline register/login APIs.

### Deliverables

- [ ] Flyway migration for auth schema changes (users + token tables)
- [ ] Updated `User` entity and repository methods
- [ ] `POST /api/auth/register`
- [ ] `POST /api/auth/login`
- [ ] BCrypt hashing in service layer

### Week 1 checklist

- [ ] Migration script created and applies cleanly on local DB
- [ ] `username` uniqueness enforced
- [ ] Generic login error response implemented
- [ ] Unit tests for registration + login service methods
- [ ] API contract draft finalized for frontend handoff

### Daily checkpoints (Week 1)

- [ ] Day 1: migration + entity refactor complete
- [ ] Day 2: repository + DTO layer complete
- [ ] Day 3: register endpoint complete + tests
- [ ] Day 4: login endpoint complete + tests
- [ ] Day 5: code review cleanup + docs update

---

## 18.3 Week 2 Plan - Token Lifecycle + Forgot/Reset Backend

### Objectives

- Add refresh token architecture for mobile persistence.
- Implement forgot/reset password end-to-end backend.

### Deliverables

- [ ] `POST /api/auth/refresh`
- [ ] `POST /api/auth/logout` (refresh revocation)
- [ ] `POST /api/auth/forgot-password`
- [ ] `POST /api/auth/reset-password`
- [ ] Reset token generation, hashing, expiry, one-time use

### Week 2 checklist

- [ ] Access token and refresh token issuance flow complete
- [ ] Refresh-token revocation implemented
- [ ] Forgot-password returns generic response regardless of account existence
- [ ] Reset-password token replay prevention implemented
- [ ] Integration tests for refresh/logout/forgot/reset complete

### Daily checkpoints (Week 2)

- [ ] Day 1: refresh table + service + DTO skeleton
- [ ] Day 2: refresh endpoint and token rotation logic
- [ ] Day 3: logout revocation flow
- [ ] Day 4: forgot/reset implementation
- [ ] Day 5: integration and negative test pass

---

## 18.4 Week 3 Plan - Frontend Auth Migration (RN CLI)

### Objectives

- Replace Google-first UX with email/password auth screens.
- Wire token refresh behavior in app networking/state.

### Deliverables

- [ ] New `SignUpScreen`
- [ ] New `ForgotPasswordScreen`
- [ ] New `ResetPasswordScreen`
- [ ] Updated `SignInScreen` (email/password)
- [ ] Updated `AuthContext` token bootstrap and auth state restoration
- [ ] API interceptors for refresh-and-retry
- [ ] Google login code commented/disabled with TODO markers

### Week 3 checklist

- [ ] Signup auto-login works
- [ ] Generic auth errors rendered consistently
- [ ] Refresh flow handles expired access token without forced relogin
- [ ] Logout clears all auth state/tokens
- [ ] Existing protected navigation remains correct

### Daily checkpoints (Week 3)

- [ ] Day 1: auth screen scaffolding and navigation wiring
- [ ] Day 2: signup + login integration
- [ ] Day 3: forgot/reset integration
- [ ] Day 4: token refresh interceptor + retry logic
- [ ] Day 5: cleanup, UX consistency, basic frontend tests

---

## 18.5 Week 4 Plan - Test Hardening + Security Regression

### Objectives

- Achieve backend + frontend test confidence for auth change.
- Ensure no regression to couple/game flows.

### Deliverables

- [ ] Backend unit tests expanded for new auth services
- [ ] Backend integration tests for all new auth endpoints
- [ ] Security negative tests (tampered/expired/replayed/invalid)
- [ ] Frontend auth flow test suites
- [ ] Regression run for gameplay, linking, dashboard, profile

### Week 4 checklist

- [ ] All auth tests passing in CI-equivalent local run
- [ ] Security negative tests passing
- [ ] No P0/P1 regressions in non-auth flows
- [ ] Manual test matrix updated for new auth screens

### Daily checkpoints (Week 4)

- [ ] Day 1: backend unit test pass
- [ ] Day 2: backend integration test pass
- [ ] Day 3: security negative tests pass
- [ ] Day 4: frontend auth tests pass
- [ ] Day 5: full regression and bug triage

---

## 18.6 Week 5 Plan - Phase 1 Stabilization + Signoff

### Objectives

- Close open defects and reach "auth stabilized" gate.
- Complete manual signoff including physical device requirement.

### Deliverables

- [ ] Bugfix sprint for auth and regression issues
- [ ] At least one physical Android device manual signoff
- [ ] Docs updated (`TESTING_GUIDE`, manual guide, project status)
- [ ] Phase 1 implementation report created

### Week 5 checklist

- [ ] No open critical/major bugs
- [ ] Manual critical-path pass evidence captured
- [ ] Security checklist complete
- [ ] Phase 1 stabilization gate approved

### Daily checkpoints (Week 5)

- [ ] Day 1: triage and prioritize outstanding bugs
- [ ] Day 2: fix wave 1
- [ ] Day 3: fix wave 2 + retest
- [ ] Day 4: physical device validation + evidence
- [ ] Day 5: gate review + phase closure documentation

---

## 18.7 Week 6 Plan - Phase 2 Discovery Spike (Expo)

### Objectives

- Validate Expo path feasibility against stabilized auth baseline.
- Avoid blind migration risk.

### Deliverables

- [ ] Expo SDK compatibility matrix for current dependencies
- [ ] Proof-of-boot branch for Expo Android run path
- [ ] Decision log: managed + EAS dev builds confirmation
- [ ] Finalized Phase 2 migration task adjustments

### Week 6 checklist

- [ ] Compatibility blockers identified and categorized
- [ ] No-go/go decision for Week 7 migration foundation
- [ ] Updated risk register for Expo-specific concerns

### Daily checkpoints (Week 6)

- [ ] Day 1: dependency audit
- [ ] Day 2: Expo bootstrap attempt
- [ ] Day 3: run/build validation
- [ ] Day 4: blocker remediation plan
- [ ] Day 5: finalize migration blueprint

---

## 18.8 Week 7 Plan - Expo Migration Foundation (Android)

### Objectives

- Establish stable Expo Android development workflow.
- Preserve existing app functionality.

### Deliverables

- [ ] Expo config files and scripts integrated
- [ ] EAS development build path working
- [ ] Auth and core navigation running under Expo workflow
- [ ] Android CI build lane prototype

### Week 7 checklist

- [ ] App builds and launches under Expo Android path
- [ ] Login/register/refresh/forgot/reset still functional
- [ ] Major runtime regressions triaged and addressed

### Daily checkpoints (Week 7)

- [ ] Day 1: config + script wiring
- [ ] Day 2: Android build stabilization
- [ ] Day 3: auth flow validation
- [ ] Day 4: gameplay flow validation
- [ ] Day 5: CI lane draft

---

## 18.9 Week 8 Plan - Validation, CI, and Phase 2 Signoff

### Objectives

- Finalize Expo migration quality and docs.
- Reach deploy-ready status after migration.

### Deliverables

- [ ] CI updates for Expo Android build/test path
- [ ] Manual testing guide updated for Expo commands
- [ ] Troubleshooting docs updated
- [ ] Phase 2 signoff and closure report

### Week 8 checklist

- [ ] No critical/major Expo migration bugs
- [ ] Release gate passes on migrated workflow
- [ ] Deployment readiness confirmed

### Daily checkpoints (Week 8)

- [ ] Day 1: CI stabilization
- [ ] Day 2: test reruns and fixes
- [ ] Day 3: docs completion
- [ ] Day 4: signoff dry run
- [ ] Day 5: final gate review

---

## 19. File-by-File Sequencing Plan

This section defines implementation order at file granularity.

## 19.1 Phase 1 - Backend (Order of Changes)

1. `backend/src/main/resources/db/migration/V5__Email_Auth_Foundation.sql` (new)
2. `backend/src/main/java/com/onlyyours/model/User.java`
3. `backend/src/main/java/com/onlyyours/repository/UserRepository.java`
4. `backend/src/main/java/com/onlyyours/dto/*` (new auth DTOs)
5. `backend/src/main/java/com/onlyyours/service/AuthService.java` (major refactor)
6. `backend/src/main/java/com/onlyyours/controller/AuthController.java` (new endpoints)
7. `backend/src/main/java/com/onlyyours/security/*` (token refresh integration as needed)
8. `backend/src/test/java/com/onlyyours/service/*Auth*.java` (new/updated tests)
9. `backend/src/test/java/com/onlyyours/integration/*Auth*.java` (new integration tests)

## 19.2 Phase 1 - Frontend (Order of Changes)

1. `OnlyYoursApp/src/screens/SignInScreen.js` (replace Google UI path)
2. `OnlyYoursApp/src/screens/SignUpScreen.js` (new)
3. `OnlyYoursApp/src/screens/ForgotPasswordScreen.js` (new)
4. `OnlyYoursApp/src/screens/ResetPasswordScreen.js` (new)
5. `OnlyYoursApp/src/navigation/AppNavigator.js` (auth route updates)
6. `OnlyYoursApp/src/state/AuthContext.js` (auth flow/state logic)
7. `OnlyYoursApp/src/services/api.js` (refresh interceptor logic)
8. `OnlyYoursApp/src/screens/__tests__/*` and `src/state/__tests__/*` (auth/regression tests)

## 19.3 Phase 2 - Expo Migration (Order of Changes)

1. `OnlyYoursApp/package.json` (scripts/dependencies alignment)
2. `OnlyYoursApp/app.json` or `app.config.*` (new)
3. `OnlyYoursApp/eas.json` (new)
4. `OnlyYoursApp/babel.config.js` / Metro config alignment
5. CI workflows in `.github/workflows/*` for Android build/test path
6. Documentation updates (`README`, testing guide, manual guide)

---

## 20. Daily Execution Template (Use During Implementation)

Use this template every implementation day:

- [ ] Planned tasks for the day explicitly listed
- [ ] Target files to modify listed before coding
- [ ] Unit/integration tests run for touched area
- [ ] Regression spot-check performed
- [ ] Docs updated for completed checklist items
- [ ] Open blockers logged with next action

---

## 21. Milestone Gates (Formal)

## Gate G1 - Backend Auth Core Complete (end Week 2)

- [ ] Register/login/refresh/logout/forgot/reset endpoints implemented
- [ ] Schema migration complete
- [ ] Backend tests passing for new auth logic

## Gate G2 - Frontend Auth Integration Complete (end Week 3)

- [ ] New auth screens functional
- [ ] Token lifecycle in app functioning
- [ ] Google path disabled/commented with TODO markers

## Gate G3 - Phase 1 Stabilized (end Week 5)

- [ ] All auth tests pass
- [ ] No critical/major bugs
- [ ] Security negative tests pass
- [ ] Physical device signoff completed

## Gate G4 - Phase 2 Complete (end Week 8)

- [ ] Expo Android workflow operational
- [ ] CI updated and green
- [ ] Docs and manual runbooks updated

---

## 22. Contingency Plan (If Delays Happen)

If timeline slips:

1. Freeze non-auth feature work immediately.
2. Prioritize Phase 1 completion before starting any Phase 2 tasks.
3. Defer optional UX enhancements to post-migration cleanup.
4. Preserve release quality gates; do not skip security negative tests.

---

## 23. Progress Counters (Optional Tracking)

You can track with these counters weekly:

- Backend auth checklist completion: `0/XX`
- Frontend auth checklist completion: `0/XX`
- Test checklist completion: `0/XX`
- Docs checklist completion: `0/XX`
- Phase completion:
  - [ ] Phase 1 complete
  - [ ] Phase 2 complete

