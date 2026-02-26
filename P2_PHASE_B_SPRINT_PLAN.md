# P2 Phase B Sprint Plan - History, Metrics, and Engagement Surfaces

**Created:** Feb 23, 2026  
**Status:** Implemented (automated validation complete; ready for manual validation)  
**Source of truth:** `P2_IMPLEMENTATION_PLAN.md` -> Phase B (`B1` to `B6`)

---

## 0) Workflow Gate (Mandatory)

This phase follows your required workflow:

- [x] Step 1: In-depth phase planning in a dedicated `.md` with detailed checklists
- [x] Step 2: User approval of this plan
- [x] Step 3: Implementation (only after approval)
- [x] Step 4: In-depth automated validation (unit + integration + regression)
- [x] Step 5: Completion report after all tests pass

Implementation started only after Step 2 was explicitly approved.

---

## 1) Sprint Goal

Deliver the first retention and insight surfaces so users can:

1. Review completed game outcomes over time (history with filtering/sorting/pagination)
2. See personal/couple performance snapshot on dashboard (metrics cards)
3. Earn and view initial badges (MVP badge engine + UI)
4. Keep app responsive and deterministic under growing history volume

---

## 2) Scope and Non-Goals

### In Scope (Phase B)

- Backend history query API with pagination, sort, winner filter
- Frontend history screen and route wiring
- Backend dashboard metrics aggregation API
- Frontend dashboard metrics cards
- Badge MVP (rule engine + response contract + display surface)
- Tests + docs for all above

### Explicit Non-Goals (deferred)

- Theme/token overhaul and redesign polish (`Phase C`)
- Settings expansion and unlink reliability paths (`Phase D`)
- Secret manager, rollback drill, release hardening (`Phase E`)
- New game-round mechanics (Phase B is read/insight only)

---

## 3) Baseline and Constraints

### Current baseline

- Game completion and scoring are already persisted in `game_sessions`.
- Dashboard currently supports active-session continuation, not history/insights.
- No dedicated history/stats/badge API exists yet.

### Known constraints carried into Phase B

- Phase A manual two-device verification is intentionally deferred by user.
- Current frontend test stack is most stable for logic hooks/context tests; full screen tests are less reliable in current environment.

---

## 4) Architecture Decisions for Phase B (Proposed)

### D1) History source-of-truth and inclusion criteria

- History endpoint returns only terminal sessions by default (`COMPLETED`).
- Optional extension for `DECLINED`/`EXPIRED` remains out of MVP scope.
- Winner filter semantics:
  - `all`: all completed sessions
  - `self`: sessions where current user score > partner score
  - `partner`: sessions where partner score > current user score
  - ties are excluded from `self` and `partner`

### D2) History endpoint contract

- Endpoint: `GET /api/game/history`
- Query params:
  - `page` (default `0`)
  - `size` (default `10`, max `50`)
  - `sort` (`recent` | `oldest`, default `recent`)
  - `winner` (`all` | `self` | `partner`, default `all`)
- Response shape includes:
  - paged items
  - page metadata (`page`, `size`, `totalElements`, `totalPages`, `hasNext`)

### D3) Dashboard metrics definitions (MVP-safe)

- `gamesPlayed`: count of completed sessions for current user
- `averageScore`: average of current user score across completed sessions
- `bestScore`: max current user score
- `streakDays`: consecutive-day play streak based on completed session dates
- `invitationAcceptanceRate`: couple-level accepted ratio for invitations in sample window (MVP approximation)
- `avgInvitationResponseSeconds`: average `(startedAt - createdAt)` for accepted sessions with valid timestamps

### D4) Badge MVP strategy

- Badge computation is server-side, deterministic, and idempotent.
- Initial badge rules (implemented MVP set):
  - `FIRST_GAME`: completed >= 1 game
  - `FIVE_GAMES`: completed >= 5 games
  - `TEN_GAMES`: completed >= 10 games
  - `SHARP_GUESSER`: single-game score >= 7
  - `STREAK_3`: streak >= 3 days
  - `RESPONSIVE_COUPLE`: acceptance rate >= 70% with at least 3 completed games
