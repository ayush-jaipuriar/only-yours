# P2 Phase A Sprint Plan - Session Integrity and Async Continuation

**Created:** Feb 22, 2026  
**Status:** Core implementation complete and validated (automated); manual device validation pending  
**Source of truth:** `P2_IMPLEMENTATION_PLAN.md` -> Phase A (`A1` to `A6`)

---

## 0) Workflow Gate (Mandatory)

This sprint follows the workflow you explicitly requested:

- [x] Step 1: In-depth phase planning in a dedicated `.md` with detailed checklists
- [x] Step 2: User approval of this plan
- [x] Step 3: Implementation (only after approval)
- [x] Step 4: In-depth automated validation (unit + integration + regression)
- [x] Step 5: Completion report after all tests pass

Implementation started only after Step 2 was explicitly approved by user.

---

## 1) Sprint Goal

Build a robust continuation foundation so a couple can pause and resume gameplay safely with:

1. Exactly one active game session per couple at any time
2. Auto-expiry after 7 days
3. Correct round gating (`ROUND2` unlock only after both complete `ROUND1`; results only after both complete `ROUND2`)
4. Continue-game UX entry point
5. Sequential gameplay unchanged (one current question at a time)

---

## 2) Scope and Non-Goals

### In Scope (Phase A)

- Session lifecycle hardening in backend data model and service logic
- Active session discovery endpoint(s) for frontend CTA
- Realtime event contract additions for continuation status
- Frontend continue/resume/reconnect/expired UX wiring
- Test coverage expansion for new state transitions and edge cases
- Documentation updates for QA and troubleshooting

### Explicit Non-Goals (deferred to later phases)

- Historical games list UI/API (`Phase B`)
- Dashboard metrics and badges (`Phase B`)
- Theme system and onboarding redesign (`Phase C`)
- Unlink/settings/deep-link full finishing (`Phase D`)
- Secret manager + release rollback drill closure (`Phase E`)

---

## 3) Baseline (Current Behavior)

Current system strengths:

- Core invitation -> answer -> guess -> results loop works
- Round transitions are already implemented in `GameService`
- Frontend `GameContext` already enforces sequential question rendering
- WebSocket subscription race hardening and reconnection have been added

Current gaps for this sprint:

- No hard guarantee of single active session per couple (concurrency-safe)
- No session expiry model (7-day auto-expiry not enforced)
- No canonical "continue game" summary endpoint for dashboard CTA
- Mid-session leave/return signal semantics not formalized end-to-end

---

## 4) Architecture Decisions for Phase A (Proposed for Approval)

### D1) Single active session enforcement

- Enforce at **service level** (pre-check) and **database level** (uniqueness for active statuses).
- Active statuses considered: `INVITED`, `ROUND1`, `ROUND2`.
- Behavior on new invite while active session exists:
  - return existing active session summary (not create a second active one),
  - frontend should route user to Continue Game path.

### D2) Expiry policy

- Session expires automatically after 7 days.
- Proposed anchor: `created_at + 7 days` (`expires_at` persisted).
- Expiry checked:
  1. before state-changing actions,
  2. while fetching active/resumable session,
  3. by scheduled sweep for stale active sessions.

### D3) Gameplay progression contract

- Keep existing one-question-at-a-time flow.
- Never return full question list to client.
- Resume endpoint provides current progression metadata + current question context only.

### D4) Event contract strategy

- Add explicit status/event payloads for:
  - active session already exists,
  - session available to continue,
  - session expired,
  - partner left / partner returned (best-effort realtime signal).

---

## 5) Detailed Implementation Backlog

Task IDs use `PA-*` format for precise tracking.

### Track A - Data Model and Migration (`A1`)

#### PA-A1.1 Game session schema extension

- [x] Add `expires_at` column to `game_sessions`
- [x] Add `last_activity_at` column to `game_sessions` (for audit + debugging)
- [x] Add DB comments for newly added columns

**Files:**
- `backend/src/main/resources/db/migration/V7__PhaseA_Game_Session_Continuation.sql` (new)
- `backend/src/main/java/com/onlyyours/model/GameSession.java` (update)

#### PA-A1.2 Status model extension

- [x] Add `EXPIRED` status to `GameSession.GameStatus`
- [x] Ensure serialization/parsing compatibility for new enum value

**Files:**
- `backend/src/main/java/com/onlyyours/model/GameSession.java`

#### PA-A1.3 Repository support for continuation queries

