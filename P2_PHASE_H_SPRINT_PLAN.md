# P2 Phase H Sprint Plan - Custom Couple Questions

**Created:** Mar 14, 2026
**Status:** Implemented and validated in code; deferred manual sign-off still pending
**Source of truth:** `P2_IMPLEMENTATION_PLAN.md` -> Phase H (`H1` to `H5`)

---

## 0) Workflow Gate (Mandatory)

This phase follows your required workflow:

- [x] Step 1: In-depth phase planning in a dedicated `.md` with detailed checklists
- [x] Step 2: User approval of this plan
- [x] Step 3: Implementation
- [x] Step 4: In-depth automated validation (unit + integration + regression)
- [x] Step 5: Completion report after all tests pass

Implementation began only after approval and is now complete in code.

---

## 1) Sprint Goal

Deliver a first-release custom-question system that lets a linked couple create and play their own private questions immediately inside the existing two-round game loop, while preserving the current standard-category experience.

This phase is successful when:

1. Each partner can create custom questions for the couple deck.
2. Outside gameplay, each user can only see and manage the questions they personally authored.
3. During gameplay, both partners can receive custom couple questions as a shared playable deck.
4. The partner who did not author the question can see that the question is a custom couple question, but not who authored it.
5. Only the original creator can edit or delete their custom questions.
6. Exact duplicate custom questions are blocked within the couple deck.
7. Standard category gameplay continues to work without regression.

---

## 2) Locked Product Decisions For This Phase

These decisions are locked from your clarification round unless a blocking implementation issue appears.

### H1) Phase choice

- The next implementation phase is `Phase H - Custom Questions`.

### H2) Ownership model

- Custom questions are a **couple-level gameplay deck**.
- Outside gameplay, visibility is **private to the author**.
- This means:
  - both partners contribute to the same playable custom deck,
  - but each user only sees their own authored custom questions in management screens.

### H3) Editing and deletion rights

- Only the **original creator** can edit or delete a custom question.
- The non-author partner cannot edit, delete, or browse that question outside gameplay.

### H4) Gameplay requirement

- Custom questions must be **usable immediately in gameplay** in this phase.
- This is not a storage-only phase.

### H5) Product limits

- No first-release product cap on number of custom questions.
- No user-facing length cap is intentionally introduced as a product rule in this phase.
- No category/tag system is included in this phase.

Implementation note:
- Even without a product cap, the game engine still needs a **minimum playable deck size**. Because the current engine runs `8` questions per game, the custom deck must have at least `8` active questions across the couple before a custom game can start.

### H6) In-game disclosure rules

- When a custom question appears during gameplay, the non-author partner should:
  - know that it is a **custom couple question**,
  - not see who authored it.

### H7) Validation rules

- Exact duplicate custom questions are not allowed.
- Empty questions and empty answer options should still be blocked as required-field validation.

Assumption carried into planning:
- “Exact duplicate” will be enforced on a normalized version of the question text within the same couple deck:
  - trim outer whitespace,
  - collapse repeated internal whitespace,
  - compare case-insensitively.
- If you want stricter or looser duplicate rules later, we can tune that during implementation.

---

## 3) Current Architecture Baseline

Understanding the current system is important because Phase H must fit the repo we actually have, not an imagined architecture.

### Current backend reality

- Standard questions live in [Question.java](/Users/ayushjaipuriar/Documents/GitHub/only-yours/backend/src/main/java/com/onlyyours/model/Question.java).
- Standard questions currently require a non-null category and are selected by category ID in [GameService.java](/Users/ayushjaipuriar/Documents/GitHub/only-yours/backend/src/main/java/com/onlyyours/service/GameService.java).
- Game sessions currently store:
  - `categoryId`
  - `questionIds`
  - `currentQuestionIndex`
- Game answers currently point to a `Question`.
- The game engine expects a single unified question source once a session starts.

### Current frontend reality

