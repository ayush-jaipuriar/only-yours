# Feasibility Checklist & Effort Estimate

## Migrate to Expo + Email/Password Auth

**Date:** February 2026  
**Current baseline:** React Native CLI (`react-native@0.75.4`) + Google Sign-In + Spring Boot JWT backend  
**Goal under evaluation:** Move frontend to Expo workflow and replace Google auth with email/password auth.

---

## 1) Executive Summary

## Feasibility Verdict

**Technically feasible:** Yes  
**Delivery complexity:** Medium-to-High  
**Primary risk areas:** Expo/RN compatibility alignment, backend auth security requirements, and migration scope creep.

## Recommendation (PMF stage)

If your immediate goal is faster manual testing + first release:

- **Do not do full migration now** unless product strategy requires email/password.
- Continue current stack, use emulators + manual guide + add lightweight UI automation.

If your strategic goal is auth model change (non-Google users), then migration is valid — but treat it as a dedicated sprint/epic, not a side tweak.

---

## 2) Why This Is a Bigger Change Than It Looks

You are changing **two foundations at once**:

1. **Client runtime/workflow** (React Native CLI -> Expo)
2. **Identity model** (Google OAuth -> email/password)

Each is manageable independently; together they multiply uncertainty:

- auth screens, backend APIs, DB schema, security rules, and tests all change
- existing docs/test flows are Google-based and must be rewritten
- release risk rises because login is a hard dependency for every feature

---

## 3) Current-State Snapshot (Impact Mapping)

Based on the current codebase:

- Frontend dependency includes `@react-native-google-signin/google-signin` in `OnlyYoursApp/package.json`
- Sign-in flow in `OnlyYoursApp/src/screens/SignInScreen.js` posts to `/api/auth/google/signin`
- Backend `AuthService` verifies Google token and persists `googleUserId`
- Backend user model and DB schema currently require `google_user_id NOT NULL UNIQUE`:
  - `backend/src/main/java/com/onlyyours/model/User.java`
  - `backend/src/main/resources/db/migration/V1__Initial_Schema.sql`

This means email/password is not just UI; it requires backend/domain/schema changes.

---

## 4) Feasibility Checklist (Detailed)

Use this as a go/no-go tracking sheet.

## A. Discovery & Architecture

- Confirm if Expo migration target is:
  - Expo Go (fully managed)
  - Expo Dev Client (custom native modules allowed)
- Validate React Native version compatibility with target Expo SDK
- Audit all dependencies for Expo compatibility
- Decide auth scope:
  - Login only
  - Register + login
  - - password reset
  - - email verification
- Define backward compatibility strategy for existing Google users/data

## B. Backend Auth Redesign

- Add provider strategy to user model (`GOOGLE`, `EMAIL_PASSWORD`)
- Make `google_user_id` nullable (or provider-specific)
- Add `password_hash` column (nullable for Google users)
- Add Flyway migration for schema changes and constraints
- Add register endpoint (`POST /api/auth/register`)
- Add login endpoint (`POST /api/auth/login`)
- Add password hashing (BCrypt/Argon2; BCrypt easiest in Spring stack)
- Add credential validation and secure error responses
- Keep JWT issuance path stable
- Add auth-related integration tests

## C. Frontend Auth Refactor

- Replace Google sign-in button flow with email/password form flow
- Add form validation (email format, password rules)
- Add register screen (if in scope)
- Update `AuthContext` login bootstrap flow to use new endpoints
- Remove Google Sign-In SDK usage from app entry/sign-in screen
- Update user-facing copy and error states

## D. Expo Migration Work

- Create migration branch and checkpoint backup
- Add Expo tooling/config (`app.json`, expo scripts, etc.)
- Align dependencies to Expo-supported versions
- Verify Android build and run path in Expo workflow
- Verify WebSocket behavior in Expo runtime
- Update local dev docs and run commands

## E. Security & Compliance (Email/Password)