- [x] Add query method for active sessions by couple
- [x] Add query method for active sessions by user (via couple join)
- [x] Add query method for sessions expiring before timestamp (scheduler use)

**Files:**
- `backend/src/main/java/com/onlyyours/repository/GameSessionRepository.java`

#### PA-A1.4 Database-level single-active constraint

- [x] Add partial unique index for one active session per couple
- [x] Validate index does not block historical completed/declined/expired records

**Files:**
- `backend/src/main/resources/db/migration/V7__PhaseA_Game_Session_Continuation.sql`

---

### Track B - Service State Machine Hardening (`A2`)

#### PA-A2.1 Single active session guard on invite

- [x] In `createInvitation`, detect existing active session and short-circuit creation
- [x] Return deterministic response for "active session exists" scenario
- [x] Add structured log line for blocked duplicate session creation

**Files:**
- `backend/src/main/java/com/onlyyours/service/GameService.java`
- DTO file(s) for active-session response contract (new/updated)

#### PA-A2.2 Expiry checks on all transition paths

- [x] Add helper: `expireIfNeeded(session)`
- [x] Apply to invite accept/decline/answer/guess/next question/result paths
- [x] Ensure expired session returns clear domain error

**Files:**
- `backend/src/main/java/com/onlyyours/service/GameService.java`

#### PA-A2.3 Round and result unlock invariants

- [x] Re-validate existing unlock guards against async resume scenarios
- [x] Ensure no path can enter `ROUND2` early
- [x] Ensure results cannot be emitted until both players complete round 2

**Files:**
- `backend/src/main/java/com/onlyyours/service/GameService.java`
- `backend/src/main/java/com/onlyyours/controller/GameController.java` (if message flow updates needed)

#### PA-A2.4 Idempotency hardening

- [x] Keep duplicate accept/answer/guess safe and deterministic
- [x] Return non-breaking responses on duplicate submissions
- [x] Ensure retries do not advance index unexpectedly

**Files:**
- `backend/src/main/java/com/onlyyours/service/GameService.java`

---

### Track C - Resume Contract and Realtime Statuses (`A3`)

#### PA-A3.1 Active session summary DTO + endpoint

- [x] Add DTO for resumable session summary
- [x] Add secured endpoint (for current user) to fetch active/resumable session
- [x] Include minimal fields for CTA rendering and routing (`sessionId`, status, round, progress, expiresAt)

**Files:**
- `backend/src/main/java/com/onlyyours/dto/...` (new DTO)
- `backend/src/main/java/com/onlyyours/controller/GameQueryController.java` (new)
- `backend/src/main/java/com/onlyyours/service/GameService.java`

#### PA-A3.2 Current-question resume contract

- [x] Add service method to return current question payload for resumable session
- [x] Ensure response is compatible with existing `GameContext` sequential rendering
- [x] Ensure no full question list exposure

**Files:**
- `backend/src/main/java/com/onlyyours/service/GameService.java`
- DTO updates if needed

#### PA-A3.3 Realtime status normalization

- [x] Define status codes for:
  - active-session-exists
  - continue-game-available
  - session-expired
  - partner-left / partner-returned
- [x] Emit normalized status payloads to `/user/queue/game-events`
- [x] Preserve compatibility with existing invitation/game events

**Files:**
- `backend/src/main/java/com/onlyyours/controller/GameController.java`
- `backend/src/main/java/com/onlyyours/dto/GameStatusDto.java` (if enum/value docs updated)

---

### Track D - Frontend Continue/Resume UX (`A4`)

#### PA-A4.1 Dashboard continue-game CTA

- [x] Fetch active session summary on dashboard focus
- [x] Render Continue Game card when resumable session exists
- [x] Route CTA to game resume path

**Files:**
- `OnlyYoursExpo/src/screens/DashboardScreen.js`
- `OnlyYoursExpo/src/services/api.js` (endpoint client if needed)

#### PA-A4.2 Game resume bootstrap

- [x] Add resume bootstrap logic in `GameContext` or dedicated helper
- [x] Load current question/progress on re-entry
- [x] Keep single-question sequential UI unchanged

**Files:**
- `OnlyYoursExpo/src/state/GameContext.js`
- `OnlyYoursExpo/src/screens/GameScreen.js` (only if minimal wiring required)

#### PA-A4.3 Reconnect/expired/partner-status UX

