# Gameplay Realtime Stabilization Plan

**Created:** Mar 15, 2026  
**Status:** Implemented in code; automated validation passed; manual two-device validation pending  
**Scope type:** Cross-cutting stabilization and race-condition hardening  
**Primary systems affected:** Expo realtime client, gameplay state machine, backend game flow, presence signaling

---

## 0) Workflow Gate

This document follows your required workflow:

- [x] Clarification gate completed before plan writing
- [x] Dedicated detailed `.md` plan created
- [x] User approval
- [x] Implementation
- [x] Full automated validation
- [x] Completion report after tests pass

This plan was approved and executed. The remaining open item is the manual two-device regression pass.

### Implementation Summary - Mar 15, 2026

#### Files and systems updated

- Frontend reconnect and shared queue ownership:
  - `OnlyYoursExpo/src/services/WebSocketService.js`
  - `OnlyYoursExpo/src/state/AuthContext.js`
  - `OnlyYoursExpo/src/state/GameContext.js`
- Frontend regression and compatibility tests:
  - `OnlyYoursExpo/src/services/__tests__/WebSocketService.test.js`
  - `OnlyYoursExpo/src/state/__tests__/AuthContext.test.js`
  - `OnlyYoursExpo/src/state/__tests__/GameContext.test.js`
  - `OnlyYoursExpo/src/screens/__tests__/GameScreen.test.js`
  - `OnlyYoursExpo/src/accessibility/__tests__/index.test.js`
- Android/Fabric-safe accessibility hardening that surfaced during this stabilization cycle:
  - `OnlyYoursExpo/src/accessibility/index.js`
  - `OnlyYoursExpo/src/screens/GameScreen.js`
- Backend invitation locking, presence, controller routing, and answer uniqueness:
  - `backend/src/main/java/com/onlyyours/service/GameService.java`
  - `backend/src/main/java/com/onlyyours/controller/GameController.java`
  - `backend/src/main/java/com/onlyyours/service/GamePresenceEventListener.java`
  - `backend/src/main/java/com/onlyyours/model/GameAnswer.java`
  - `backend/src/main/java/com/onlyyours/repository/GameAnswerRepository.java`
  - `backend/src/main/java/com/onlyyours/dto/GameRoundStateDto.java`
  - `backend/src/main/java/com/onlyyours/dto/GameReviewItemDto.java`
  - `backend/src/main/java/com/onlyyours/dto/QuestionPayloadDto.java`
  - `backend/src/main/resources/db/migration/V14__Gameplay_Stabilization.sql`
- Backend regression coverage:
  - `backend/src/test/java/com/onlyyours/service/GameServiceTest.java`
  - `backend/src/test/java/com/onlyyours/service/GamePresenceEventListenerTest.java`
  - `backend/src/test/java/com/onlyyours/controller/GameControllerWebSocketTest.java`
  - `backend/src/test/java/com/onlyyours/controller/WebSocketPerformanceTest.java`

#### What was implemented

- Added active-client guarding and pending reconnect waiters so transport recovery no longer spawns overlapping STOMP clients.
- Moved shared `/user/queue/game-events` ownership to `AuthContext`, with explicit routing of gameplay-relevant payloads into `GameContext`.
- Narrowed `GameContext` payload handling to authoritative gameplay events, added active-session filtering, and protected hydration with request-generation guards so stale snapshot responses cannot overwrite newer state.
- Kept submit recovery resilient by only clearing fallback on valid gameplay follow-up payloads.
- Added DB-backed uniqueness for `game_answers` on `(game_session_id, question_id, user_id)` with cleanup migration for older duplicates.
- Hardened invitation accept/decline with pessimistic locking and deterministic idempotent outcomes.
- Reworked presence handling to track effective user presence instead of emitting left/returned on every raw socket connect/disconnect.
- Reduced `getCurrentQuestionForUser(...)` to a snapshot-oriented read and moved phase/result transitions into submit-owned paths.
- Corrected controller follow-up routing so:
  - Round 1 answers resolve through the Round 1 follow-up path instead of the Round 2 guess path
  - Round 2 guesses resolve through the explicit post-guess transition path so final results are emitted reliably

---

## 1) Why This Plan Exists

Recent manual two-device testing and the deeper code review showed that the current gameplay system is much more stable than before, but it is still exposed to several classes of race conditions and event-order bugs:

