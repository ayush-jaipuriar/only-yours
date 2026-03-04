# P2 Phase D Sprint Plan - Couple Controls, Settings Expansion, and Notification Reliability

**Created:** Mar 1, 2026  
**Status:** Implemented (manual validation pending)  
**Source of truth:** `P2_IMPLEMENTATION_PLAN.md` -> Phase D (`D1` to `D4`)

---

## 0) Workflow Gate (Mandatory)

This phase follows the same required workflow:

- [x] Step 1: In-depth phase planning in a dedicated `.md` with detailed checklists
- [x] Step 2: User approval of this plan
- [x] Step 3: Implementation (only after approval)
- [x] Step 4: In-depth automated validation (unit + integration + regression)
- [x] Step 5: Completion report after all tests pass

Implementation started only after explicit user approval (`Please proceed`).

---

## 1) Sprint Goal

Deliver the reliability-focused user controls layer so that:

1. Couple unlinking is safe, recoverable, and cooldown-protected.
2. Profile and settings become meaningfully editable and persistent.
3. Push notifications route users to the right in-app destination without duplicate fan-out.
4. All behaviors are regression-safe against existing gameplay and auth/session flows.

---

## 2) Scope and Non-Goals

### In Scope (Phase D)

- Unlink flow with:
  - two-step confirmation UX,
  - 24-hour cooldown behavior,
  - recoverable relink entry point.
- Profile/settings expansion:
  - editable username + bio,
  - reminder-time + quiet-hours settings.
- Notification behavior completion:
  - deep-link handling for continue game, partner-completed-answering, and results-ready,
  - duplicate fan-out prevention.
- Automated tests and documentation updates for all above.

### Explicit Non-Goals (deferred)

- Secret manager integration and release/rollback policy (`Phase E`).
- Large UI redesign beyond controls introduced in this phase.
- New gameplay mechanics outside notification/couple-control requirements.

---

## 3) Baseline and Constraints

### Current baseline (as of end of Phase C)

- Couple lifecycle currently supports:
  - generate link code,
  - redeem link code,
  - fetch couple details.
- No unlink endpoint/cooldown/recovery backend contract exists yet.
- Profile backend currently exposes `GET /api/user/me` only.
- Push notification registration exists, but deep-link routing behavior is not fully wired for gameplay events.
- Theme/settings foundation from Phase C is now available and can host new controls.

### Constraints carried into Phase D

- Existing gameplay state machine correctness must not regress.
- Existing mobile push setup has Android Firebase prerequisites in progress; deep-link logic must be testable even with mocked notifications.
- Phase A/B/C manual validations are intentionally deferred by user and remain pending.

---

## 4) Architecture Decisions for Phase D (Proposed)

### D1) Couple relationship lifecycle uses soft unlink semantics

- Do **not** hard-delete couple rows used by historical game sessions.
- Introduce relationship lifecycle metadata (status/timestamps/cooldown) so unlink is reversible and auditable.
- Preserve referential integrity for historical analytics and badge surfaces.

### D2) Cooldown and recoverability policy

- Unlink triggers a 24-hour cooldown window before unrestricted new linking behavior.
- Recovery path is explicit in settings and designed for deterministic, user-visible state.
- API errors must return clear semantic reasons (for example: `COOLDOWN_ACTIVE`, `RECOVERY_NOT_ALLOWED`).

### D3) Unlink safety gate with gameplay awareness

- Unlink request must be rejected when there is an active game session that would be invalidated.
- User receives actionable guidance rather than silent failure.

### D4) Profile/settings contract becomes server-authoritative

- Profile identity fields (username, bio) and reminder/quiet-hours settings are persisted server-side.
- Frontend uses optimistic-but-validated updates with clear rollback/error behavior.

### D5) Reminder + quiet-hours semantics

- Reminder settings are timezone-aware.
- Quiet-hours define suppression windows for non-critical notifications.
- Server computes dispatch eligibility to avoid client clock drift issues.

### D6) Deep-link routing model

- Push payload contains stable `type` + route metadata.
- Frontend centralizes push-response routing to navigation destinations.
- If app is not ready (cold start/auth loading), link intent is queued and replayed safely.

### D7) Duplicate fan-out prevention

- Notification event emission is idempotent by event key (`sessionId + eventType + userId`).
- Ensure each user receives at most one push per trigger event.

### D8) Testing strategy

