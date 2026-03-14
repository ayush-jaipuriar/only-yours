# P2 Phase J Sprint Plan - Progression Expansion (XP, Levels, Expanded Achievements)

**Created:** Mar 14, 2026
**Status:** Implemented in code; automated validation passed; manual sign-off pending
**Source of truth:** `P2_IMPLEMENTATION_PLAN.md` -> Phase J (`J1` to `J5`)

---

## 0) Workflow Gate (Mandatory)

This phase follows your required workflow:

- [x] Step 1: In-depth phase planning in a dedicated `.md` with detailed checklists
- [x] Step 2: User approval of this plan
- [x] Step 3: Implementation
- [x] Step 4: In-depth automated validation (unit + integration + regression)
- [x] Step 5: Completion report after all tests pass

Implementation began only after approval.

---

## 1) Sprint Goal

Deliver a first-release progression system that makes long-term play feel rewarding and visible by introducing:

1. individual XP and levels,
2. couple XP and levels,
3. an expanded achievement catalog tied to progression,
4. celebratory milestone moments across the active Expo app,
5. deterministic backend rules that can later power privacy-safe sharing in `Phase I`.

This phase is successful when:

1. progression is centered on a single visible system with the couple track as primary and the individual track as secondary,
2. users can understand their current XP, level, and recent unlocks quickly,
3. the backend computes progression deterministically from gameplay and account activity,
4. achievements grow beyond the current MVP badge set,
5. milestone/level-up celebrations feel highly celebratory without making core gameplay noisy,
6. the system can support both reward and decay mechanics where applicable,
7. current stats/history/gameplay flows continue to work without regression.

---

## 2) Locked Product Decisions For This Phase

These decisions are locked from your clarification round unless a blocking implementation issue appears.

### J1) Phase choice

- The next implementation phase is `Phase J - Gamification Expansion`.

### J2) Progression ownership model

- The system includes both:
  - **couple-based progression**,
  - **individual progression**.
- Couple progression is the **primary** visible track.
- Individual progression is the **secondary** visible track inside the same overall system.

Practical implication:

- We should avoid building two unrelated progression UIs.
- Instead, the user should experience one progression system with:
  - a prominent couple/team layer,
  - a supporting personal layer.

### J3) XP earn sources for first release

XP and/or progression events should be modeled for all of these first-release moments:

- completing a game,
- winning a game,
- maintaining streaks,
- daily login,
- answering all questions,
- correct guesses,
- playing with a partner consistently,
- badge/achievement unlocks,
- profile/setup completion.

Implementation note:

- Not every event has to award the same kind or amount of XP.
- Some events may be better treated as:
  - direct XP awards,
  - achievement triggers,
  - bonus modifiers,
  - streak maintenance inputs.

### J4) Surface priority

- Progression should appear on all of these if feasible in the first release:
  - dashboard,
  - profile,
  - results screen,
  - post-game celebration moments.

Recommended execution rule:

- Dashboard and profile are the baseline required surfaces.
- Results and celebration overlays should be added in the same phase if the contracts stabilize cleanly.

### J5) Level structure

- Both **individual users** and **couples** should have levels in the first release.

### J6) Achievement model

- Expand beyond the current MVP badges into a larger achievement catalog tied to XP and levels.
- Existing badges should be treated as seeds for the broader progression system rather than discarded.

### J7) Celebration intensity

- Milestone and level-up experiences should be **highly celebratory** in the first release.

Implementation constraint:

- “Highly celebratory” should mean:
  - visually strong,
  - clearly rewarding,
  - deliberate,
  - not fired so often that the experience becomes exhausting.

### J8) Loss / decay mechanics

- The first release may include loss/decay mechanics such as:
  - streak loss,
  - XP decay or related penalty behaviors.

Planning guardrail:

- Decay mechanics should be understandable and predictable.
- We should not introduce opaque punishment rules that make the system feel arbitrary.

---

## 3) Current Architecture Baseline

Understanding the current system matters because Phase J should extend the real repo, not replace it with a speculative design.

### Current backend reality