- Category selection lives in [CategorySelectionScreen.js](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/CategorySelectionScreen.js).
- That screen currently loads standard categories from `/content/categories`.
- Invitations are sent over the existing WebSocket game flow.
- Gameplay UI already assumes four options and existing `QuestionPayloadDto` structure.

### Why this matters

- If we add a totally separate “custom question” gameplay model without care, we risk duplicating the game engine.
- The cleanest Phase H plan is the one that reuses the existing round logic, answer storage, results flow, and history flow as much as possible.

---

## 4) Architecture Decisions For Phase H (Proposed)

These are the main design choices I recommend implementing unless you want to revise them before approval.

### H8) Reuse the existing `Question` gameplay pipeline

- Preferred approach: extend the backend question model so both standard and custom playable questions can flow through the same engine.
- Why:
  - `GameAnswer` already points to `Question`,
  - session `questionIds` already serialize question identity cleanly,
  - round 1 / round 2 logic in `GameService` already works once a question list exists.

Practical implication:

- Instead of building an entirely separate answer/result model, treat custom questions as another playable question source with ownership metadata.

### H9) Add question source metadata

- The question model should distinguish at least:
  - standard catalog question
  - custom couple question

Recommended fields:

- `sourceType` enum: `STANDARD`, `CUSTOM_COUPLE`
- nullable `couple`
- nullable `createdBy`
- lifecycle flag such as `archived` or `active`
- timestamps for create/update

Why:

- We need couple ownership and creator ownership.
- We need author-only management outside gameplay.
- We need safe user-facing delete behavior without breaking historical game answers.

### H10) User-facing delete, backend soft archive

- Recommended UX: user sees “Delete”.
- Recommended backend behavior: soft archive instead of physical delete.

Why:

- keeps historical game answers/results stable,
- avoids dangling foreign-key problems for prior sessions,
- still honors the user’s intent because deleted questions disappear from author management and from future gameplay.

### H11) Add a deck type to game sessions

- Current sessions assume a standard category via `categoryId`.
- Custom couple gameplay needs a way to represent:
  - session came from the custom deck,
  - category ID may be absent or not meaningful.

Recommended addition:

- `deckType` enum on `GameSession`, for example:
  - `STANDARD_CATEGORY`
  - `CUSTOM_COUPLE`

Recommended rule:

- `categoryId` remains used for standard sessions.
- custom sessions use `deckType = CUSTOM_COUPLE` and a null or unused `categoryId`.

Why:

- it keeps results/history/session behavior explainable,
- it avoids inventing fake category IDs,
- it cleanly supports future deck types if Phase J/I/K ever need them.

### H12) Keep author privacy outside the game

- Author management endpoints should return only the requesting user’s custom questions.
- Gameplay deck selection should pull active custom questions from **both partners** in the couple.

Why:

- This exactly matches your product rule:
  - private author-side visibility outside gameplay,
  - shared couple usage in-game.

### H13) Minimal in-game disclosure

- Question payloads for custom questions should include a small indicator like:
  - `isCustomQuestion: true`
  - optional display label text controlled by frontend
- Payloads should **not** expose `createdBy`.

Why:

- The user should know this is a custom couple question.
- The partner should not learn authorship from the payload.

### H14) No product cap, but playable readiness matters

- We will not add a max-count rule.
- We will not add optional tags/categories.
- We still must expose “deck readiness” because custom gameplay cannot start until at least `8` active custom questions exist across the couple.

Recommended summary surface:

- `myQuestionCount`
- `couplePlayableQuestionCount`
- `isPlayable`
- `questionsNeededToPlay`

---

## 5) Scope and Non-Goals

### In Scope (Phase H)

- Backend data model changes for couple custom questions
- Backend CRUD endpoints for author-owned management
- Couple-isolation and author-ownership enforcement
- Duplicate-question validation
- Frontend custom-question library UI
- Frontend create/edit/delete flows
- Dedicated custom deck entry in the game-start flow
- Custom deck gameplay integration using the existing game engine
- Tests and documentation