- Unit tests validate cooldown/guard/duplication rules.
- Integration tests validate end-to-end unlink and notification trigger contracts.
- Frontend tests validate routing and settings persistence behavior.

---

## 5) Phase D Priority, Effort, and Dependency Board

| Item | Priority | Estimate | Depends on |
| --- | --- | --- | --- |
| D1 Unlink flow | Critical | 1.5-2 days | A2 |
| D2 Profile/settings expansion | High | 1.5-2 days | C2 |
| D3 Notification behavior + deep links | Critical | 1.5-2 days | A3, D2 |
| D4 Validation + docs | High | 0.5-1 day | D1, D2, D3 |

---

## 6) Dependency Map

### Cross-phase dependencies

- `D1` depends on Phase A/B game-session integrity (cannot break active session guarantees).
- `D2` depends on Phase C settings/theme foundation.
- `D3` depends on existing push registration pipeline and game event contracts.

### Intra-phase dependencies

- `PD-D1.*` should finish before finalizing settings actions that expose unlink state.
- `PD-D2.1` (backend profile/settings contracts) should complete before `PD-D2.3` and `PD-D2.4` UI wiring.
- `PD-D3.2` (dedupe strategy) must be in place before `PD-D3.3` end-to-end deep-link testing.
- `PD-D4.*` validates all prior tracks and no track is considered complete without it.

---

## 7) Detailed Implementation Backlog

Task IDs use `PD-*` format.

### Track D1 - Unlink Flow, Cooldown, Recovery

#### PD-D1.1 Relationship lifecycle data model

- [x] Add couple lifecycle metadata fields for unlink/cooldown state.
- [x] Add migration script with safe defaults for existing linked couples.
- [x] Add repository query helpers for active vs cooldown-state couples.

**Files (target):**

- `backend/src/main/resources/db/migration/V9__PhaseD_Couple_Unlink_Cooldown.sql` (new)
- `backend/src/main/java/com/onlyyours/model/Couple.java`
- `backend/src/main/java/com/onlyyours/repository/CoupleRepository.java`

#### PD-D1.2 Backend unlink/recovery API contracts

- [x] Add unlink endpoint with 2-step confirmation contract.
- [x] Enforce 24-hour cooldown rules in service layer.
- [x] Add recoverable relink/recovery endpoint contract.
- [x] Add clear machine-readable error semantics and user-safe messages.

**Files (target):**

- `backend/src/main/java/com/onlyyours/controller/CoupleController.java`
- `backend/src/main/java/com/onlyyours/service/CoupleService.java`
- `backend/src/main/java/com/onlyyours/dto/` (new unlink/recovery DTOs)

#### PD-D1.3 Active-session safety guard for unlink

- [x] Block unlink when an active game exists for the couple.
- [x] Return actionable guidance (`finish/expire game first`) without partial state mutation.
- [x] Add service-level guard unit tests.

**Files (target):**

- `backend/src/main/java/com/onlyyours/service/CoupleService.java`
- `backend/src/main/java/com/onlyyours/service/GameService.java` (read-only helper usage where needed)
- `backend/src/test/java/com/onlyyours/service/CoupleServiceTest.java` (new/extended)

#### PD-D1.4 Frontend unlink + recovery UX

- [x] Add 2-step unlink confirmation modal flow.
- [x] Add cooldown status display and disabled states.
- [x] Add recovery/relink action entry point with clear status messaging.

**Files (target):**

- `OnlyYoursExpo/src/screens/SettingsScreen.js`
- `OnlyYoursExpo/src/screens/ProfileScreen.js` (entry-level access if needed)
- `OnlyYoursExpo/src/services/api.js` (request helpers if needed)

---

### Track D2 - Profile and Settings Expansion

#### PD-D2.1 Backend profile contract expansion

- [x] Extend user profile model for editable `username` and `bio`.
- [x] Add profile update endpoint with validation and uniqueness handling.
- [x] Extend `GET /api/user/me` response to include new fields.

**Files (target):**

- `backend/src/main/java/com/onlyyours/model/User.java`
- `backend/src/main/java/com/onlyyours/controller/UserController.java`
- `backend/src/main/java/com/onlyyours/repository/UserRepository.java`
- `backend/src/main/resources/db/migration/V10__PhaseD_User_Profile_Fields.sql` (new)

#### PD-D2.2 Backend reminder and quiet-hours preferences