- API returns earned badges only (not locked badges) for MVP.

### D5) Performance and indexing

- Add index(es) supporting frequent history scans:
  - `(couple_id, status, completed_at)`
  - optional `(status, completed_at)` for analytics windows
- Keep history queries pageable and bounded by `size` cap.

---

## 5) Detailed Implementation Backlog

Task IDs use `PB-*` format.

### Track B1 - Historical Games Backend

#### PB-B1.1 History DTO contracts

- [x] Add `GameHistoryItemDto`
- [x] Add `GameHistoryPageDto`
- [x] Include stable fields for list rendering:
  - `sessionId`
  - `completedAt`
  - `myScore`
  - `partnerScore`
  - `partnerName`
  - `categoryId`
  - `result` (`WIN` | `LOSS` | `DRAW`)

**Files (target):**

- `backend/src/main/java/com/onlyyours/dto/GameHistoryItemDto.java` (new)
- `backend/src/main/java/com/onlyyours/dto/GameHistoryPageDto.java` (new)

#### PB-B1.2 Repository query support

- [x] Add pageable repository query for user-participating completed sessions
- [x] Add sort routing for recent/oldest
- [x] Add winner filter application in service layer

**Files (target):**

- `backend/src/main/java/com/onlyyours/repository/GameSessionRepository.java`

#### PB-B1.3 History service + endpoint

- [x] Add service method `getHistoryForUser(...)`
- [x] Add secured endpoint `GET /api/game/history`
- [x] Validate query bounds and return consistent page metadata

**Files (target):**

- `backend/src/main/java/com/onlyyours/service/GameService.java` (or new analytics service split)
- `backend/src/main/java/com/onlyyours/controller/GameQueryController.java`

#### PB-B1.4 Indexing migration

- [x] Add migration for history/stats indexes
- [x] Ensure index names are stable and idempotent (`IF NOT EXISTS`)

**Files (target):**

- `backend/src/main/resources/db/migration/V8__PhaseB_History_Stats_Indexes.sql` (new)

---

### Track B2 - Historical Games Frontend

#### PB-B2.1 History screen + route

- [x] Create `GameHistoryScreen` and register navigation route
- [x] Add entry points from dashboard/profile as needed

**Files (target):**

- `OnlyYoursExpo/src/screens/GameHistoryScreen.js` (new)
- `OnlyYoursExpo/src/navigation/AppNavigator.js`

#### PB-B2.2 Query controls

- [x] Add sort selector (`Recent` / `Oldest`)
- [x] Add winner filter selector (`All` / `Mine` / `Partner`)
- [x] Wire controls to API query params

**Files (target):**

- `OnlyYoursExpo/src/screens/GameHistoryScreen.js`
- `OnlyYoursExpo/src/services/api.js` (if helper methods are added)

#### PB-B2.3 Pagination + UX states

- [x] Implement paginated load more / infinite scroll
- [x] Add loading, empty, and error states
- [x] Keep retry behavior deterministic

**Files (target):**

- `OnlyYoursExpo/src/screens/GameHistoryScreen.js`
- `OnlyYoursExpo/src/components/` (optional reusable state components)

---

### Track B3 - Dashboard Stats Backend

#### PB-B3.1 Stats DTO contract

- [x] Add `DashboardStatsDto` with safe defaults
- [x] Ensure no-history users return zeros/null-safe values

**Files (target):**

- `backend/src/main/java/com/onlyyours/dto/DashboardStatsDto.java` (new)

#### PB-B3.2 Aggregation service

- [x] Implement metrics aggregation for completed sessions
- [x] Implement streak calculation helper
- [x] Implement acceptance/response-time approximation logic for MVP