### Explicit Non-Goals

- Partner browsing of each other’s authored questions outside gameplay
- Shared editing rights
- Tags, categories, or question folders for custom questions
- Moderation or advanced safety policy work beyond basic validation
- Mixing custom questions automatically into standard categories by default
- New scoring rules or new game mechanics

---

## 6) Detailed Phase Breakdown

### H1) Data model and backend contracts

Core objective:
- make custom questions first-class playable content without forking the whole game system.

Checklist:

- [x] Extend the backend question model to support custom couple questions with:
  - couple ownership
  - creator ownership
  - source type
  - active/archive lifecycle
  - create/update timestamps
- [x] Add a session-level deck type so custom sessions are distinguishable from standard category sessions.
- [x] Update DTOs/contracts so a custom gameplay payload can indicate that the question is custom without revealing authorship.
- [x] Define deck-readiness rules for starting a custom session:
  - minimum `8` active custom questions across the couple
  - linked couple required
  - only active questions are eligible

Likely backend files:

- `backend/src/main/java/com/onlyyours/model/Question.java`
- `backend/src/main/java/com/onlyyours/model/GameSession.java`
- `backend/src/main/java/com/onlyyours/dto/...`
- `backend/src/main/java/com/onlyyours/repository/QuestionRepository.java`
- possible new request/response DTOs for custom library APIs

### H2) Library management API and validation

Core objective:
- give each author a private management surface for their own questions, while keeping gameplay deck logic couple-wide.

Checklist:

- [x] Implement create endpoint for custom questions authored by the current user.
- [x] Implement list endpoint returning only the current user’s authored custom questions.
- [x] Implement update endpoint restricted to the original creator.
- [x] Implement delete endpoint restricted to the original creator, backed by archive/soft-delete behavior.
- [x] Implement deck-summary endpoint exposing:
  - authored count
  - couple playable count
  - readiness state
  - remaining questions needed to start
- [x] Enforce access rules:
  - only linked couples can use the custom deck
  - user can only manage their own authored custom questions
  - user cannot fetch/edit/delete partner-authored questions via direct ID access
- [x] Enforce validation:
  - non-empty question text
  - non-empty option A/B/C/D
  - exact duplicate question prevention within the couple deck

Recommended endpoint shape:

- `GET /custom-questions/mine`
- `GET /custom-questions/summary`
- `POST /custom-questions`
- `PUT /custom-questions/{id}`
- `DELETE /custom-questions/{id}`

Theory/tradeoff:

- Separate `mine` and `summary` endpoints keep the privacy model clear.
- If we returned “all couple questions,” the product rule would be violated immediately.

### H3) Frontend custom library surfaces

Core objective:
- let a user manage their authored questions clearly, while also understanding couple deck readiness.

Checklist:

- [x] Add a custom-question management entry point in the active Expo app.
- [x] Create list/create/edit/delete UI for authored custom questions only.
- [x] Show deck-readiness guidance, for example:
  - total playable custom questions across the couple
  - how many more are needed before a game can start
- [x] Add strong empty/loading/error states.
- [x] Make ownership behavior obvious in the UI:
  - “Your custom questions”
  - no partner-authored browsing outside gameplay
- [x] Keep the UI consistent with existing theme/accessibility/haptics patterns.

Likely frontend files:

- `OnlyYoursExpo/src/screens/CategorySelectionScreen.js`
- one or more new screens such as:
  - `CustomQuestionsScreen.js`
  - `EditCustomQuestionScreen.js`
- navigation updates
- service/api helpers

### H4) Dedicated custom-deck gameplay integration

Core objective:
- make the custom deck playable immediately using the existing game engine and invitation flow.

Checklist:

- [x] Add a dedicated custom deck card or entry point in category/start flow.
- [x] Ensure the UI explains playability:
  - playable now,
  - not enough questions yet,
  - link required if no couple exists.