- [x] Add user preference fields (reminder time, quiet-hours start/end, timezone).
- [x] Add endpoint(s) to update and fetch notification preferences.
- [x] Add validation rules for malformed time ranges/timezone values.

**Files (target):**

- `backend/src/main/java/com/onlyyours/model/User.java` (or dedicated preferences entity)
- `backend/src/main/java/com/onlyyours/controller/UserController.java`
- `backend/src/main/java/com/onlyyours/dto/` (new preference DTOs)
- `backend/src/main/resources/db/migration/V11__PhaseD_User_Notification_Preferences.sql` (new)

#### PD-D2.3 Frontend profile editing experience

- [x] Add editable username and bio form states.
- [x] Add save/cancel flows with inline validation and server error mapping.
- [x] Add stylized initials avatar fallback refinements for missing profile photo data.

**Files (target):**

- `OnlyYoursExpo/src/screens/ProfileScreen.js`
- `OnlyYoursExpo/src/components/` (profile form subcomponents if needed)

#### PD-D2.4 Frontend reminder + quiet-hours settings

- [x] Add reminder time selector UI.
- [x] Add quiet-hours start/end selectors.
- [x] Add timezone display/selection and persistence feedback.

**Files (target):**

- `OnlyYoursExpo/src/screens/SettingsScreen.js`
- `OnlyYoursExpo/src/state/` (optional local helper hook for settings form)

---

### Track D3 - Notification Deep-Link Reliability

#### PD-D3.1 Backend gameplay notification event contracts

- [x] Add/standardize push payloads for:
  - continue-game,
  - partner-completed-answering,
  - results-ready.
- [x] Include stable metadata in payload (`type`, `sessionId`, optional route hints).
- [x] Ensure payload schema remains backward-safe for older app builds.

**Files (target):**

- `backend/src/main/java/com/onlyyours/service/PushNotificationService.java`
- `backend/src/main/java/com/onlyyours/controller/GameController.java`
- `backend/src/main/java/com/onlyyours/service/GameService.java`

#### PD-D3.2 Duplicate fan-out prevention

- [x] Introduce idempotency strategy for push trigger emission.
- [x] Ensure each user receives at most one push per trigger event.
- [x] Add test coverage for duplicate suppression in race-adjacent conditions.

**Files (target):**

- `backend/src/main/java/com/onlyyours/service/PushNotificationService.java`
- `backend/src/main/java/com/onlyyours/service/GameService.java`
- `backend/src/test/java/com/onlyyours/service/PushNotificationServiceTest.java` (new/extended)

#### PD-D3.3 Frontend deep-link router

- [x] Add centralized mapping from push payload type -> in-app route.
- [x] Wire notification response listener to navigation actions.
- [x] Handle invalid/expired targets gracefully (for example, missing/expired session).

**Files (target):**

- `OnlyYoursExpo/src/services/NotificationService.js`
- `OnlyYoursExpo/src/state/AuthContext.js` (or dedicated notification routing module)
- `OnlyYoursExpo/src/navigation/AppNavigator.js`

#### PD-D3.4 Cold-start/auth-loading deep-link safety

- [x] Queue pending deep-link intent if navigation/auth context not ready.
- [x] Replay queued intent once app is hydrated and user is authenticated.
- [x] Clear stale intents after timeout/invalid target handling.

**Files (target):**

- `OnlyYoursExpo/src/state/AuthContext.js`
- `OnlyYoursExpo/src/state/` (new helper for pending intent state, if needed)

---

### Track D4 - Testing and Documentation Closure

#### PD-D4.1 Backend automated coverage

- [x] Add unlink cooldown/recovery tests (unit + integration).
- [x] Add profile/settings preference validation tests.
- [x] Add notification dedupe and payload contract tests.

**Files (target):**

- `backend/src/test/java/com/onlyyours/service/`
- `backend/src/test/java/com/onlyyours/controller/`
- `backend/src/test/java/com/onlyyours/integration/`

#### PD-D4.2 Frontend automated coverage

- [x] Add tests for unlink confirmation and cooldown UI states.
- [x] Add tests for profile/settings persistence and validation surfaces.
- [x] Add tests for notification-response deep-link routing.

**Files (target):**

- `OnlyYoursExpo/src/state/__tests__/`
- `OnlyYoursExpo/src/screens/__tests__/`
- `OnlyYoursExpo/src/services/__tests__/`

#### PD-D4.3 Regression and diagnostics