1. websocket reconnect overlap,
2. duplicate or stale event consumption,
3. missed follow-up payloads after submits,
4. backend idempotency gaps,
5. invitation accept/decline races,
6. presence flapping on reconnect,
7. read paths that still mutate gameplay state.

These issues are related enough that fixing them piecemeal would likely create regressions or leave hidden sequencing bugs behind.

So this plan treats them as one coordinated stabilization effort with logical phases inside one document.

---

## 2) Stabilization Goal

Deliver a gameplay and realtime stack that is:

1. reconnect-safe,
2. idempotent under retries and duplicate taps,
3. deterministic under two-device resume/rejoin behavior,
4. resistant to stale or duplicated event delivery,
5. safe against backend duplicate-row races,
6. correct about partner presence,
7. fully covered by targeted automated tests plus a final two-device manual run.

This plan is successful when:

1. a submit can no longer remain stuck because one specific websocket payload was missed,
2. reconnect never creates overlapping websocket clients or duplicate subscriptions,
3. gameplay state only responds to relevant session-scoped events,
4. each `(session, question, user)` answer row is unique at the database level,
5. invitation accept/decline is race-safe,
6. partner left/returned signals reflect effective presence rather than raw socket churn,
7. the full test suite passes after implementation,
8. the manual two-device run passes the resume/reconnect paths.

---

## 3) Scope

### In scope

- Expo websocket lifecycle and reconnect behavior
- Expo `AuthContext` and `GameContext` event ownership
- gameplay submit recovery and snapshot fallback behavior
- stale payload protection and session scoping
- backend invitation locking and idempotency
- backend `game_answers` uniqueness and duplicate prevention
- backend read-path side effects in gameplay snapshot APIs
- partner presence correctness
- automated and manual validation updates

### Nearby hardening items allowed in scope

These should be included if needed to make the primary fixes safe:

- better logging around reconnect/rehydrate/transition events,
- explicit event filtering utilities,
- small DTO or repository changes needed for correctness,
- additional integration or controller tests,
- manual guide updates for troubleshooting and validation.

### Out of scope

- push notification Firebase setup itself
- visual redesign of gameplay screens
- unrelated deployment/CI work
- new gameplay features beyond stabilization

---

## 4) Problem Register

This section is the source-of-truth issue list that the implementation phases below will address.

### R1) Dual reconnect strategy can create overlapping websocket clients

**Severity:** High  
**Current symptom:** repeated reconnect noise, duplicate presence churn, duplicate start/resume logs, unstable subscription ownership  
**Primary code:** `OnlyYoursExpo/src/services/WebSocketService.js`, `OnlyYoursExpo/src/state/AuthContext.js`

#### Problem definition

The STOMP client already has built-in reconnect behavior, but `AuthContext` also schedules its own reconnect attempts. That means the app currently has two independent mechanisms trying to recover the same connection.

If the original STOMP client is already active and auto-reconnecting, `AuthContext` can still call `WebSocketService.connect(...)` again because the current guard only checks:

- `isConnected()`
- `connectPromise`

It does **not** guard against:

- an already-active client that is reconnecting,
- a client that still owns subscriptions but is temporarily disconnected,
- reconnect overlap between automatic STOMP reconnect and app-level retry.

#### Why this is risky

- multiple websocket clients can exist for one logged-in app instance,
- subscriptions can duplicate,
- the app can receive the same event more than once,
- presence `PARTNER_LEFT` / `PARTNER_RETURNED` noise gets amplified,
- gameplay timing bugs become intermittent and hard to reproduce.

#### Current touchpoints

- `OnlyYoursExpo/src/services/WebSocketService.js`
  - `connect`
  - `disconnect`
  - `subscribe`
  - internal reconnect configuration
- `OnlyYoursExpo/src/state/AuthContext.js`
  - `connectRealtime`
  - background reconnect `useEffect`

#### Proposed fix direction

Choose one reconnect authority and make it explicit.

Recommended approach:

1. Keep STOMP reconnect as the transport-level recovery mechanism.
2. Make `AuthContext` responsible for:
   - connection state display,
   - post-reconnect re-subscription orchestration,
   - bounded recovery fallback if the client fully dies.
3. Add a stronger guard in `WebSocketService.connect(...)` such as:
   - do not create a new client if `client?.active === true`,
   - expose a method that reports whether a reconnecting client already exists.