- Dashboard stats already exist in [GameService.java](/Users/ayushjaipuriar/Documents/GitHub/only-yours/backend/src/main/java/com/onlyyours/service/GameService.java).
- Current backend already derives:
  - games played,
  - best score,
  - streak days,
  - invitation acceptance rate.
- Current badge generation also lives in [GameService.java](/Users/ayushjaipuriar/Documents/GitHub/only-yours/backend/src/main/java/com/onlyyours/service/GameService.java) and is rule-based.
- There is not yet a dedicated persisted progression model for:
  - XP totals,
  - levels,
  - unlock history,
  - couple-vs-individual progression snapshots.

### Current frontend reality

- Dashboard and profile already render stats/badges-related UI.
- Results screen already exists and is a natural place for post-game progression deltas.
- There is already a design system foundation:
  - theme tokens,
  - accessibility helpers,
  - haptics,
  - screen-level motion/theming patterns.

### Why this matters

- The repo already has a usable statistics and badge foundation.
- The cleanest Phase J implementation should:
  - preserve current stats,
  - expand the contracts,
  - avoid inventing a disconnected parallel progression subsystem.

---

## 4) Architecture Decisions For Phase J (Proposed)

### J9) Use persisted progression snapshots, not recompute-everything-only-at-read-time

- Recommended approach:
  - keep deterministic rules in service code,
  - persist aggregate progression state for users and couples,
  - update that state on progression-triggering events.

Why:

- XP and levels are no longer just derived display metrics.
- We need stable milestone detection and unlock moments.
- A persisted snapshot is better for:
  - celebration triggers,
  - recent unlock payloads,
  - later `Phase I` sharing.

### J10) Keep stats and progression separate but connected

- Stats are factual historical metrics.
- Progression is a reward layer built on top of those facts and events.

Why:

- This reduces confusion in the data model.
- It lets us preserve existing stats endpoints while safely expanding progression contracts.

Recommended model:

- existing stats stay available,
- new progression snapshot payloads reference:
  - XP,
  - level,
  - progress to next level,
  - unlocked achievements,
  - recent celebrations.

### J11) Couple progression as the main summary card

- The dashboard should foreground couple progression first.
- Individual progression should be present, but visually secondary.

Why:

- This matches the product direction of the app.
- The relationship/team journey is the more distinctive feature compared with generic solo gamification.

### J12) Deterministic event ledger or idempotent award rules

- Recommended requirement:
  - progression award processing must be deterministic and protected against accidental double-awards.

Why:

- Game completion, reconnects, retries, or notification-driven resume flows can otherwise duplicate XP grants.
- This is one of the highest-risk areas in Phase J.

Recommended implementation direction:

- introduce either:
  - explicit progression event records,
  - or strongly idempotent update rules keyed to session/event identity.

### J13) Achievement expansion should be code-driven and categorized

- The current badge list should evolve into a more intentional catalog.

Recommended catalog groups:

- onboarding/setup,
- play volume,
- performance,
- consistency/streak,
- couple participation,
- progression milestones.

Why:

- A categorized catalog is easier to extend and test.
- It makes the UI easier to explain later.

### J14) Loss/decay should be narrow and understandable

- Streak-loss mechanics are the safest first decay path.
- XP loss should be used carefully, if at all, in the first release.

Why:

- Streak resets are intuitive.
- Raw XP subtraction can feel punishing and confusing if not surfaced clearly.

Recommended first-release rule:

- allow streak decay confidently,
- treat XP decay as optional only if the implementation remains transparent and low-risk.

### J15) Celebration payloads should be explicit

- When a user or couple levels up or unlocks an achievement, the backend should emit or return explicit celebration metadata.

Why:

- The frontend should not need to infer “was this a level-up?” from comparing two snapshots in multiple places.
- Explicit milestone payloads simplify:
  - results-screen celebration,
  - dashboard/profile refresh behavior,
  - later share-card generation.

---

## 5) Scope and Non-Goals

### In Scope (Phase J)

- Backend progression data model for user and couple progression
- Deterministic XP and level rules
- Achievement catalog expansion
- Progression snapshot APIs
- Progression display on dashboard and profile
- Results-screen progression deltas if contracts land cleanly
- Celebratory milestone treatment
- Tests and documentation

### Explicit Non-Goals