- [x] Extend invitation/game-start contracts so a custom deck session can be created.
- [x] Update invitation payloads and/or session metadata so custom sessions identify correctly in:
  - invite state
  - active game hydration
  - gameplay payloads
  - results/history where needed
- [x] Mark custom questions in gameplay UI without exposing author identity.
- [x] Keep standard category sessions unchanged.

Recommended UX shape:

- Standard categories remain as they are.
- Add one dedicated “Custom Couple Questions” deck entry.
- Selecting it either:
  - starts the invite flow if playable,
  - or routes to the authoring library / guidance screen if not playable yet.

Theory/tradeoff:

- A dedicated custom deck is better than silently mixing custom questions into standard categories because:
  - it gives users control,
  - it matches the private/shared hybrid product model,
  - it avoids surprising results in standard sessions.

### H5) Validation and docs

Core objective:
- prove the hybrid privacy + gameplay model actually works and does not break existing flows.

Checklist:

- [x] Add backend unit/service tests for:
  - create/update/delete ownership rules
  - duplicate prevention
  - couple isolation
  - deck summary/readiness
- [x] Add backend integration tests for:
  - custom question CRUD
  - forbidden access to partner-authored question management
  - custom game invitation/start flow
  - full custom game progression through results
- [x] Add frontend tests for:
  - authored-question library states
  - create/edit/delete flow
  - deck readiness messaging
  - custom deck start entry behavior
  - in-game custom-question indicator behavior
- [x] Update manual testing documentation for:
  - author-only visibility
  - creator-only edit/delete
  - couple readiness threshold
  - custom deck gameplay
  - standard category regression checks

---

## 7) Proposed File-Level Target Map

Primary expected backend targets:

- `backend/src/main/java/com/onlyyours/model/Question.java`
- `backend/src/main/java/com/onlyyours/model/GameSession.java`
- `backend/src/main/java/com/onlyyours/repository/QuestionRepository.java`
- `backend/src/main/java/com/onlyyours/service/GameService.java`
- new or updated controller(s) for custom-question CRUD
- DTO classes for custom question requests/responses and custom session start contracts
- backend tests under:
  - `backend/src/test/java/com/onlyyours/service/`
  - `backend/src/test/java/com/onlyyours/integration/`
  - `backend/src/test/java/com/onlyyours/controller/`

Primary expected frontend targets:

- `OnlyYoursExpo/src/screens/CategorySelectionScreen.js`
- new custom-question management screen(s)
- `OnlyYoursExpo/src/navigation/AppNavigator.js`
- `OnlyYoursExpo/src/state/GameContext.js`
- related API/service helpers
- frontend tests under:
  - `OnlyYoursExpo/src/screens/__tests__/`
  - `OnlyYoursExpo/src/state/__tests__/`

Likely documentation targets:

- `P2_IMPLEMENTATION_PLAN.md`
- `MANUAL_TESTING_GUIDE_SPRINT6.md`
- this sprint plan file

---

## 8) Validation Strategy

### Automated backend validation

- Repository/service/controller tests for author/couple isolation
- Integration tests proving:
  - author-only management works
  - partner cannot manage partner-authored question directly
  - custom deck cannot start before minimum playable count
  - custom deck can start once playable
  - game progression/results still work with custom questions

### Automated frontend validation

- Screen-flow tests for create/edit/delete and empty/loading/error states
- Entry-point tests for custom deck start and readiness messaging
- Gameplay/regression tests for custom question indicator handling
- Full Expo Jest regression after targeted suites pass

### Manual validation to prepare for later sign-off

- Author A creates custom questions and sees only their own authored list
- Author B creates custom questions and sees only their own authored list
- Each author is blocked from editing/deleting the other partner’s questions
- Couple deck becomes playable only once combined active question count reaches `8`
- Custom game invite/accept/play/finish works end-to-end
- Standard category invite/accept/play/finish still works unchanged