4. Ensure reconnecting does not instantiate a second `Client`.

#### Acceptance criteria

- only one websocket client instance exists per logged-in app runtime,
- reconnect does not duplicate subscriptions,
- reconnect logs show one reconnect path, not overlapping loops.

---

### R2) Game subscriptions are not robustly re-established after reconnect

**Severity:** High  
**Current symptom:** app may reconnect transport successfully but still miss gameplay events for the active session  
**Primary code:** `OnlyYoursExpo/src/state/GameContext.js`, `OnlyYoursExpo/src/services/WebSocketService.js`

#### Problem definition

`GameContext` subscribes to:

- `/topic/game/{sessionId}`
- `/user/queue/game-events`

when `startGame(sessionId)` runs.

On reconnect, the current code refreshes the gameplay snapshot, which is helpful, but it does **not** reliably rebuild the session-specific subscriptions if the original websocket session was dropped.

Refreshing the snapshot covers some missed-state problems, but it does not restore true live event delivery by itself.

#### Why this is risky

- the app can look recovered but still not receive subsequent gameplay messages,
- resumed sessions may depend on manual refresh or submit fallback,
- results or round-state events can be missed after reconnect.

#### Current touchpoints

- `OnlyYoursExpo/src/state/GameContext.js`
  - `startGame`
  - reconnect `useEffect`
  - subscription refs
- `OnlyYoursExpo/src/services/WebSocketService.js`
  - subscription lifecycle behavior after reconnect

#### Proposed fix direction

1. Add an explicit “active-session resubscribe” path when websocket state returns to `connected`.
2. Separate:
   - snapshot rehydration,
   - topic/private queue re-subscription.
3. Ensure resubscription is idempotent:
   - unsubscribe old refs if present,
   - re-subscribe exactly once for the current active session.
4. Keep snapshot refresh after resubscribe as the authoritative correction step.

#### Acceptance criteria

- reconnect restores both transport and active gameplay subscriptions,
- gameplay remains live after app/background/reconnect churn,
- resubscribe can run multiple times safely without duplicate listeners.

---

### R3) `/user/queue/game-events` currently has overlapping consumers and mixed event ownership

**Severity:** High  
**Current symptom:** duplicate handling, cross-talk between auth/game concerns, stale event interference  
**Primary code:** `OnlyYoursExpo/src/state/AuthContext.js`, `OnlyYoursExpo/src/state/GameContext.js`

#### Problem definition

Both `AuthContext` and `GameContext` subscribe to the same private queue:

- `AuthContext` consumes invitations and status events
- `GameContext` consumes gameplay payloads from the same queue

That split is not isolated strongly enough today. `GameContext.applyGamePayload(...)` is called for every message arriving on its private queue subscription, even before payload type relevance is fully validated.

This creates two related problems:

1. unclear ownership of queue messages,
2. unrelated private events can still affect gameplay recovery behavior.

One concrete example already identified:

- `GameContext` clears the submit recovery timeout at the top of `applyGamePayload(...)`,
- even if the payload is only `PARTNER_LEFT` / `PARTNER_RETURNED`,
- which means reconnect chatter can cancel the submit fallback that was supposed to recover a missed follow-up state.

#### Why this is risky

- unrelated status events can interfere with gameplay recovery,
- duplicate listeners increase event ordering complexity,
- stale or non-session-specific queue events can affect active gameplay state.

#### Current touchpoints

- `OnlyYoursExpo/src/state/AuthContext.js`
  - `subscribeToGameEvents`
  - `handleGameStatus`
- `OnlyYoursExpo/src/state/GameContext.js`
  - private queue subscription inside `startGame`
  - `applyGamePayload`

#### Proposed fix direction

Recommended ownership model:

1. `AuthContext` remains the owner of non-gameplay private events:
   - invitation
   - invitation declined
   - active session exists
   - session expired
   - partner presence
2. `GameContext` should only receive gameplay-private events that are:
   - session-scoped,
   - gameplay-relevant,
   - explicitly filtered before state mutation.
3. Either:
   - centralize `/user/queue/game-events` in one owner and dispatch internally,
   - or split queue handling by a typed event router utility.
4. Move timeout clearing to happen only for authoritative gameplay payloads such as:
   - `QUESTION`
   - `ROUND_STATE`
   - `GAME_RESULTS`
   - explicitly approved round-transition status if retained