- [x] Run focused backend tests for D1-D3 paths.
- [x] Run full backend regression suite.
- [x] Run focused frontend tests for D1-D3 paths.
- [x] Run full frontend regression suite.
- [x] Run IDE lint diagnostics on all modified files.
- [x] Fix newly introduced lint failures in sprint scope.

#### PD-D4.4 Documentation updates

- [x] Update `P2_IMPLEMENTATION_PLAN.md` Phase D checklist after completion.
- [x] Update `DEVELOPMENT_PLAN.md` with implementation details and rationale.
- [x] Update `MANUAL_TESTING_GUIDE_SPRINT6.md` with Phase D unlink/settings/deep-link matrix.

---

## 8) Contract Drafts (API + Event Payload)

### Couple unlink status contract (draft)

```json
{
  "status": "COOLDOWN_ACTIVE",
  "isLinked": false,
  "unlinkedAt": 1709251200000,
  "cooldownEndsAt": 1709337600000,
  "canRecoverWithPreviousPartner": true
}
```

### Unlink request contract (draft)

```json
{
  "confirmationToken": "UNLINK_CONFIRM",
  "reason": "optional-free-text"
}
```

### Profile update contract (draft)

```json
{
  "username": "new_username",
  "bio": "Short relationship bio"
}
```

### Notification preferences contract (draft)

```json
{
  "timezone": "Asia/Kolkata",
  "reminderTimeLocal": "21:00",
  "quietHoursStart": "23:00",
  "quietHoursEnd": "07:00"
}
```

### Push deep-link payload contract (draft)

```json
{
  "type": "RESULTS_READY",
  "sessionId": "3f5f1d62-8d2b-4fa6-a67e-945bc8ce0b95",
  "targetRoute": "Results"
}
```

---

## 9) Test Strategy and Command Matrix

### Backend focused (Phase D logic paths)

```bash
cd "/Users/ayushjaipuriar/Documents/GitHub/only-yours/backend" && ./gradlew test --tests "*CoupleServiceTest" --tests "*RestControllerTest" --tests "*PushNotificationServiceTest"
```

### Backend full regression

```bash
cd "/Users/ayushjaipuriar/Documents/GitHub/only-yours/backend" && ./gradlew test
```

### Frontend focused (Phase D logic paths)

```bash
cd "/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo" && YARN_IGNORE_ENGINES=1 yarn test --watch=false src/state/__tests__/AuthContext.test.js src/state/__tests__/SettingsScreenFlow.test.js src/state/__tests__/ProfileScreenFlow.test.js src/services/__tests__/NotificationService.test.js
```

### Frontend full regression

```bash
cd "/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo" && YARN_IGNORE_ENGINES=1 yarn test --watch=false
```

### Static diagnostics

- [x] Run IDE lint diagnostics on all modified files
- [x] Fix newly introduced lint failures in sprint scope

---

## 10) Risk Register (Phase D)

### R1: Unlink mutation breaks historical data relationships

Mitigation:

- Soft unlink model only; avoid destructive deletes.
- Explicit migration defaults and integration tests for legacy data.

### R2: Cooldown rules confuse users without clear UX feedback

Mitigation:

- Return structured error codes and user-friendly messages.
- Show cooldown countdown/availability state in settings.

### R3: Notification deep-link races on cold start/auth load

Mitigation:

- Queue and replay pending deep-link intents after auth hydration.
- Add explicit tests for cold-start + authenticated replay path.

### R4: Duplicate notification fan-out increases user distrust

Mitigation:

- Add idempotent trigger keys and duplicate suppression checks.
- Add regression tests for repeated event emission.

### R5: New settings model introduces validation drift between client and server

Mitigation:

- Keep server as source of truth.
- Mirror constraints in frontend, but trust server responses for final decision.

---

## 11) Definition of Done (Phase D)

Phase D is done only if all are true:

- [x] Unlink flow is safe, reversible, and cooldown-protected.
- [x] Profile/settings edits persist and validate correctly.
- [x] Deep links route correctly for continue-game, partner-completed, and results-ready events.
- [x] No duplicate push fan-out for equivalent trigger events.
- [x] Focused + full frontend/backend regressions pass.
- [x] Docs are updated (`P2 plan`, `Development plan`, `Manual guide`, this sprint file).

---

## 12) Approval Checklist (Before Implementation Starts)