Suggested commands after implementation:

```bash
cd OnlyYoursExpo
source "$HOME/.nvm/nvm.sh" && nvm use 24
npm test -- --runInBand
```

```bash
cd backend
./gradlew test --rerun-tasks
```

---

## 9) Risks and Mitigations

### Risk 1 - Privacy model becomes inconsistent

- Risk:
  - one endpoint or UI screen accidentally exposes partner-authored questions outside gameplay.
- Mitigation:
  - keep “mine” and “couple summary” contracts separate,
  - add forbidden-access integration tests,
  - avoid a generic “all custom questions” endpoint.

### Risk 2 - Custom gameplay forks the engine too much

- Risk:
  - adding separate custom-question answer/result logic creates long-term maintenance pain.
- Mitigation:
  - reuse the existing `Question`/`GameAnswer`/`GameService` pipeline as much as possible,
  - add source/deck metadata instead of parallel gameplay models.

### Risk 3 - Delete breaks history or answer references

- Risk:
  - hard delete could break old sessions or analytics.
- Mitigation:
  - implement user-facing delete as backend soft archive.

### Risk 4 - No max limit causes hidden technical constraints

- Risk:
  - “no limits” at the product level can still create DB or UI problems if fields are too constrained.
- Mitigation:
  - avoid introducing arbitrary product caps,
  - but choose storage types and UI handling that tolerate long text sensibly,
  - keep validation focused on emptiness and duplicates rather than hard caps.

### Risk 5 - Duplicate-rule ambiguity causes user confusion

- Risk:
  - users may be confused if visually identical questions with spacing/case changes slip through.
- Mitigation:
  - normalize question text before duplicate comparison,
  - keep the rule scoped to exact-duplicate intent rather than fuzzy semantic matching.

### Risk 6 - Custom deck readiness is unclear

- Risk:
  - users think the feature is broken when play cannot start.
- Mitigation:
  - expose clear readiness counts and “questions needed” guidance in the UI.

---

## 10) Definition of Done

Phase H should be considered done when:

- A linked user can create, edit, and delete only their own custom questions.
- Outside gameplay, users cannot browse their partner’s custom questions.
- The couple’s combined active custom questions form a shared playable deck.
- A custom game can be started explicitly once the deck is playable.
- During gameplay, custom questions are identified as custom couple questions without exposing author identity.
- Exact duplicate questions are blocked within the couple deck.
- Standard category gameplay remains unaffected.
- Automated tests cover the new ownership, privacy, readiness, and gameplay behavior.
- Manual validation instructions are documented for later execution.

---

## 11) Recommended Execution Order

To reduce risk and keep debugging bounded, this is the execution order I recommend:

1. Backend model + repository + service changes
2. Backend CRUD and summary contracts
3. Backend custom-game session creation path
4. Frontend authoring library UI
5. Frontend custom deck start entry
6. Frontend gameplay indicator / regression handling
7. Automated validation
8. Documentation sync

Why this order:

- The frontend should not be built against unstable contracts.
- The custom-game start path is the highest-risk backend area because it intersects with the live game engine.
- Documentation should be updated alongside implementation, but the final “complete” status should only land after tests pass.

---

## 12) This Planning Iteration

Changed in this iteration:

- Converted the high-level `Phase H` roadmap into a dedicated sprint execution plan.
- Replaced the stale “shared library with equal partner management” assumption from the master plan with the clarified product model:
  - shared gameplay deck
  - private author-side visibility outside gameplay
  - creator-only edit/delete
- Locked immediate gameplay integration into the scope for this phase.
- Recorded the no-limit product stance while preserving the minimum `8` question playable-deck rule imposed by the existing engine.
- Chose a plan direction that reuses the existing game engine rather than creating a parallel custom-game subsystem.

Files added:

- `P2_PHASE_H_SPRINT_PLAN.md`

Next step:

- Wait for your approval or requested revisions before any implementation starts.

---

## 13) Implementation Outcome

Summary:

- Phase H was implemented using the existing `Question` and `GameService` gameplay pipeline rather than creating a parallel custom-game engine.
- The shipped behavior matches the clarified product model:
  - shared couple gameplay deck,
  - private author-side management outside gameplay,
  - creator-only edit/delete,
  - visible in-game custom-question labeling without author reveal.

Backend files changed:

- `backend/src/main/java/com/onlyyours/model/Question.java`
- `backend/src/main/java/com/onlyyours/model/GameSession.java`
- `backend/src/main/java/com/onlyyours/repository/QuestionRepository.java`
- `backend/src/main/java/com/onlyyours/service/GameService.java`
- `backend/src/main/java/com/onlyyours/service/CustomQuestionService.java`
- `backend/src/main/java/com/onlyyours/service/CustomQuestionDeckMetadata.java`
- `backend/src/main/java/com/onlyyours/controller/GameController.java`
- `backend/src/main/java/com/onlyyours/controller/CustomQuestionController.java`
- `backend/src/main/java/com/onlyyours/dto/GameInvitationDto.java`
- `backend/src/main/java/com/onlyyours/dto/QuestionPayloadDto.java`
- `backend/src/main/java/com/onlyyours/dto/ActiveGameSessionDto.java`
- `backend/src/main/java/com/onlyyours/dto/GameHistoryItemDto.java`
- `backend/src/main/java/com/onlyyours/dto/CustomQuestionRequestDto.java`
- `backend/src/main/java/com/onlyyours/dto/CustomQuestionDto.java`
- `backend/src/main/java/com/onlyyours/dto/CustomQuestionDeckSummaryDto.java`
- `backend/src/main/resources/db/migration/V12__PhaseH_Custom_Questions.sql`

Frontend files changed:

- `OnlyYoursExpo/src/navigation/AppNavigator.js`
- `OnlyYoursExpo/src/screens/DashboardScreen.js`
- `OnlyYoursExpo/src/screens/CategorySelectionScreen.js`
- `OnlyYoursExpo/src/screens/GameScreen.js`
- `OnlyYoursExpo/src/screens/CustomQuestionsScreen.js`
- `OnlyYoursExpo/src/screens/CustomQuestionEditorScreen.js`
- `OnlyYoursExpo/jest.setup.js`

Test coverage added or updated:

- `backend/src/test/java/com/onlyyours/service/CustomQuestionServiceTest.java`
- `backend/src/test/java/com/onlyyours/integration/CustomQuestionFlowIntegrationTest.java`
- `backend/src/test/java/com/onlyyours/service/GameServiceTest.java`
- `backend/src/test/java/com/onlyyours/controller/GameControllerWebSocketTest.java`
- `OnlyYoursExpo/src/screens/__tests__/CustomQuestionsScreen.test.js`
- `OnlyYoursExpo/src/screens/__tests__/CustomQuestionEditorScreen.test.js`
- `OnlyYoursExpo/src/screens/__tests__/CategorySelectionScreen.test.js`
- `OnlyYoursExpo/src/screens/__tests__/GameScreen.test.js`

Why these changes were made:

- The backend model changes make custom questions first-class playable content while preserving history integrity through archive-based deletion.
- The dedicated custom-deck session metadata keeps results/history and active-session hydration explainable.
- The frontend surfaces teach the hybrid privacy model clearly, which reduces user confusion about why authored questions are private outside gameplay but shared in the actual deck.

Automated validation run:

- `OnlyYoursExpo`: `npm test -- --runInBand` -> `22` suites, `96` tests passed
- `backend`: `./gradlew test --rerun-tasks` -> `29` suites, `152` tests passed

Known follow-up:

- Manual product/device validation is still deferred and should use the dedicated custom-question section added to `MANUAL_TESTING_GUIDE_SPRINT6.md`.