5. Ignore stale or mismatched session events before mutating game state.

#### Acceptance criteria

- unrelated queue events cannot cancel gameplay recovery,
- gameplay state only mutates from session-relevant payloads,
- private queue ownership becomes explicit and testable.

---

### R4) Submit recovery is still vulnerable to stale payloads and old-session responses

**Severity:** High  
**Current symptom:** missed follow-up events can still cause sticky or incorrect state under certain timing combinations  
**Primary code:** `OnlyYoursExpo/src/state/GameContext.js`

#### Problem definition

The new submit snapshot fallback is a good step, but it still needs stronger guards:

1. stale private events can cancel fallback if timeout clearing is too broad,
2. delayed `/current-question` responses are not yet clearly guarded against applying to the wrong active session,
3. delayed events from a prior subscription can still race with current state if they arrive just after a session switch or unsubscribe boundary.

#### Why this is risky

- stale responses can overwrite current gameplay state,
- one session’s delayed payload could mutate another session view,
- sticky loader bugs can still survive if the wrong event clears fallback.

#### Current touchpoints

- `OnlyYoursExpo/src/state/GameContext.js`
  - `hydrateCurrentQuestion`
  - `scheduleSubmitRecovery`
  - `applyGamePayload`
  - `startGame`
  - `endGame`

#### Proposed fix direction

1. Add a session guard before applying any hydrated payload:
   - only apply if `activeSessionRef.current === sessionId` for the snapshot request that produced it.
2. Add session filtering for inbound websocket gameplay payloads:
   - ignore gameplay payloads for non-active sessions.
3. Narrow recovery timeout clearing to authoritative state payloads only.
4. Consider using a monotonic request token or request generation counter for snapshot hydrations to ignore stale HTTP responses.
5. Keep fallback-driven recovery for submit paths, but make it impossible for unrelated messages to defeat it.

#### Acceptance criteria

- snapshot responses cannot overwrite a newer session state,
- stale gameplay events are ignored safely,
- submit recovery only clears on valid follow-up state.

---

### R5) Backend still allows duplicate `game_answers` rows under concurrent submits

**Severity:** High  
**Current symptom:** currently latent; can surface under retries, lag, double taps, reconnect repeats  
**Primary code:** `backend/src/main/java/com/onlyyours/service/GameService.java`, `backend/src/main/resources/db/migration/V1__Initial_Schema.sql`

#### Problem definition

The service checks for an existing answer before inserting, but the database does not enforce uniqueness for:

- `game_session_id`
- `question_id`
- `user_id`

That means two near-simultaneous submits can still create duplicate rows.

Once duplicates exist, several later operations become fragile:

- repository `findBy...` methods can break assumptions,
- progression maps built with `Collectors.toMap(...)` can throw duplicate-key exceptions,
- question resolution can become nondeterministic.

#### Why this is risky

- data corruption at the source of truth,
- hidden until network jitter or retry storms happen,
- can create hard-to-debug production-only failures.

#### Current touchpoints

- `backend/src/main/resources/db/migration/V1__Initial_Schema.sql`
- `backend/src/main/java/com/onlyyours/model/GameAnswer.java`
- `backend/src/main/java/com/onlyyours/service/GameService.java`
  - `submitAnswer`
  - `submitGuess`
  - `findAnswersByQuestionId`

#### Proposed fix direction

1. Add a unique DB constraint or unique index on:
   - `(game_session_id, question_id, user_id)`
2. Make submit handlers truly idempotent:
   - catch duplicate-key violation and re-read existing row,
   - return the same effective next state instead of failing.
3. Audit repository methods and service logic so duplicates are not silently assumed impossible.
4. If existing data might already contain duplicates in local/dev DBs, add migration cleanup or detection guidance.

#### Acceptance criteria

- duplicate submits cannot create duplicate answer rows,
- repeated submit of the same answer/guess is safe and deterministic,
- `findAnswersByQuestionId(...)` cannot explode from duplicate-key rows created after the fix.

---

### R6) Invitation accept/decline is still race-prone

**Severity:** Medium-High  
**Current symptom:** concurrent accept/decline or duplicate accept taps can race on an invited session  
**Primary code:** `backend/src/main/java/com/onlyyours/service/GameService.java`

#### Problem definition