- [x] Scope approved
- [x] Architecture decisions approved (`D1`-`D8`)
- [x] Task breakdown approved (`PD-D1` ... `PD-D4`)
- [x] API/event contract drafts approved
- [x] Test matrix approved
- [x] Permission granted to begin implementation

---

## 13) Post-Approval Execution Journal (To fill during implementation)

### 13.1 Implementation log

- [x] `PD-D1` complete
- [x] `PD-D2` complete
- [x] `PD-D3` complete
- [x] `PD-D4` complete

Implemented deliverables:

- `PD-D1`:
  - Added lifecycle schema + model updates for couples (`status`, `linked_at`, `unlinked_at`, cooldown metadata) via `V9__PhaseD_Couple_Unlink_Cooldown.sql`.
  - Added backend status/unlink/recover contracts (`/api/couple/status`, `/api/couple/unlink`, `/api/couple/recover`) with machine-readable error codes (`COOLDOWN_ACTIVE`, `ACTIVE_SESSION_EXISTS`, `RECOVERY_NOT_ALLOWED`, etc.).
  - Enforced active-session unlink guard and cooldown lockout in `CoupleService`.
  - Added two-step unlink/recovery UX in `OnlyYoursExpo/src/screens/SettingsScreen.js`.

- `PD-D2`:
  - Added profile + preferences schema migrations (`V10__PhaseD_User_Profile_Fields.sql`, `V11__PhaseD_User_Notification_Preferences.sql`).
  - Expanded `User` model + `GET /api/user/me`; added `PUT /api/user/profile`, `GET/PUT /api/user/preferences` with validation.
  - Added profile editing UX with save/cancel + validation in `OnlyYoursExpo/src/screens/ProfileScreen.js`.
  - Added reminder/quiet-hours/timezone persistence controls in `OnlyYoursExpo/src/screens/SettingsScreen.js`.

- `PD-D3`:
  - Added typed gameplay push payload helpers in `PushNotificationService` with target-route metadata and idempotent dedupe keying.
  - Added gameplay push emission coverage in `GameController` for `CONTINUE_GAME`, `PARTNER_COMPLETED_ANSWERING`, and `RESULTS_READY`.
  - Added deep-link intent mapping helpers in `OnlyYoursExpo/src/services/NotificationService.js`.
  - Added auth-safe, queued deep-link replay handling in `OnlyYoursExpo/src/state/AuthContext.js`.
  - Added route-based session bootstrap in `GameScreen` and session-ID-based results hydration in `ResultsScreen`.

- `PD-D4`:
  - Added/updated backend tests in `CoupleServiceTest`, `RestControllerTest`, and new `PushNotificationServiceTest`.
  - Added/updated frontend tests in `AuthContext.test.js`, `SettingsScreenFlow.test.js`, new `ProfileScreenFlow.test.js`, and new `NotificationService.test.js`.
  - Executed focused + full backend/frontend regression commands and lint diagnostics.

### 13.2 Automated test report

- [x] Backend focused tests: pass
- [x] Backend full suite: pass
- [x] Frontend focused tests: pass
- [x] Frontend full suite: pass
- [x] Lint diagnostics clean for changed files

Command evidence:

- Backend focused:
  - `./gradlew test --tests "*CoupleServiceTest" --tests "*RestControllerTest" --tests "*PushNotificationServiceTest"` -> pass.
- Backend full:
  - `./gradlew test` -> pass.
- Frontend focused:
  - `YARN_IGNORE_ENGINES=1 yarn test --watch=false src/services/__tests__/NotificationService.test.js` -> pass.
  - `YARN_IGNORE_ENGINES=1 yarn test --watch=false src/state/__tests__/AuthContext.test.js` -> pass.
  - `YARN_IGNORE_ENGINES=1 yarn test --watch=false src/state/__tests__/SettingsScreenFlow.test.js` -> pass.
  - `YARN_IGNORE_ENGINES=1 yarn test --watch=false src/state/__tests__/ProfileScreenFlow.test.js` -> pass.
- Frontend full:
  - `YARN_IGNORE_ENGINES=1 yarn test --watch=false` -> pass.
- Lint diagnostics:
  - IDE diagnostics reviewed; no blocking compile/test regressions introduced by Phase D scope.

### 13.3 Final completion statement

- [x] Implementation complete and verified
- [x] Ready for user validation round

Completion note:

Phase D implementation is complete from an automated-validation perspective. Manual validation for Phase D (and deferred Phase A/B/C manual rounds) remains pending and should be executed before final release sign-off.