- Monetary rewards or consumable economies
- Competitive leaderboards
- PvP ranking systems
- Complex seasonal battle-pass systems
- Social sharing implementation itself (`Phase I`)
- Punitive opaque progression systems

---

## 6) Detailed Phase Breakdown

### J1) Progression model design

Core objective:
- define a progression system that feels rewarding, explainable, and implementation-safe.

Checklist:

- [ ] Define first-release progression mechanics for:
  - individual XP,
  - individual levels,
  - couple XP,
  - couple levels,
  - expanded achievements.
- [ ] Define XP earn rules for:
  - game completion,
  - game win,
  - streak maintenance,
  - daily login,
  - answering all questions,
  - correct guesses,
  - partner consistency,
  - achievement unlocks,
  - profile/setup completion.
- [ ] Define how couple-primary vs individual-secondary visibility works in UI.
- [ ] Define celebration triggers and payload shape.
- [ ] Define whether XP decay is included in the first implementation, or whether only streak-loss ships now.

Likely design output:

- a deterministic rule table,
- a level-threshold curve,
- an achievement catalog map,
- a milestone payload contract.

### J2) Backend progression computation

Core objective:
- make progression data persistent, deterministic, and idempotent.

Checklist:

- [ ] Add backend model(s) for user progression and couple progression snapshots.
- [ ] Add support for recent unlock / recent level-up metadata.
- [ ] Implement deterministic XP and level computation rules.
- [ ] Add idempotent processing for progression-triggering events.
- [ ] Expand badge logic into a broader achievement catalog.
- [ ] Preserve compatibility with current stats behavior where unchanged.
- [ ] Support streak loss and related decay rules that are actually approved for implementation.

Likely backend files:

- new progression model/entity classes
- migration(s)
- `GameService.java`
- possibly `AuthService.java` or onboarding/profile-completion hooks
- progression-specific service(s) and DTOs

### J3) API and data-contract expansion

Core objective:
- expose progression data cleanly without breaking existing clients.

Checklist:

- [ ] Add or extend payloads for:
  - couple XP,
  - couple level,
  - couple progress to next level,
  - individual XP,
  - individual level,
  - individual progress to next level,
  - achievement catalog / earned achievements,
  - recent milestone metadata.
- [ ] Keep current stats contracts stable where possible.
- [ ] Ensure new/no-history users receive safe progression defaults.
- [ ] Ensure results payloads can carry milestone events if celebration is triggered post-game.

Recommended contract shape:

- `stats` remains available for factual metrics,
- `progression` becomes a dedicated section or dedicated endpoint family.

### J4) Frontend progression surfaces

Core objective:
- make progression visible, desirable, and understandable without cluttering the product.

Checklist:

- [ ] Add couple-primary progression summary to dashboard.
- [ ] Add secondary personal progression summary to dashboard and/or profile.
- [ ] Expand profile to show personal and couple progression context.
- [ ] If feasible, show progression deltas on results screen after game completion.
- [ ] Add highly celebratory level-up / achievement unlock moments.
- [ ] Keep the UI aligned with:
  - existing theme tokens,
  - accessibility patterns,
  - haptics patterns,
  - motion system.

Likely frontend files:

- `OnlyYoursExpo/src/screens/DashboardScreen.js`
- `OnlyYoursExpo/src/screens/ProfileScreen.js`
- `OnlyYoursExpo/src/screens/ResultsScreen.js`
- progression display components
- related screen-flow tests

### J5) Validation and docs

Core objective:
- prove progression is deterministic and that its UX is understandable.

Checklist:

- [ ] Add backend tests for:
  - XP awards,
  - level thresholds,
  - achievement unlock rules,
  - couple vs individual progression,
  - idempotent award behavior,
  - decay/loss behavior where implemented.
- [ ] Add regression tests preserving current stats/badge behavior where expected.
- [ ] Add frontend tests for dashboard/profile/results progression rendering.
- [ ] Add tests for milestone/celebration states.
- [ ] Update manual testing documentation for progression, levels, achievements, and decay scenarios.
- [ ] Update the master implementation plan as the phase progresses.

---

## 7) Proposed File-Level Target Map

Primary expected backend targets:

- `backend/src/main/java/com/onlyyours/service/GameService.java`
- new progression service/model/repository classes
- current stats/badge DTOs or adjacent new DTOs
- migration files under `backend/src/main/resources/db/migration/`
- backend tests under:
  - `backend/src/test/java/com/onlyyours/service/`
  - `backend/src/test/java/com/onlyyours/integration/`

Primary expected frontend targets:

- `OnlyYoursExpo/src/screens/DashboardScreen.js`
- `OnlyYoursExpo/src/screens/ProfileScreen.js`
- `OnlyYoursExpo/src/screens/ResultsScreen.js`
- new progression components under `OnlyYoursExpo/src/components/`
- screen/state tests under:
  - `OnlyYoursExpo/src/screens/__tests__/`
  - `OnlyYoursExpo/src/state/__tests__/`

Likely documentation targets:

- `P2_IMPLEMENTATION_PLAN.md`
- `MANUAL_TESTING_GUIDE_SPRINT6.md`
- this sprint plan file

---

## 8) Validation Strategy

### Automated backend validation

- Unit/service tests for:
  - XP computation,
  - level threshold transitions,
  - achievement unlock rules,
  - streak/decay behavior,
  - couple/user progression separation,
  - idempotent updates.
- Integration tests proving:
  - completing games advances progression correctly,
  - repeated processing does not double-award progression,
  - default progression payloads are safe for new users,
  - current stats endpoints still behave correctly.

### Automated frontend validation

- Dashboard/profile/results rendering tests
- Celebration-state tests
- Regression tests ensuring the old badge/stat UI remains compatible where preserved
- Full Expo Jest regression after focused progression suites pass

### Manual validation to prepare for later sign-off

- Verify a new user sees understandable zero-state progression
- Verify gameplay completion awards couple and individual progression correctly
- Verify streak maintenance and streak loss behavior match the approved rules
- Verify achievement unlocks appear with the right celebration intensity
- Verify dashboard/profile/results reflect the same progression state consistently

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

### Risk 1 - XP duplication from retries or repeated session processing

- Risk:
  - reconnects, retries, or repeated completion handling could award progression more than once.
- Mitigation:
  - use idempotent progression award rules or an event ledger keyed to unique source events.

### Risk 2 - Couple and individual progression diverge in confusing ways

- Risk:
  - users may not understand why their couple level and personal level move differently.
- Mitigation:
  - make the couple track primary,
  - label personal progression clearly as secondary,
  - keep rule explanations consistent.

### Risk 3 - Too many rewards create noisy UX

- Risk:
  - if every action explodes into a celebration, the system becomes tiring instead of motivating.
- Mitigation:
  - reserve the strongest celebration treatment for meaningful unlocks and level-ups,
  - keep small XP gains visually lighter.

### Risk 4 - Decay mechanics feel punitive

- Risk:
  - users may react badly if progress appears to vanish unexpectedly.
- Mitigation:
  - prefer predictable streak-loss behavior first,
  - only introduce XP subtraction if it remains clearly explained and low-risk.

### Risk 5 - Achievement catalog becomes brittle or hard to extend

- Risk:
  - hardcoded one-off rules can turn into maintenance debt.
- Mitigation:
  - keep the catalog structured and categorized,
  - write tests around unlock rules and thresholds.

---

## 10) Definition of Done

Phase J should be considered done when:

- Couple and individual progression both exist and are computed deterministically.
- Couple progression is the primary visible track and individual progression is secondary.
- XP and levels are visible in the approved surfaces.
- The achievement catalog is meaningfully expanded beyond the current MVP set.
- Celebrations for major unlocks/level-ups feel highly celebratory and intentional.
- Any shipped loss/decay mechanics are understandable and tested.
- Existing stats/gameplay/history flows remain unaffected.
- Automated tests cover progression logic and UI states.
- Manual validation instructions are documented for later execution.

---

## 11) Recommended Execution Order

To keep the risk bounded, this is the execution order I recommend:

1. Define the progression rule table and level thresholds
2. Build backend models + migrations
3. Implement deterministic/idempotent backend award logic
4. Expand API contracts
5. Build dashboard/profile progression surfaces
6. Add results/celebration treatment
7. Run full automated validation
8. Sync docs and master plan

