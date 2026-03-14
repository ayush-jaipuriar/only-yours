# P2 Game Flow Restructure Plan - Independent Per-Round Progression

**Created:** Mar 14, 2026  
**Status:** Drafted; awaiting approval  
**Scope type:** Structural gameplay change request  
**Supersedes when approved:** current lockstep per-question progression assumptions in `Phase A`

---

## 0) Workflow Gate (Mandatory)

This change follows your required workflow:

- [x] Step 1: In-depth planning in a dedicated `.md` with implementation checklists
- [ ] Step 2: User approval of this plan
- [ ] Step 3: Implementation
- [ ] Step 4: Comprehensive automated validation
- [ ] Step 5: Completion report after tests pass

Implementation must not begin until you approve this document.

---

## 1) What Is Changing

### Current behavior

The current game engine is **lockstep per question**:

1. `P1` answers `Q1`
2. `P1` waits for `P2` to answer `Q1`
3. only then do both advance to `Q2`
4. the same per-question blocking happens in `Round 2` guessing

This is enforced today in:

- `backend/src/main/java/com/onlyyours/service/GameService.java`
- `OnlyYoursExpo/src/state/GameContext.js`
- `OnlyYoursExpo/src/screens/GameScreen.js`

### Desired behavior

The new game engine should be **independent per round**:

#### Round 1

- each player sees one question at a time
- each player can move through all answer questions at their own speed
- no per-question waiting for the partner
- once a player finishes all answer questions:
  - they wait at a round-end waiting/review state
  - they can review their own submitted answers with question text only
- `Round 2` unlocks only after **both players finish all Round 1 answers**

#### Round 2

- each player again sees one question at a time
- each player can move through all guess questions at their own speed
- no per-question waiting for the partner
- submitted guesses are locked
- once a player finishes all guesses:
  - they wait at a round-end waiting/review state
  - they can review their own submitted guesses with question text only
- results unlock only after **both players finish all Round 2 guesses**

#### Results and notification behavior

- if both players are still active when results complete, results may appear live
- if one player already left:
  - the last finisher sees results immediately
  - the earlier finisher receives a notification with:
    - winner
    - score summary
    - deep link to results when ready

#### Resume behavior

- `Continue Game` should resume the user at the **next unanswered question**
- the app should never send them back to already-submitted questions
- the `7-day` active-session expiry remains unchanged

---

## 2) Locked Product Decisions From Clarification

These are locked unless a blocking implementation issue appears.

- [x] Keep the UI one-question-at-a-time
- [x] Remove partner blocking within a round
- [x] Lock answers and guesses once submitted
- [x] Show round-end waiting state only after a player has finished their full round
- [x] Waiting review should show:
  - the question text
  - the player's selected answer/guess
  - not the full options list
- [x] `Continue Game` should resume at the next unanswered question automatically
- [x] Notification should include:
  - winner
  - score summary
  - deep link directly into results if ready
- [x] Keep the `7-day` session expiry unchanged

---

## 3) Why This Is A Structural Change

This is not a small screen tweak.

It changes:

- backend state progression rules
- how the current question is resolved for each user
- websocket event timing and targeting
- frontend game state assumptions
- resume behavior
- waiting-state UI
- results delivery timing
- notification/deep-link behavior
- test fixtures across service, controller, websocket, context, and screen layers

The most important architectural shift is:

- **today:** session has one shared current question index
- **after this change:** session progression must be derived per user within a round

That means the current `currentQuestionIndex`-centric model is no longer sufficient as the primary source of truth for gameplay progression.

---

## 4) Current Code Reality We Must Replace

### Backend

The current backend progression is driven by:

- `GameSession.currentQuestionIndex`
- `resolveRound1Progress(...)`
- `getFirstRound2Question(...)`
- `getNextRound2Question(...)`
- per-question "both players answered" / "both players guessed" checks

Current lockstep symptoms in code:

1. Round 1 only advances when both players answered the same question
2. Round 2 only advances through a shared session index
3. `getCurrentQuestionForUser(...)` tries to recover the one shared current question
4. result completion logic is shaped around shared per-question progression

### Frontend

The current frontend assumes:

- one shared current question payload
- `waitingForPartner` after every submit
- `guessResult` overlay after each guess
- round transition based on shared realtime events rather than per-user round completion state

This is why we must update both backend and frontend together.

---

## 5) Proposed Target Model

### Core rule

The game should remain **single-question UI** but become **independent progression per player within each round**.

### Backend source of truth

Per-user progress should be derived from persisted answers:

- Round 1 progress for a user:
  - count or ordered set of questions where `round1Answer` exists for that user
- Round 2 progress for a user:
  - count or ordered set of questions where `round2Guess` exists for that user

### Session-level gates

Session state remains meaningful, but only at **phase boundaries**:

- `INVITED`
- `ROUND1`
- `ROUND2`
- `COMPLETED`
- `EXPIRED`

Within `ROUND1` and `ROUND2`, each user's next question should be resolved independently.

### Frontend state model

Frontend should render one of these gameplay sub-states:

1. active Round 1 question
2. Round 1 finished, waiting for partner, showing submitted Round 1 review
3. active Round 2 question
4. Round 2 finished, waiting for partner, showing submitted Round 2 review
5. live results when completed

---

## 6) Architecture Decisions For This Change

### G1) Do not add a separate per-user question queue table in the first pass

Preferred first implementation:

- keep `GameSession.questionIds` as the canonical ordered deck
- infer each player's next unanswered question from `GameAnswer` rows

Why:

- lower migration cost
- reuses existing persisted answer records
- keeps the model simpler

Tradeoff:

- next-question resolution logic becomes more dynamic and must be carefully tested

### G2) Preserve one-question-at-a-time UI

We are not changing the visible question layout to a list.

Why:

- matches your product preference
- minimizes visual rework
- keeps cognitive load low

### G3) Replace per-question waiting with round-end waiting only

Meaning:

- submit immediately advances the same player to their next unanswered question if any remain
- only the end of the round shows waiting/review

### G4) Results readiness should be persisted and queryable

Meaning:

- once `COMPLETED`, results must be fetchable even if a player was offline
- notification deep link should land directly in `Results`

### G5) Notification behavior should be completion-triggered, not presence-dependent

Meaning:

- when the second player completes Round 2, backend should produce a result-ready event
- active clients can navigate live
- inactive clients should still get a notification path

---

## 7) Detailed Implementation Plan

## 7.1 Backend Progression Rewrite

Objectives:

- eliminate shared per-question blocking
- compute next unanswered question per user
- keep round gates and results integrity correct

Checklist:

- [ ] Replace `resolveRound1Progress(...)` logic so submit no longer waits for partner per question
- [ ] Add helper(s) to compute a user's next unanswered Round 1 question from `GameAnswer`
- [ ] Add helper(s) to compute a user's next unanswered Round 2 question from `GameAnswer`
- [ ] Add helper(s) to determine:
  - user finished Round 1
  - both users finished Round 1
  - user finished Round 2
  - both users finished Round 2
- [ ] Keep session status transitions only at phase boundaries:
  - `INVITED -> ROUND1`
  - `ROUND1 -> ROUND2` when both finished Round 1
  - `ROUND2 -> COMPLETED` when both finished Round 2
- [ ] Ensure duplicate submit requests remain idempotent
- [ ] Ensure locked-answer/locked-guess behavior remains enforced
- [ ] Ensure resume always returns the next unanswered question for that specific user

## 7.2 API / DTO Contract Changes

Objectives:

- support active-question and waiting-review states cleanly
- avoid frontend guessing from incomplete payloads

Checklist:

- [ ] Extend current-question/resume response contract to support:
  - next active question for the requesting user
  - round-end waiting state
  - own submitted round review
  - results-ready state when completed
- [ ] Decide whether to expand `QuestionPayloadDto` or introduce a new round-state DTO
- [ ] Include enough metadata for frontend rendering:
  - round
  - question number
  - total questions
  - waiting state flag
  - submitted review items when waiting
  - results-ready flag where relevant
- [ ] Keep payloads privacy-safe:
  - own submitted answer/guess only
  - question text included
  - no option list in waiting review
  - no partner answer leakage before result time

## 7.3 WebSocket Event Contract Rewrite

Objectives:

- send realtime updates appropriate to independent progression
- stop assuming both players are always on the same question

Checklist:

- [ ] Redefine submit-answer flow so the submitting player gets their next question immediately if one exists
- [ ] Add a round-end waiting event/state for users who finished before partner
- [ ] Emit `ROUND2_READY` or equivalent when both users finish Round 1
- [ ] Emit `RESULTS_READY` or equivalent when both users finish Round 2
- [ ] Ensure active in-app users can navigate to results live
- [ ] Ensure event payloads are user-safe and do not leak partner answers prematurely

## 7.4 Frontend GameContext Rewrite

Objectives:

- match the new backend state machine
- stop using per-question partner wait as the main local state

Checklist:

- [ ] Replace `waitingForPartner`-after-each-submit behavior with round-end waiting only
- [ ] Update `startGame(...)` and hydration logic to understand:
  - active question
  - waiting review
  - results-ready
- [ ] Update submit-answer flow so successful submit advances to next question unless round finished
- [ ] Update submit-guess flow similarly
- [ ] Preserve locked submit behavior after selection is sent
- [ ] Keep live results navigation when result event arrives
- [ ] Ensure `Continue Game` resumes correctly into:
  - active question
  - waiting review
  - results screen

## 7.5 Frontend GameScreen UX Rewrite

Objectives:

- preserve one-question-at-a-time feel
- support round-end waiting/review states clearly

Checklist:

- [ ] Keep the active question UI as one-question-at-a-time
- [ ] Remove per-question waiting copy and behavior
- [ ] Add Round 1 waiting/review view:
  - show player's submitted answers
  - show question text only
  - explain waiting for partner to finish Round 1
- [ ] Add Round 2 waiting/review view:
  - show player's submitted guesses
  - show question text only
  - explain waiting for partner to finish Round 2