- Password hashing implemented and tested
- Password minimum policy documented and enforced
- Basic brute-force mitigation (rate-limit/lockout strategy)
- Generic auth error messages (avoid credential enumeration)
- Sensitive logs scrubbed (no plaintext credentials in logs)
- Secret management unchanged (env vars/Secret Manager)

## F. Test & Release Readiness

- Backend tests updated and passing
- Frontend tests updated and passing
- Manual critical-path tests updated for email/password flow
- Migration docs updated (`README`, testing guide, deployment docs)
- Release gate checks updated in CI

---

## 5) Effort Estimate (Solo Developer)

Estimates include dev + debugging + validation time.

## Scenario A — Minimal Viable Migration

Scope:

- Expo migration
- Email/password login/register
- No password reset/email verification in v1
- Keep JWT model, no social login fallback

Estimate:

- **Best case:** 10-14 working days
- **Likely:** 15-22 working days
- **Worst case:** 25-35 working days

## Scenario B — Production-Grade Auth Migration

Adds:

- Password reset flow
- Email verification
- Stronger rate-limit/abuse controls
- More complete edge-case handling and tests

Estimate:

- **Best case:** 20-28 working days
- **Likely:** 30-45 working days
- **Worst case:** 50-70 working days

---

## 6) Workstream-Level Breakdown (Likely Case)


| Workstream                      | Likely Effort  |
| ------------------------------- | -------------- |
| Discovery + compatibility spike | 2-4 days       |
| Expo migration foundation       | 4-7 days       |
| Backend auth/schema redesign    | 4-8 days       |
| Frontend auth UX refactor       | 3-6 days       |
| Testing + bugfix hardening      | 3-6 days       |
| Docs + CI updates               | 1-3 days       |
| **Total likely**                | **17-34 days** |


---

## 7) Major Risks & Mitigations

## Risk 1: Expo SDK mismatch with current RN toolchain

- **Impact:** Medium/High (can stall migration)
- **Mitigation:** Do a 2-day spike before committing; lock exact versions early.

## Risk 2: Auth scope creep (forgot password, verification, lockouts, abuse handling)

- **Impact:** High
- **Mitigation:** Freeze scope with explicit v1/v2 auth features.

## Risk 3: Schema and data migration complexity

- **Impact:** Medium
- **Mitigation:** Add migration with reversible strategy; test with staging-like data locally.

## Risk 4: Regression in login-gated core gameplay

- **Impact:** High
- **Mitigation:** Expand critical-path manual tests and auth integration tests before release.

---

## 8) Decision Framework (When to Do It)

Proceed now only if **all** are true:

- Product requires non-Google sign-in for target users
- You can allocate 3-6 weeks focused effort
- You accept short-term slowdown on feature velocity
- You are ready to pause deployment work during migration window

Defer for now if:

- Main objective is quick launch/PMF with current Google auth working
- Team bandwidth is limited
- Current testing friction can be solved with emulator/manual workflow

---

## 9) Suggested Path (Pragmatic)

## Option 1 (Recommended now): No full migration yet

1. Keep current RN CLI + Google auth
2. Finalize manual testing and first deployment
3. Add small automation layer (UI smoke checks)
4. Revisit auth migration after initial PMF signals

## Option 2 (If migration is strategic now): Controlled 2-phase approach

Phase 1:

- Email/password backend + frontend auth in current RN CLI app
- Keep Expo migration out of this phase

Phase 2:

- Expo workflow migration after auth stabilizes

Why this split helps:

- isolates risk
- easier debugging
- smaller rollback surface

---

## 10) 2-Day Discovery Spike Plan (Before Commitment)

If you still want to proceed, first run this spike:

Day 1:

- Validate Expo compatibility for existing dependencies
- Create throwaway branch with minimal Expo bootstrap
- Check app boots + navigation loads

Day 2:

- Prototype email/password login API + one frontend form
- Validate JWT login + protected endpoint call
- Record blockers and effort confidence

Output of spike:

- go/no-go decision with confidence level
- revised estimate range
- confirmed scope for implementation sprint