Why this order:

- The rule table must exist before data structures and UI can stabilize.
- Backend idempotency is the hardest correctness problem in this phase.
- Frontend celebration work should come after the milestone payload contract is stable.

---

## 12) This Planning Iteration

Changed in this iteration:

- Converted the high-level `Phase J` roadmap into a dedicated sprint execution plan.
- Locked the progression model to include both individual and couple tracks.
- Set couple progression as the primary visible system and individual progression as the secondary layer.
- Expanded first-release scope to include all requested XP earn sources.
- Chose a plan direction that supports highly celebratory milestone moments while keeping the implementation anchored to the existing stats/badge foundation.
- Recorded that adjacent polish is allowed when needed for clean integration.

Files added:

- `P2_PHASE_J_SPRINT_PLAN.md`

Outcome:

- This planning document was approved and used as the implementation source of truth for Phase J.

---

## 13) Implementation Progress Log

### Iteration 1 - Backend progression foundation + first frontend wiring

What changed:

- Added persisted progression snapshots and an idempotent XP event ledger on the backend.
- Added a dedicated progression summary API contract.
- Wired game completion to emit couple progression summary + recent milestone payloads in results.
- Wired profile updates into progression so profile-completion rewards can be recognized.
- Started frontend integration on dashboard, profile, and results with shared progression UI components.

Files touched in this iteration:

- `backend/src/main/java/com/onlyyours/model/UserProgression.java`
- `backend/src/main/java/com/onlyyours/model/CoupleProgression.java`
- `backend/src/main/java/com/onlyyours/model/ProgressionEvent.java`
- `backend/src/main/java/com/onlyyours/repository/UserProgressionRepository.java`
- `backend/src/main/java/com/onlyyours/repository/CoupleProgressionRepository.java`
- `backend/src/main/java/com/onlyyours/repository/ProgressionEventRepository.java`
- `backend/src/main/java/com/onlyyours/dto/ProgressionSnapshotDto.java`
- `backend/src/main/java/com/onlyyours/dto/ProgressionMilestoneDto.java`
- `backend/src/main/java/com/onlyyours/dto/ProgressionSummaryDto.java`
- `backend/src/main/java/com/onlyyours/dto/GameResultsDto.java`
- `backend/src/main/java/com/onlyyours/dto/BadgeDto.java`
- `backend/src/main/java/com/onlyyours/controller/GameQueryController.java`
- `backend/src/main/java/com/onlyyours/controller/UserController.java`
- `backend/src/main/java/com/onlyyours/service/ProgressionService.java`
- `backend/src/main/java/com/onlyyours/service/GameService.java`
- `backend/src/main/resources/db/migration/V13__PhaseJ_Progression_Foundation.sql`
- `OnlyYoursExpo/src/components/ProgressionCard.js`
- `OnlyYoursExpo/src/components/MilestoneHighlights.js`
- `OnlyYoursExpo/src/components/BadgeChip.js`
- `OnlyYoursExpo/src/screens/useDashboardGameFlow.js`
- `OnlyYoursExpo/src/screens/DashboardScreen.js`
- `OnlyYoursExpo/src/screens/ProfileScreen.js`
- `OnlyYoursExpo/src/screens/ResultsScreen.js`

Why this slice was taken first:

- The progression data model and event-idempotency rules are the highest-risk correctness pieces in Phase J.
- Once those contracts are stable, the remaining UI work becomes much safer because screens are rendering a defined summary instead of guessing progression state.

Validation performed so far:

- Focused backend compile + regression slice passed after the first integration round.
- Focused frontend tests for dashboard/profile/results progression wiring passed.

Next implementation target:

- Expand backend tests around progression rules.
- Complete frontend rendering polish across the updated surfaces.
- Run the full automated suite only after the Phase J slice is complete end-to-end.

### Iteration 2 - Validation completion + documentation closeout

What changed:

- Completed Phase J frontend progression surfaces across dashboard, profile, and results.
- Finalized backend progression summaries, milestone payloads, and expanded achievement mapping.
- Ran the full Expo and backend automated suites against the completed Phase J implementation.
- Updated the master implementation plan and manual validation guide so the repo-level documentation matches the validated code state.