- [x] Surface partner-left/returned status to user
- [x] Surface session-expired terminal state and recovery guidance
- [x] Keep behavior non-blocking and deterministic

**Files:**
- `OnlyYoursExpo/src/state/AuthContext.js`
- `OnlyYoursExpo/src/state/GameContext.js`
- `OnlyYoursExpo/src/components/...` (new status banner/card if needed)

---

### Track E - Automated Testing (`A5`)

#### PA-A5.1 Backend unit/integration expansion

- [x] Add tests for single-active-session enforcement
- [x] Add tests for expiry transitions and blocked state changes after expiry
- [x] Add tests for round/result gating invariants under resume/retry scenarios
- [x] Add tests for idempotent duplicate transition events

**Target files:**
- `backend/src/test/java/com/onlyyours/service/GameServiceTest.java` (extend)
- `backend/src/test/java/com/onlyyours/controller/GameControllerWebSocketTest.java` (extend)
- `backend/src/test/java/com/onlyyours/integration/...` (new integration tests if required)

#### PA-A5.2 Frontend unit/regression expansion

- [x] Add tests for dashboard continue CTA visibility and action
- [x] Add tests for resume bootstrap and current-question rendering
- [x] Add tests for expired-session handling path
- [x] Re-run existing auth/game context suites for regression confidence

**Target files:**
- `OnlyYoursExpo/src/state/__tests__/GameContext.test.js` (extend)
- `OnlyYoursExpo/src/state/__tests__/AuthContext.test.js` (extend)
- New dashboard-related tests (if test infra exists for screen tests)

#### PA-A5.3 Full automation execution checklist (post-implementation)

- [x] Backend focused tests (GameService + GameController)
- [x] Backend full suite
- [x] Frontend focused tests (AuthContext + GameContext + new tests)
- [x] Frontend full suite
- [x] Verify no new lints in modified files

---

### Track F - Documentation and QA Runbook (`A6`)

#### PA-A6.1 Plan/docs synchronization

- [x] Update `P2_IMPLEMENTATION_PLAN.md` Phase A checkboxes after verified completion
- [x] Update `DEVELOPMENT_PLAN.md` with implemented changes and rationale
- [x] Add detailed Phase A implementation summary section to this sprint file

#### PA-A6.2 Manual test runbook updates

- [x] Update `MANUAL_TESTING_GUIDE_SPRINT6.md` continuation scenarios:
  - leave and resume flow
  - expiry flow
  - one-active-session enforcement UX
  - round gating checks

---

## 6) Test Strategy and Exact Command Matrix (To Run After Implementation)

### Backend

Focused:

```bash
cd "/Users/ayushjaipuriar/Documents/GitHub/only-yours/backend" && ./gradlew test --tests "*GameServiceTest" --tests "*GameControllerWebSocketTest"
```

Full backend regression:

```bash
cd "/Users/ayushjaipuriar/Documents/GitHub/only-yours/backend" && ./gradlew clean test
```

### Frontend

Focused:

```bash
cd "/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo" && npm test -- --runInBand src/state/__tests__/useDashboardGameFlow.test.js src/state/__tests__/AuthContext.test.js src/state/__tests__/GameContext.test.js
```

Full frontend regression:

```bash
cd "/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo" && npm test -- --runInBand
```

### Static diagnostics

- [x] Run IDE lint diagnostics on all modified files
- [x] Fix newly introduced lint failures that are actionable within sprint scope

---

## 7) Risk Register (Phase A Specific)

### R1: State divergence between WebSocket events and persisted session index

Mitigation:

- Single canonical transition logic in backend service
- Idempotent handling for duplicate submissions
- Resume endpoint returns persisted truth, not inferred client state

### R2: Race condition during parallel invites from both devices

Mitigation:

- DB-level active-session uniqueness + transactional service guard
- Deterministic "active session exists" response path

### R3: Expiry edge behavior confusion for users

Mitigation:

- Clear expired-session status message and CTA to start a fresh game
- Manual test cases for just-before-expiry and post-expiry transitions

---

## 8) Definition of Done (Phase A)

Phase A is done only if all are true:

- [x] One active session per couple is enforced in both service and database behavior
- [x] 7-day expiry is enforced and visible in user flow
- [x] Round 2/results unlock rules hold in all tested scenarios
- [x] Continue Game CTA works and resumes to current question safely
- [x] Sequential one-question-at-a-time gameplay remains intact
- [x] Automated tests (focused + full regression) are green
- [x] Docs are fully updated (`P2 plan`, `Development plan`, `Manual guide`, this file summary)