**Files (target):**

- `backend/src/main/java/com/onlyyours/service/GameService.java` (or new `GameAnalyticsService.java`)
- `backend/src/main/java/com/onlyyours/repository/GameSessionRepository.java`

#### PB-B3.3 Stats endpoint

- [x] Add secured endpoint `GET /api/game/stats`
- [x] Return deterministic schema under all conditions

**Files (target):**

- `backend/src/main/java/com/onlyyours/controller/GameQueryController.java`

---

### Track B4 - Dashboard Stats Frontend

#### PB-B4.1 Dashboard stats fetch + render

- [x] Fetch `GET /game/stats` on dashboard focus
- [x] Render metric cards under existing continuation card layout

**Files (target):**

- `OnlyYoursExpo/src/screens/useDashboardGameFlow.js`
- `OnlyYoursExpo/src/screens/DashboardScreen.js`

#### PB-B4.2 Loading and fallback behavior

- [x] Show placeholder/loading state while stats load
- [x] Show graceful fallback if stats API fails (without breaking primary dashboard actions)

**Files (target):**

- `OnlyYoursExpo/src/screens/DashboardScreen.js`

---

### Track B5 - Badge MVP

#### PB-B5.1 Badge backend contract + rules

- [x] Add `BadgeDto`
- [x] Add badge rule evaluator based on history/stats aggregates
- [x] Add endpoint `GET /api/game/badges`

**Files (target):**

- `backend/src/main/java/com/onlyyours/dto/BadgeDto.java` (new)
- `backend/src/main/java/com/onlyyours/service/GameService.java` (or `BadgeService.java`)
- `backend/src/main/java/com/onlyyours/controller/GameQueryController.java`

#### PB-B5.2 Badge frontend surface

- [x] Add badge rendering surface (dashboard and/or profile)
- [x] Add generated gradient token mapping for badge cards/chips
- [x] Keep fallback style for devices without gradient support

**Files (target):**

- `OnlyYoursExpo/src/screens/DashboardScreen.js`
- `OnlyYoursExpo/src/screens/ProfileScreen.js`
- `OnlyYoursExpo/src/components/BadgeChip.js` (new, if extracted)

---

### Track B6 - Testing and Documentation

#### PB-B6.1 Backend tests

- [x] Add tests for history pagination/sort/winner filter correctness
- [x] Add tests for stats aggregation math and no-history defaults
- [x] Add tests for badge rule thresholds and deterministic output

**Files (target):**

- `backend/src/test/java/com/onlyyours/service/GameServiceTest.java` (extend)
- `backend/src/test/java/com/onlyyours/controller/RestControllerTest.java` (extend)
- `backend/src/test/java/com/onlyyours/integration/` (add focused Phase B integration tests if needed)

#### PB-B6.2 Frontend tests

- [x] Add tests for history query-state logic and pagination wiring
- [x] Add tests for stats render fallback behavior
- [x] Add tests for badge visibility logic

**Files (target):**

- `OnlyYoursExpo/src/state/__tests__/useDashboardGameFlow.test.js` (extend)
- `OnlyYoursExpo/src/state/__tests__/useGameHistoryFlow.test.js` (new, recommended)

#### PB-B6.3 Documentation updates

- [x] Update `P2_IMPLEMENTATION_PLAN.md` Phase B checklist after completion
- [x] Update `DEVELOPMENT_PLAN.md` with implementation details and rationale
- [x] Update `MANUAL_TESTING_GUIDE_SPRINT6.md` with history/stats/badge manual matrix

---

## 6) API Contract Draft (MVP)

### `GET /api/game/history`

Query:

- `page=0`
- `size=10`
- `sort=recent`
- `winner=all`

Response (shape):