- [ ] Keep round transition messaging understandable
- [ ] Keep results navigation behavior correct for both live and resumed users

## 7.6 Results, Notifications, and Deep Links

Objectives:

- support both live results and delayed results consumption

Checklist:

- [ ] Ensure last finisher sees results immediately
- [ ] Add or reuse notification payload for completed results:
  - winner
  - score summary
  - session/result identifier
- [ ] Ensure tapping the notification can navigate directly to `Results` when data is ready
- [ ] Ensure results remain queryable later if a user opens from dashboard/history

## 7.7 Validation and Documentation

Objectives:

- prove the new flow works end to end
- replace outdated lockstep assumptions in docs

Checklist:

- [ ] Add backend unit tests for independent Round 1 progression
- [ ] Add backend unit tests for independent Round 2 progression
- [ ] Add backend integration tests for mixed-speed play:
  - one player races ahead
  - one player closes app mid-round
  - resume to next unanswered question
  - live results vs delayed results
- [ ] Add frontend tests for:
  - next-question advancement without partner blocking
  - round-end waiting review
  - results live navigation
  - resume into next unanswered question
- [ ] Update `P2_IMPLEMENTATION_PLAN.md` to replace old lockstep assumptions if this plan is approved and implemented
- [ ] Update this plan during implementation
- [ ] Update `MANUAL_TESTING_GUIDE_SPRINT6.md` with a dedicated matrix for independent per-round progression

---

## 8) Likely Files To Touch

Backend likely:

- `backend/src/main/java/com/onlyyours/service/GameService.java`
- `backend/src/main/java/com/onlyyours/controller/GameController.java`
- `backend/src/main/java/com/onlyyours/controller/GameQueryController.java`
- `backend/src/main/java/com/onlyyours/dto/QuestionPayloadDto.java`
- possibly new DTO(s) for waiting/review state or result-ready resume state
- backend tests under:
  - `backend/src/test/java/com/onlyyours/service/`
  - `backend/src/test/java/com/onlyyours/controller/`
  - `backend/src/test/java/com/onlyyours/integration/`

Frontend likely:

- `OnlyYoursExpo/src/state/GameContext.js`
- `OnlyYoursExpo/src/screens/GameScreen.js`
- `OnlyYoursExpo/src/screens/ResultsScreen.js`
- `OnlyYoursExpo/src/screens/useDashboardGameFlow.js`
- notification/deep-link handling files if needed

Docs:

- `P2_GAME_FLOW_RESTRUCTURE_PLAN.md`
- `P2_IMPLEMENTATION_PLAN.md`
- `MANUAL_TESTING_GUIDE_SPRINT6.md`

---

## 9) Risks And Mitigations

### Risk 1: partial-round resume becomes inconsistent

Mitigation:

- derive next question from persisted answer rows, not transient frontend state
- test resume from multiple interruption points

### Risk 2: Round 2 unlock races when both players finish near-simultaneously

Mitigation:

- keep transaction boundaries on submit
- use explicit "both finished round" checks under locked session read/update
- add near-simultaneous completion tests

### Risk 3: frontend waiting state becomes ambiguous

Mitigation:

- distinguish clearly between:
  - active question
  - round review waiting
  - transition to next round
  - results ready

### Risk 4: results/notifications diverge across active vs inactive users

Mitigation:

- use one canonical results-ready completion path
- treat live websocket delivery and notification delivery as two surfaces over the same completion event

### Risk 5: old docs and tests continue encoding lockstep assumptions

Mitigation:

- explicitly rewrite plan/manual/test language
- search the repo for lockstep-specific wording during implementation

---

## 10) Definition Of Done

This restructure is done when:

- players can complete Round 1 independently without per-question partner blocking
- players can complete Round 2 independently without per-question partner blocking
- waiting appears only at the end of a round
- `Continue Game` resumes to the next unanswered question automatically
- round-end waiting view shows question text plus the user's submitted answers/guesses only
- results unlock correctly when both finish Round 2
- live users can see results immediately
- inactive earlier finisher gets result notification with summary and direct results deep link
- automated backend/frontend validation passes
- manual validation steps are documented

---

## 11) Recommended Implementation Order

1. Rewrite backend per-user next-question resolution first.
2. Redefine current-question/resume contract.
3. Rewrite websocket round transition and results-ready events.
4. Update `GameContext`.
5. Update `GameScreen` waiting/review UX.
6. Add results notification/deep-link integration.
7. Run full automated validation.
8. Update master docs and manual testing guide.

This order matters because the frontend should follow a stable backend state contract rather than inventing transitional behavior locally.

---

## 12) Approval Checklist

This plan is ready for approval if you agree that:

- the lockstep per-question model should be replaced
- one-question-at-a-time UI should stay
- waiting should happen only at round end
- resume should always land on the next unanswered question
- waiting review should show question text plus the user's submitted answer/guess only
- result notifications should include summary plus direct results deep link when ready
- we should treat this as a structural gameplay rewrite, not a minor patch