`acceptInvitation(...)` and `declineInvitation(...)` still load sessions with plain `findById()` rather than `findByIdForUpdate()`.

That allows two requests to observe `INVITED` concurrently before one of them writes:

- accept + accept,
- accept + decline,
- repeated accept from retry/double tap.

#### Why this is risky

- duplicate start work,
- conflicting terminal state writes,
- harder-to-reason websocket/controller behavior.

#### Current touchpoints

- `backend/src/main/java/com/onlyyours/service/GameService.java`
  - `acceptInvitation`
  - `declineInvitation`
- `backend/src/main/java/com/onlyyours/repository/GameSessionRepository.java`
  - `findByIdForUpdate`

#### Proposed fix direction

1. Switch invitation transition methods to use `findByIdForUpdate()`.
2. Define explicit idempotent behavior:
   - already accepted -> return current state or specific idempotent response,
   - already declined -> deterministic no-op/error,
   - conflicting terminal state -> safe explicit error contract.
3. Update controller handling to map these outcomes predictably for websocket clients.

#### Acceptance criteria

- duplicate accept/decline requests do not corrupt session state,
- invitation transitions become deterministic under concurrent requests.

---

### R7) Partner presence signaling flaps under reconnect or multiple sockets

**Severity:** Medium  
**Current symptom:** false `PARTNER_LEFT` / `PARTNER_RETURNED` events during reconnect churn  
**Primary code:** `backend/src/main/java/com/onlyyours/service/GamePresenceEventListener.java`

#### Problem definition

Presence is currently inferred from raw websocket connect/disconnect events:

- one connect => partner returned
- one disconnect => partner left

This is not equivalent to actual user presence when:

- reconnect overlap happens,
- the same user has more than one socket,
- the socket briefly drops and reconnects quickly,
- auto-reconnect creates connect/disconnect bursts.

#### Why this is risky

- false UI alerts,
- false submit-recovery interference if private queue chatter is not filtered,
- poor user trust in “partner left/returned” messaging.

#### Current touchpoints

- `backend/src/main/java/com/onlyyours/service/GamePresenceEventListener.java`
- frontend consumers in `AuthContext`

#### Proposed fix direction

1. Introduce effective presence tracking per user:
   - count active websocket sessions per authenticated user,
   - emit `PARTNER_RETURNED` only on transition `0 -> 1`,
   - emit `PARTNER_LEFT` only on transition `1 -> 0`.
2. If full presence registry is too heavy for first pass, implement a minimal in-memory active-session counter with clear lifecycle rules for local/dev.
3. Later, if needed, promote to distributed/shared presence store for multi-instance deployment.

#### Acceptance criteria

- reconnect of an already-present user does not falsely emit left/returned,
- multiple concurrent sockets do not create false offline events.

---

### R8) `getCurrentQuestionForUser()` still mutates gameplay state

**Severity:** Medium  
**Current symptom:** gameplay transitions can still be driven by a read endpoint rather than only by submit handlers  
**Primary code:** `backend/src/main/java/com/onlyyours/service/GameService.java`

#### Problem definition

The snapshot-style read API currently does more than read:

- it can transition Round 1 -> Round 2,
- it can complete the game,
- it updates `lastActivityAt`.

Because the frontend now uses this endpoint more often for recovery, the system increasingly depends on GET-like reads to drive state transitions.

#### Why this is risky

- hard-to-reason transition ownership,
- subtle double-transition behavior under reconnect,
- read traffic can change state timing.

#### Current touchpoints

- `backend/src/main/java/com/onlyyours/service/GameService.java`
  - `getCurrentQuestionForUser`
  - `resolveCurrentStateForUser`
  - `transitionToRound2`
  - `completeGameIfReady`

#### Proposed fix direction

Preferred direction:

1. Move state transitions to submit handlers wherever possible.
2. Make `getCurrentQuestionForUser(...)` resolve and return current state without changing phase except where absolutely unavoidable.
3. If a read-path transition must remain, make it:
   - explicitly documented,
   - fully idempotent,
   - covered by concurrency tests.

#### Acceptance criteria

- gameplay phase transitions have one clear authoritative path,
- snapshot reads primarily observe state instead of creating it.

---

### R9) Current client state logic does not fully defend against stale session payloads

**Severity:** Medium  
**Current symptom:** low-frequency but dangerous stale-state overwrite potential  
**Primary code:** `OnlyYoursExpo/src/state/GameContext.js`