```json
{
  "items": [
    {
      "sessionId": "uuid",
      "completedAt": 1708620000000,
      "myScore": 6,
      "partnerScore": 5,
      "partnerName": "Partner",
      "categoryId": 2,
      "result": "WIN"
    }
  ],
  "page": 0,
  "size": 10,
  "totalElements": 24,
  "totalPages": 3,
  "hasNext": true
}
```

### `GET /api/game/stats`

Response (shape):

```json
{
  "gamesPlayed": 24,
  "averageScore": 5.4,
  "bestScore": 8,
  "streakDays": 3,
  "invitationAcceptanceRate": 78.0,
  "avgInvitationResponseSeconds": 142.0
}
```

### `GET /api/game/badges`

Response (shape):

```json
{
  "badges": [
    {
      "code": "FIRST_GAME",
      "title": "First Spark",
      "description": "Completed your first game together",
      "earnedAt": 1708620000000
    }
  ]
}
```

---

## 7) Test Strategy and Command Matrix

### Backend focused

```bash
cd "/Users/ayushjaipuriar/Documents/GitHub/only-yours/backend" && ./gradlew test --tests "*GameServiceTest" --tests "*RestControllerTest"
```

### Backend full regression

```bash
cd "/Users/ayushjaipuriar/Documents/GitHub/only-yours/backend" && ./gradlew clean test
```

### Frontend focused

```bash
cd "/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo" && YARN_IGNORE_ENGINES=1 yarn test --watchAll=false src/state/__tests__/useDashboardGameFlow.test.js src/state/__tests__/useGameHistoryFlow.test.js
```

### Frontend full regression

```bash
cd "/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo" && YARN_IGNORE_ENGINES=1 yarn test --watchAll=false
```

### Static diagnostics

- [x] Run IDE lint diagnostics on all modified files
- [ ] Fix newly introduced lint failures in sprint scope

---

## 8) Risk Register (Phase B)

### R1: History query performance degradation at scale

Mitigation:

- Add proper indexes in migration
- Enforce strict pagination and query-size bounds

### R2: Ambiguous metric definitions reduce trust

Mitigation:

- Lock explicit metric formulas in this plan before implementation
- Return stable units and defaults

### R3: Badge logic drift between backend and frontend interpretation

Mitigation:

- Keep badge derivation server-side only
- Frontend treats badge payload as display-only contract

### R4: Dashboard overloading reduces primary action clarity

Mitigation:

- Keep continuation CTA and start-game actions highest visual priority
- Render stats below primary game actions

---

## 9) Definition of Done (Phase B)

Phase B is done only if all are true:

- [x] Users can browse history with pagination, sorting, and winner filtering
- [x] Dashboard stats cards render deterministic values and safe defaults
- [x] Badge MVP is visible and computed correctly
- [x] Focused and full backend/frontend tests are green
- [x] Docs are updated (`P2 plan`, `Development plan`, `Manual guide`, this sprint file)

---

## 10) Approval Checklist (Before Implementation Starts)

- [x] Scope approved
- [x] Architecture decisions approved (`D1`-`D5`)
- [x] Task breakdown approved (`PB-B1` ... `PB-B6`)
- [x] API contract drafts approved
- [x] Test matrix approved
- [x] Permission granted to begin implementation

---

## 11) Post-Approval Execution Journal (To fill during implementation)

### 11.1 Implementation log

- [x] `PB-B1` complete
- [x] `PB-B2` complete
- [x] `PB-B3` complete
- [x] `PB-B4` complete
- [x] `PB-B5` complete
- [x] `PB-B6` complete

### 11.2 Automated test report

- [x] Backend focused tests: pass
- [x] Backend full suite: pass
- [x] Frontend focused tests: pass
- [x] Frontend full suite: pass
- [ ] Lint diagnostics clean for changed files

### 11.3 Final completion statement

- [x] Implementation complete and verified
- [x] Ready for user validation round

---

## 12) Detailed Phase B Implementation Summary

### PB-B1 Historical backend completion details