Files touched in this iteration:

- `backend/src/test/java/com/onlyyours/service/ProgressionServiceTest.java`
- `backend/src/test/java/com/onlyyours/integration/ProgressionFlowIntegrationTest.java`
- `backend/src/test/java/com/onlyyours/service/GameServiceTest.java`
- `OnlyYoursExpo/src/state/__tests__/useDashboardGameFlow.test.js`
- `OnlyYoursExpo/src/state/__tests__/ProfileScreenFlow.test.js`
- `OnlyYoursExpo/src/screens/__tests__/ResultsScreen.test.js`
- `P2_IMPLEMENTATION_PLAN.md`
- `P2_PHASE_J_SPRINT_PLAN.md`
- `MANUAL_TESTING_GUIDE_SPRINT6.md`

Why this closeout matters:

- A phase is not really complete until the implementation, validation evidence, and the human-readable project tracker all agree.
- This closes the gap between shipped code and project status so future planning starts from the real state of the repo.

Validation completed:

- Full Expo suite passed: `22/22` suites, `97/97` tests.
- Full backend suite passed: `31/31` suites, `155/155` tests, `0` failures, `0` errors, `0` skipped.
- Combined automated coverage passed: `53/53` suites, `252/252` tests.

Residual non-blocking notes:

- Expo tests still emit existing `act(...)` warnings in `AuthContext` tests and some expected error-path console logging.
- Backend tests still emit existing deprecation notes from `JwtService` and `AuthFlowIntegrationTest`.

Next step:

- Wait for manual device and product sign-off when you want to run the deferred Phase J validation checklist.

### Iteration 3 - Post-review hardening and commit-readiness fixes

What changed:

- Filtered shared game-results milestone payloads so only couple-scoped milestones are broadcast in the shared results contract.
- Persisted level-up milestone events so dashboard/profile "recent milestones" can survive reloads instead of only appearing during one request.
- Hardened progression-event idempotency to reserve unique events before applying XP mutations, reducing duplicate-award race risk.
- Added progression-row locking/refetch hardening so concurrent awards do not overwrite each other's XP/state updates as easily.
- Corrected active streak behavior so stale historical play no longer appears as an active current streak after long inactivity.
- Aligned profile progression ordering with the locked product rule: couple progression first, individual progression second.

Files touched in this iteration:

- `backend/src/main/java/com/onlyyours/model/ProgressionEvent.java`
- `backend/src/main/java/com/onlyyours/repository/ProgressionEventRepository.java`
- `backend/src/main/java/com/onlyyours/repository/UserProgressionRepository.java`
- `backend/src/main/java/com/onlyyours/repository/CoupleProgressionRepository.java`
- `backend/src/main/java/com/onlyyours/service/ProgressionService.java`
- `backend/src/test/java/com/onlyyours/service/ProgressionServiceTest.java`
- `backend/src/test/java/com/onlyyours/service/GameServiceTest.java`
- `OnlyYoursExpo/src/screens/DashboardScreen.js`
- `OnlyYoursExpo/src/screens/ProfileScreen.js`
- `P2_PHASE_J_SPRINT_PLAN.md`

Why this hardening pass mattered:

- The first implementation worked functionally, but code review surfaced correctness risks around shared-payload privacy, milestone durability, and idempotent progression awards.
- Closing those gaps before commit makes the phase safer to ship and keeps the progression model aligned with its intended semantics.

Validation completed:

- Focused backend regression slice passed after the hardening fixes.
- Focused frontend regression slice passed after the hierarchy/alignment tweaks.
- Full Expo suite passed: `22/22` suites, `97/97` tests.
- Full backend suite passed: `31/31` suites, `157/157` tests, `0` failures, `0` errors, `0` skipped.
- Combined automated coverage passed: `53/53` suites, `254/254` tests.

Residual non-blocking notes:

- Expo tests still emit existing `act(...)` warnings in `AuthContext` tests and expected error-path console logging in a few negative-path tests.
- Backend tests still emit existing deprecation notes from `JwtService` and `AuthFlowIntegrationTest`.