#### Problem definition

Even with active-session refs and unsubscribe cleanup, there is still a narrow but real race where:

- an old subscription delivers a late payload,
- a delayed snapshot response returns after session context has shifted,
- the payload is still applied because it is structurally valid.

#### Why this is risky

- stale state overwrite,
- wrong question rendered,
- wrong round/waiting/results screen shown after rapid transitions.

#### Proposed fix direction

1. Validate payload `sessionId` against `activeSessionRef.current` before applying.
2. Add request-generation guards for snapshot hydration.
3. Ensure `endGame()` invalidates pending recoveries and stale applies.

#### Acceptance criteria

- old-session payloads are harmlessly ignored,
- session switches remain deterministic.

---

## 5) Phased Implementation Plan

All phases belong to the same stabilization effort and should stay in this document, but they should be implemented in order because later phases depend on earlier cleanup.

### Phase 1 - Frontend Realtime Ownership and Reconnect Safety

**Status:** Complete

**Goal:** ensure one websocket client, one clear reconnect path, and safe session re-subscription behavior

#### Tasks

- [x] Choose and implement a single reconnect authority model
- [x] Guard `WebSocketService.connect(...)` against creating a second active client
- [x] Make reconnect/resubscribe idempotent
- [x] Re-subscribe active gameplay listeners after reconnect
- [x] Keep `AuthContext` general queue subscription stable across reconnect
- [x] Add logging around:
  - connect start
  - connect success
  - reconnecting
  - resubscribe start/success
  - active session restore

#### Primary files

- `OnlyYoursExpo/src/services/WebSocketService.js`
- `OnlyYoursExpo/src/state/AuthContext.js`
- `OnlyYoursExpo/src/state/GameContext.js`

#### Code-level direction

- Add active-client/reconnecting guard in `WebSocketService.connect`
- Revisit background reconnect `useEffect` in `AuthContext`
- Add explicit session resubscribe method in `GameContext`
- Ensure reconnect path refreshes snapshot **after** subscriptions are restored

#### Exit criteria

- no duplicate websocket clients,
- no duplicate gameplay subscriptions,
- reconnect reliably restores a live active game.

---

### Phase 2 - Frontend Event Routing, Session Filtering, and Submit Recovery Hardening

**Status:** Complete

**Goal:** make gameplay state respond only to relevant authoritative events and recover safely from missed follow-ups

#### Tasks

- [x] Narrow `GameContext` payload handling to relevant gameplay events only
- [x] Stop unrelated status messages from clearing submit fallback
- [x] Add session guards before applying websocket payloads
- [x] Add session/request-generation guard before applying snapshot hydrations
- [x] Clarify queue ownership between `AuthContext` and `GameContext`
- [x] Decide whether queue routing is:
  - centralized in one owner, or
  - split through an explicit typed dispatcher
- [x] Ensure resume/reconnect snapshot fallback cannot overwrite newer state

#### Primary files

- `OnlyYoursExpo/src/state/GameContext.js`
- `OnlyYoursExpo/src/state/AuthContext.js`
- possibly a new shared utility:
  - `OnlyYoursExpo/src/state/gameEventRouting.js`
  - or `OnlyYoursExpo/src/services/gameEventRouter.js`

#### Code-level direction

- Move `clearSubmitRecoveryTimeout()` so it only runs for:
  - `QUESTION`
  - `ROUND_STATE`
  - `GAME_RESULTS`
  - any explicitly approved gameplay transition event
- Ignore `PARTNER_LEFT`, `PARTNER_RETURNED`, invitation events, and non-active-session events inside `GameContext`
- Add stale request token for `hydrateCurrentQuestion`

#### Exit criteria

- submit recovery cannot be canceled by irrelevant queue chatter,
- stale payloads do not mutate active gameplay state,
- game state becomes session-scoped and deterministic.

---

### Phase 3 - Backend Idempotency and Persistence Hardening

**Status:** Complete

**Goal:** prevent duplicate answer/guess rows and make repeated submits safe

#### Tasks

- [x] Add unique DB constraint/index on `(game_session_id, question_id, user_id)`
- [x] Add migration for constraint and any required cleanup logic
- [x] Update `submitAnswer` for duplicate-row-safe idempotency
- [x] Update `submitGuess` for duplicate-row-safe idempotency
- [x] Ensure duplicate-key exceptions resolve to deterministic current state
- [x] Audit `findAnswersByQuestionId(...)` assumptions after hardening