---

## 9) Approval Checklist (Before Implementation Starts)

- [x] Scope approved
- [x] Architecture decisions approved (`D1`-`D4`)
- [x] Task breakdown approved (`PA-A1` ... `PA-A6`)
- [x] Test command matrix approved
- [x] Permission granted to begin implementation

---

## 10) Post-Approval Execution Journal (To be filled during implementation)

### 10.1 Implementation log

- [x] `PA-A1` complete
- [x] `PA-A2` complete
- [x] `PA-A3` complete
- [x] `PA-A4` complete
- [x] `PA-A5` complete
- [x] `PA-A6` complete

### 10.2 Automated test report

- [x] Backend focused tests: pass
- [x] Backend full suite: pass
- [x] Frontend focused tests: pass
- [x] Frontend full suite: pass
- [x] Lint diagnostics clean for changed files

### 10.3 Final completion statement

- [x] Implementation complete and verified
- [x] Ready for user validation round

---

## 11) Detailed Phase A Implementation Summary (Completed)

### Backend implementation details

1. **Data model + migration (`A1`)**
   - Added `expires_at` and `last_activity_at` schema fields in:
     - `backend/src/main/resources/db/migration/V7__PhaseA_Game_Session_Continuation.sql`
   - Added `EXPIRED` state and lifecycle fields in:
     - `backend/src/main/java/com/onlyyours/model/GameSession.java`
   - Added DB-level single-active guarantee with partial unique index:
     - `uk_game_sessions_one_active_per_couple` on active statuses.

2. **State-machine hardening (`A2`)**
   - Added service guardrails in:
     - `backend/src/main/java/com/onlyyours/service/GameService.java`
   - Key mechanics:
     - block duplicate active invitations (`ActiveGameSessionExistsException`)
     - auto-expire stale active sessions (`SessionExpiredException`)
     - enforce user-in-session checks on answer/guess/decline paths
     - keep round unlock/result unlock behavior deterministic and resume-safe
     - track lifecycle activity timestamps during transitions.

3. **Resume API + realtime contract (`A3`)**
   - Added resumable session DTO:
     - `backend/src/main/java/com/onlyyours/dto/ActiveGameSessionDto.java`
   - Added REST read endpoints:
     - `GET /api/game/active`
     - `GET /api/game/{sessionId}/current-question`
     - implemented in `backend/src/main/java/com/onlyyours/controller/GameQueryController.java`
   - Normalized status payload metadata (`eventType`, `timestamp`) in:
     - `backend/src/main/java/com/onlyyours/dto/GameStatusDto.java`
     - `backend/src/main/java/com/onlyyours/controller/GameController.java`
   - Added best-effort partner presence events (`PARTNER_LEFT` / `PARTNER_RETURNED`) in:
     - `backend/src/main/java/com/onlyyours/service/GamePresenceEventListener.java`

### Frontend implementation details

1. **Continue CTA + routing (`A4.1`)**
   - Added active-session fetch and Continue Game dashboard card in:
     - `OnlyYoursExpo/src/screens/DashboardScreen.js`
   - Prevents accidental parallel game starts by redirecting to active session.

2. **Resume bootstrap (`A4.2`)**
   - Added current-question hydration on game start/resume in:
     - `OnlyYoursExpo/src/state/GameContext.js`
   - Uses REST snapshot fallback while preserving real-time topic flow.

3. **Expired + presence UX (`A4.3`)**
   - Added handling for `ACTIVE_SESSION_EXISTS`, `SESSION_EXPIRED`,
     `PARTNER_LEFT`, and `PARTNER_RETURNED` in:
     - `OnlyYoursExpo/src/state/AuthContext.js`

### Automated validation executed (`A5`)

- Backend focused:
  - `./gradlew test --tests "*GameServiceTest" --tests "*RestControllerTest" --tests "*GameControllerWebSocketTest"`
- Backend full:
  - `./gradlew clean test`
- Frontend focused:
  - `npm test -- --runInBand src/state/__tests__/useDashboardGameFlow.test.js src/state/__tests__/AuthContext.test.js src/state/__tests__/GameContext.test.js`
- Frontend full:
  - `npm test -- --runInBand`

### Notes / residual

- Added stable hook-level coverage for dashboard continuation behavior:
  `OnlyYoursExpo/src/state/__tests__/useDashboardGameFlow.test.js`