- Added DTO contracts:
  - `backend/src/main/java/com/onlyyours/dto/GameHistoryItemDto.java`
  - `backend/src/main/java/com/onlyyours/dto/GameHistoryPageDto.java`
- Extended repository query support in `GameSessionRepository` for:
  - user-scoped completed-session reads,
  - user-scoped all-status reads (for acceptance/response metrics),
  - couple timeline reads used by metrics logic.
- Implemented history service path in `GameService`:
  - bounded pagination (`size` clamped to `1..50`),
  - deterministic sort (`recent` / `oldest`),
  - winner filter projection (`all` / `self` / `partner`) with ties excluded from self/partner.
- Exposed secured endpoint in `GameQueryController`:
  - `GET /api/game/history`
- Added migration:
  - `backend/src/main/resources/db/migration/V8__PhaseB_History_Stats_Indexes.sql`
  - includes idempotent indexes for completed-history and aggregate query paths.

### PB-B2 Historical frontend completion details

- Added `OnlyYoursExpo/src/screens/GameHistoryScreen.js` with:
  - query controls (`Recent/Oldest`, `All/I Won/Partner Won`),
  - deterministic empty/error states,
  - paginated list rendering and score/result cards.
- Added `OnlyYoursExpo/src/screens/useGameHistoryFlow.js` hook:
  - manages query-state, pagination state, retries, and focus-triggered reload.
- Registered route in `OnlyYoursExpo/src/navigation/AppNavigator.js` (`GameHistory`).
- Added dashboard entry-point navigation to `GameHistory`.

### PB-B3 + PB-B4 Stats backend/frontend completion details

- Added backend DTO:
  - `backend/src/main/java/com/onlyyours/dto/DashboardStatsDto.java`
- Implemented metrics in `GameService`:
  - `gamesPlayed`, `averageScore`, `bestScore`, `streakDays`,
  - `invitationAcceptanceRate` (responded invitation denominator),
  - `avgInvitationResponseSeconds` (valid `startedAt-createdAt` sample).
- Added secured endpoint:
  - `GET /api/game/stats`
- Updated dashboard flow:
  - `OnlyYoursExpo/src/screens/useDashboardGameFlow.js` now fetches stats + badges on focus/load.
- Updated dashboard UI:
  - `OnlyYoursExpo/src/screens/DashboardScreen.js` now renders metric cards with fallback-safe values.

### PB-B5 Badge MVP completion details

- Added backend badge contract:
  - `backend/src/main/java/com/onlyyours/dto/BadgeDto.java`
- Implemented deterministic badge evaluator in `GameService` for:
  - `FIRST_GAME`, `FIVE_GAMES`, `TEN_GAMES`,
  - `SHARP_GUESSER`, `STREAK_3`, `RESPONSIVE_COUPLE`.
- Added secured endpoint:
  - `GET /api/game/badges`
- Added reusable frontend chip:
  - `OnlyYoursExpo/src/components/BadgeChip.js`
  - token-based color mapping + safe fallback style.
- Surfaced badges in:
  - `OnlyYoursExpo/src/screens/DashboardScreen.js`
  - `OnlyYoursExpo/src/screens/ProfileScreen.js`

### PB-B6 Validation and documentation completion details

- Backend tests extended:
  - `backend/src/test/java/com/onlyyours/service/GameServiceTest.java`
  - `backend/src/test/java/com/onlyyours/controller/RestControllerTest.java`
- Frontend tests extended:
  - `OnlyYoursExpo/src/state/__tests__/useDashboardGameFlow.test.js`
  - `OnlyYoursExpo/src/state/__tests__/useGameHistoryFlow.test.js` (new)
- Automated runs completed:
  - backend focused: pass
  - backend full: pass
  - frontend focused: pass
  - frontend full: pass
- Lint diagnostics were executed on modified frontend files; residual Sonar warnings remain around prop-validation style in non-TypeScript React files (non-blocking for runtime/test correctness).