#### Primary files

- `backend/src/main/resources/db/migration/...`
- `backend/src/main/java/com/onlyyours/model/GameAnswer.java`
- `backend/src/main/java/com/onlyyours/service/GameService.java`
- `backend/src/main/java/com/onlyyours/repository/GameAnswerRepository.java`

#### Code-level direction

- Prefer DB-backed uniqueness over application-only checks
- Handle duplicate insert races as successful idempotent replays where possible
- Ensure repeated answer/guess of same question does not crash or corrupt progression

#### Exit criteria

- no duplicate answer rows,
- double submit becomes safe,
- backend state remains coherent under retry storms.

---

### Phase 4 - Invitation Transition Locking and Idempotency

**Status:** Complete

**Goal:** make invitation lifecycle race-safe

#### Tasks

- [x] Switch `acceptInvitation` to pessimistic session locking
- [x] Switch `declineInvitation` to pessimistic session locking
- [x] Define idempotent outcomes for duplicate accept or decline attempts
- [x] Update controller handling for deterministic websocket responses
- [x] Add tests for:
  - accept + accept,
  - accept + decline,
  - duplicate retry after success

#### Primary files

- `backend/src/main/java/com/onlyyours/service/GameService.java`
- `backend/src/main/java/com/onlyyours/controller/GameController.java`
- `backend/src/main/java/com/onlyyours/repository/GameSessionRepository.java`

#### Exit criteria

- invitation transitions are deterministic under concurrent requests,
- no conflicting session terminal states from duplicate taps/retries.

---

### Phase 5 - Presence Correctness

**Status:** Complete

**Goal:** make partner presence signal meaningful rather than noisy

#### Tasks

- [x] Introduce effective per-user presence tracking
- [x] Emit `PARTNER_RETURNED` only on effective offline -> online transition
- [x] Emit `PARTNER_LEFT` only on effective online -> offline transition
- [x] Verify reconnect does not produce false leave/return churn
- [x] Update frontend handling so presence messages stay informative and non-destructive

#### Primary files

- `backend/src/main/java/com/onlyyours/service/GamePresenceEventListener.java`
- possibly new presence-tracking helper/service
- `OnlyYoursExpo/src/state/AuthContext.js`

#### Exit criteria

- reconnect churn no longer looks like partner leave/return churn,
- presence events reflect real effective presence.

---

### Phase 6 - Read Path Normalization and Transition Ownership

**Status:** Complete

**Goal:** make gameplay transitions occur from explicit authoritative paths, not surprising read-side effects

#### Tasks

- [x] Audit all places where reads can transition game phase
- [x] Move Round 1 -> Round 2 transition ownership to submit flow if practical
- [x] Move game completion ownership to submit flow if practical
- [x] Reduce `getCurrentQuestionForUser(...)` to a snapshot-oriented read
- [x] If any mutating read remains, document and test it explicitly

#### Primary files

- `backend/src/main/java/com/onlyyours/service/GameService.java`
- `backend/src/main/java/com/onlyyours/controller/GameController.java`

#### Exit criteria

- one clear authoritative path exists for each major transition,
- snapshot reads are mostly observational and idempotent.

---

## 6) Test Strategy by Issue Type

This phase must be tested per issue class, not just with one final green suite.

### T1) Frontend reconnect and subscription tests

Add or expand tests for:

- reconnect while active game exists,
- reconnect restores active session subscriptions,
- no duplicate `subscribe(...)` behavior after reconnect,
- stale topic/private queue payloads are ignored,
- only authoritative gameplay payloads clear submit recovery.

Likely files:

- `OnlyYoursExpo/src/state/__tests__/GameContext.test.js`
- `OnlyYoursExpo/src/state/__tests__/AuthContext.test.js`
- `OnlyYoursExpo/src/services/__tests__/WebSocketService.test.js`

### T2) Frontend submit recovery tests

Add tests for:

- missed follow-up after answer submit,
- missed follow-up after guess submit,
- unrelated `STATUS` event does **not** cancel recovery,
- stale snapshot response is ignored when session changed,
- reconnect snapshot recovery resumes next unanswered question correctly.

Likely files:

- `OnlyYoursExpo/src/state/__tests__/GameContext.test.js`
- `OnlyYoursExpo/src/screens/__tests__/GameScreen.test.js`

### T3) Backend idempotency and uniqueness tests

Add tests for:

- duplicate answer submit same session/question/user,
- duplicate guess submit same session/question/user,
- duplicate insert race handling against unique constraint,
- no duplicate-key crash in answer maps after hardening.

Likely files:

- `backend/src/test/java/com/onlyyours/service/GameServiceTest.java`
- new integration test if needed:
  - `backend/src/test/java/com/onlyyours/integration/...`

### T4) Invitation lifecycle concurrency tests

Add tests for:

- duplicate accept,
- duplicate decline,
- accept vs decline race,
- idempotent websocket/controller output after already-transitioned session.

Likely files:

- `backend/src/test/java/com/onlyyours/service/GameServiceTest.java`
- `backend/src/test/java/com/onlyyours/controller/GameControllerWebSocketTest.java`

### T5) Presence correctness tests

Add tests for:

- reconnect without false partner-left event,
- multiple active sockets for one user,
- disconnect of one socket does not mark user offline if another remains active.

Likely files:

- new tests around `GamePresenceEventListener`
- integration/websocket tests if needed

### T6) Read-path transition tests

Add tests for:

- snapshot read does not unexpectedly double-transition,
- resume after both finish Round 1 behaves deterministically,
- results completion path is idempotent if both players finish close together.

Likely files:

- `backend/src/test/java/com/onlyyours/service/GameServiceTest.java`
- `backend/src/test/java/com/onlyyours/controller/WebSocketPerformanceTest.java`

---

## 7) Final Validation Round After All Fixes

After all phases above are implemented, run the full validation stack.

### Automated validation

- [x] Expo focused realtime/gameplay suites
- [x] Expo full suite: `npm test -- --runInBand`
- [x] backend focused gameplay/controller/integration suites
- [x] backend full suite: `./gradlew test --rerun-tasks`
- [x] `git diff --check`

#### Recorded results

- Expo full suite: `24/24` suites passed, `109/109` tests passed
- backend full suite: `BUILD SUCCESSFUL`, `165/165` tests passed
- targeted backend websocket rerun passed for:
  - `GameControllerWebSocketTest.testAnswerFlow_AnswerRecordedConfirmation`
  - `WebSocketPerformanceTest.testFullGameCompletionTime`

### Manual two-device validation

Must explicitly rerun:

- [ ] invitation accept/resume
- [ ] independent Round 1 progression
- [ ] independent Round 2 progression
- [ ] early finisher waiting state
- [ ] app close + return mid-round
- [ ] partner leave + partner return during active game
- [ ] final guess completion while partner is away
- [ ] results live when both remain open
- [ ] results notification/deep link when one player returns later
- [ ] rapid tap / retry behavior on answer and guess submit

---

## 8) Recommended Execution Order

Implement in this order:

1. Phase 1 - frontend reconnect ownership
2. Phase 2 - frontend event routing and stale-state hardening
3. Phase 3 - backend answer uniqueness/idempotency
4. Phase 4 - invitation locking/idempotency
5. Phase 5 - presence correctness
6. Phase 6 - read-path normalization
7. full automated rerun
8. manual two-device validation

Reason:

- the frontend reconnect/event-routing fixes reduce immediate user-facing instability first,
- backend uniqueness/idempotency then hardens the data model,
- presence and read-path normalization become safer once transport and persistence behavior are stable.

---

## 9) Implementation Checklist

### Document-level completion checklist

- [x] Phase 1 complete
- [x] Phase 2 complete
- [x] Phase 3 complete
- [x] Phase 4 complete
- [x] Phase 5 complete
- [x] Phase 6 complete
- [x] Focused automated tests added for each issue family
- [x] Full Expo suite green
- [x] Full backend suite green
- [ ] Manual two-device regression completed
- [x] Plan updated with final implementation notes

---

## 10) Notes for Approval

This plan intentionally treats the gameplay/realtime stack as one stabilization surface rather than a sequence of isolated bug fixes.

That is the safer approach because the main remaining risks are not single-line defects. They are:

- event ownership problems,
- reconnect lifecycle ambiguity,
- idempotency gaps,
- DB constraint gaps,
- state transitions that currently depend on timing.

If approved, implementation should proceed phase-by-phase in this same document, with checkboxes updated as work lands.
