# P2 Phase I Sprint Plan - Branded Sharing (Results, Milestones, and Progression Cards)

**Created:** Mar 14, 2026
**Status:** Implemented in code; automated validation passed; manual device sharing sign-off pending
**Source of truth:** `P2_IMPLEMENTATION_PLAN.md` -> Phase I (`I1` to `I4`)

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

Deliver a first-release sharing system that lets users export highly branded image cards for:

1. game results,
2. milestone and achievement unlocks,
3. level-up moments,
4. streak moments,
5. achievements collection snapshots,
6. couple progression snapshots.

This phase is successful when:

1. sharing feels intentional and premium rather than generic,
2. the exported output is image-card based only,
3. raw answers, sensitive question text, and per-question breakdowns are never leaked,
4. names and scores can appear where approved,
5. sharing works on an individual basis without partner-consent gating,
6. the system is built in a way that can expand later without redoing the contract.

---

## 2) Locked Product Decisions For This Phase

These decisions are locked from your clarification round unless a blocking implementation issue appears.

### I1) Phase choice

- The next implementation phase is `Phase I - Branded Sharing`.

### I2) First-release shareable moments

The first release should support all of these:

- game results,
- milestone and achievement unlocks,
- level-ups,
- streak moments,
- achievements collection,
- couple progression snapshot.

Practical implication:

- This should not be implemented as a single hardcoded result-only share button.
- We need a reusable share-card system with a small set of card types.

### I3) Share format

- Sharing should be **image/share-card based only**.
- No text-only share flow is required in this release.

Implementation implication:

- The app should generate a branded visual asset and share that asset through the native share surface.
- The output should still be understandable if preview text is unavailable.

### I4) Privacy and allowed details

- For result sharing:
  - names are allowed,
  - scores are allowed.
- Even with that allowance, the following should still remain excluded by default:
  - raw answers,
  - sensitive question text,
  - per-question answer breakdowns,
  - hidden/private couple-only question content.

This keeps the phase aligned with the older "privacy-safe" goal while honoring your decision to allow names and scores.

### I5) Consent model

- Sharing is allowed on an **individual basis**.
- There is **no per-share approval flow** and no shared-settings consent gate in this release.

Practical implication:

- If a user sees an approved share card in their app, they can share it directly.
- We do not need backend coordination or partner approval state for this phase.

### I6) Visual direction

- Share cards should be **highly branded and expressive**.

That should mean:

- strong layout identity,
- obvious "Only Yours" emotional tone,
- celebration-driven composition,
- polished typography/color treatment,
- screenshottable output that feels special.

### I7) Scope boundary

- Adjacent polish is allowed if needed for clean integration.

Allowed examples:

- adding a better milestone reveal surface if that is required for a clean share entry point,
- small result/progression UI refinements to support card generation consistency,
- shared utility abstractions for image rendering/capture.

Not allowed:

- unrelated social/community features,
- public feed/profile discovery,
- broad backend social graph work.

---

## 3) Current Codebase Reality We Must Build On

Understanding the current system matters because Phase I should extend the actual repo state, not a hypothetical product.

What already exists:

- `Phase J` now provides progression snapshots and milestone metadata on the backend.
- The active app already surfaces progression in:
  - `Dashboard`,
  - `Profile`,
  - `Results`.
- The Expo app already uses the native share sheet once in `PartnerLinkScreen`, but only for sharing a partner code.

What does **not** exist yet:

- no result-share cards,
- no milestone-share cards,
- no image-card generator,
- no image capture/share pipeline,
- no sharing-specific tests or manual guide section for result/milestone sharing.

Important architecture implication:

- We should reuse the Phase J data contracts where possible instead of inventing duplicate sharing payloads.
- The share system should transform existing result/progression data into card-ready view models.

---

## 4) Architecture Decisions For Phase I (Proposed)

### I8) Share-card generation should be frontend-owned

Proposed decision:

- Generate share cards in the Expo app from already-available API payloads.

Why:

- The branded output is primarily a presentation concern.
- The data already exists in current frontend surfaces.
- This avoids backend image generation complexity for the first release.

Tradeoff:

- We must ensure the frontend card-view-model contract is explicit and tested.

### I9) Use reusable card templates, not screen screenshots

Proposed decision:

- Build dedicated reusable share-card components instead of capturing live screen sections directly.

Why:

- Real screen sections contain controls, layout noise, and state not meant for sharing.
- A dedicated card component lets us control privacy, branding, and consistency.

Tradeoff:

- Slightly more upfront UI work,
- but much safer and easier to test.

### I10) Render hidden card -> capture image -> invoke native share

Proposed decision:

- Use dedicated share-card components rendered in an off-screen or temporary capture surface.
- Capture them as an image.
- Share the resulting image through the native share flow.

Likely tooling path:

- add `react-native-view-shot` for capture,
- add `expo-sharing` for image-file sharing,
- use Expo file handling only as needed to persist the captured asset briefly.

Why this is the cleanest path:

- it fits the image-only requirement,
- it works with branded layouts,
- it avoids server-side rendering complexity.

### I11) Keep share content model explicit and type-based

Proposed decision:

- Create a small internal set of share-card types:
  - `RESULT`,
  - `MILESTONE`,
  - `LEVEL_UP`,
  - `STREAK`,
  - `ACHIEVEMENTS_SUMMARY`,
  - `COUPLE_PROGRESSION`.

Why:

- Different moments need different compositions,
- but we still want one share system rather than scattered one-off code.

### I12) Individual share permission, couple-safe content rules

Proposed decision:

- Any user can share the cards their client can generate,
- but content eligibility must still be explicit.

Meaning:

- couple result cards can include allowed names/scores,
- milestone cards should only share milestone-safe text,
- no private custom-question text or hidden gameplay internals should appear.

This is the key product boundary for this phase.

---

## 5) Detailed Scope Breakdown

### I1) Shareable content contract

Objectives:

- define the share-card types,
- define approved fields per type,
- define what is explicitly forbidden,
- map current data sources into share-card view models.

Checklist:

- [x] Define card types for:
  - results,
  - milestone/achievement unlocks,
  - level-ups,
  - streaks,
  - achievement collection summary,
  - couple progression summary
- [x] Lock approved fields for result cards:
  - player names,
  - total/combined score,
  - summary message,
  - couple progression summary if desired
- [x] Lock approved fields for milestone/progression cards:
  - milestone title,
  - short description,
  - level/streak/progression values,
  - achievement counts where relevant
- [x] Explicitly exclude:
  - raw answers,
  - per-question breakdowns,
  - sensitive/custom question text,
  - hidden partner-only authored content
- [x] Define a small share-card view-model layer in the app so rendering does not depend directly on raw API objects

### I2) Share-card rendering and UX

Objectives:

- create expressive branded cards,
- keep them visually consistent,
- make them robust to partial data.

Checklist:

- [x] Create shared visual direction for share cards:
  - typography,
  - backgrounds,
  - color system,
  - celebratory accents,
  - compact metadata layout
- [x] Build reusable card components for the approved share types
- [x] Ensure cards render correctly in both light and dark theme contexts if theme is relevant
- [x] Add resilient loading/failure handling if card preparation or capture fails
- [x] Keep the share UI understandable:
  - clear share CTA labels,
  - clear “what will be shared” expectations,
  - no accidental extra content in the exported image

### I3) Native share flow integration

Objectives:

- let users actually export the image cards from the right surfaces.

Checklist:

- [x] Add result-card share entry point from `ResultsScreen`
- [x] Add milestone/level-up/streak share entry points from `Dashboard` and/or `Profile` where the surfaced data makes sense
- [x] Add achievement collection / couple progression share entry points if the UX stays clean
- [x] Capture dedicated card surfaces to image files
- [x] Launch native image sharing from the generated asset
- [x] Handle unsupported/failure states gracefully:
  - capture failure,
  - share unavailable,
  - missing card data

### I4) Validation and docs

Objectives:

- prove the share model works,
- document how to validate it safely.

Checklist:

- [x] Add automated tests for share-card view-model generation
- [x] Add automated tests for share CTA visibility/behavior in updated surfaces
- [x] Add regression coverage so current results/progression screens still behave normally if sharing is unavailable
- [x] Update `P2_IMPLEMENTATION_PLAN.md`
- [x] Update this sprint document during implementation
- [x] Add a new manual validation section to `MANUAL_TESTING_GUIDE_SPRINT6.md` covering:
  - content safety,
  - image correctness,
  - native share invocation,
  - failure fallback behavior

---

## 6) Likely Files To Touch

Backend:

- likely none or minimal, unless a tiny contract extension is needed after inspection

Frontend likely:

- `OnlyYoursExpo/package.json`
- `OnlyYoursExpo/src/screens/ResultsScreen.js`
- `OnlyYoursExpo/src/screens/DashboardScreen.js`
- `OnlyYoursExpo/src/screens/ProfileScreen.js`
- new share-related components/utilities under something like:
  - `OnlyYoursExpo/src/sharing/`
  - `OnlyYoursExpo/src/components/share/`

Tests likely:

- results screen tests
- dashboard/profile flow tests
- new sharing utility/component tests

Docs:

- `P2_IMPLEMENTATION_PLAN.md`
- `P2_PHASE_I_SPRINT_PLAN.md`
- `MANUAL_TESTING_GUIDE_SPRINT6.md`

---

## 7) Risks And Mitigations

### Risk 1: share cards accidentally leak too much gameplay detail

Mitigation:

- explicit allowed-field contract,
- dedicated card components instead of screen screenshots,
- test coverage around card-view-model generation.

### Risk 2: image generation is flaky on device

Mitigation:

- choose one clear capture path,
- add user-visible failure fallback messaging,
- validate on real device during manual pass.

### Risk 3: highly branded cards drift away from app visual language

Mitigation:

- build on current tokens, gradients, badge/progression semantics,
- keep one shared share-card design language rather than per-screen improvisation.

### Risk 4: too many share entry points create clutter

Mitigation:

- prioritize:
  - results,
  - milestone highlights,
  - couple progression,
- add other entry points only if the UX stays clean.

---

## 8) Definition Of Done

Phase I should be considered done when:

- result sharing works via branded image card,
- milestone/progression sharing works via branded image card,
- image capture and native sharing are reliable in the supported local app flow,
- no forbidden gameplay details leak into shared output,
- automated tests cover the share-card logic and entry-point regressions,
- manual validation steps are documented for later sign-off.

---

## 9) Recommended Implementation Order

1. Build the share-card content contract and card-view-model layer first.
2. Build the reusable branded share-card components.
3. Add image capture + native share pipeline.
4. Wire the results entry point first.
5. Add dashboard/profile milestone and progression entry points.
6. Run automated validation.
7. Update docs and prepare the manual validation checklist.

This order matters because content safety and card structure should stabilize before we scatter share buttons across the app.

---

## 10) Approval Checklist

This plan is ready for approval if you agree that:

- sharing is image-card only,
- names and scores are allowed in result cards,
- no partner-consent gate is required,
- all listed sharing moments are in scope,
- the first implementation should be frontend-owned and card-template based,
- adjacent polish is acceptable where needed for clean integration.

---

## 11) Implementation Closeout (Mar 14, 2026)

### What was implemented

- Added a dedicated frontend sharing layer under `OnlyYoursExpo/src/sharing/` with:
  - explicit share-card view models,
  - a branded reusable card canvas,
  - a capture/share composer hook,
  - share-type-specific builders for results, milestones, progression, and achievement snapshots.
- Added image-card sharing entry points to:
  - `ResultsScreen`,
  - `DashboardScreen`,
  - `ProfileScreen`.
- Added native image-sharing dependencies:
  - `expo-sharing`,
  - `react-native-view-shot`.
- Added automated coverage for:
  - share-card model generation,
  - result share invocation behavior,
  - profile share CTA visibility,
  - regression safety on existing dashboard/profile/result flows.

### Files touched in implementation

- `OnlyYoursExpo/package.json`
- `OnlyYoursExpo/package-lock.json`
- `OnlyYoursExpo/jest.setup.js`
- `OnlyYoursExpo/src/screens/ResultsScreen.js`
- `OnlyYoursExpo/src/screens/DashboardScreen.js`
- `OnlyYoursExpo/src/screens/ProfileScreen.js`
- `OnlyYoursExpo/src/screens/__tests__/ResultsScreen.test.js`
- `OnlyYoursExpo/src/state/__tests__/ProfileScreenFlow.test.js`
- `OnlyYoursExpo/src/sharing/shareCardModels.js`
- `OnlyYoursExpo/src/sharing/ShareCardCanvas.js`
- `OnlyYoursExpo/src/sharing/useShareCardComposer.js`
- `OnlyYoursExpo/src/sharing/index.js`
- `OnlyYoursExpo/src/sharing/__tests__/shareCardModels.test.js`
- `P2_IMPLEMENTATION_PLAN.md`
- `MANUAL_TESTING_GUIDE_SPRINT6.md`

### Why this shape was chosen

- Dedicated share cards are safer than screen screenshots because they explicitly whitelist what can appear in the exported image.
- Frontend-owned rendering keeps this first release fast to iterate on because the branded output is presentation-heavy and built from data already present in current screens.
- A reusable composer hook prevents sharing logic from being duplicated across results, dashboard, and profile flows.

### Automated validation run

- Expo full suite: `23/23` suites passed, `102/102` tests passed
- Backend full suite: `31/31` suites passed, `157/157` tests passed
- Combined total: `54/54` suites passed, `259/259` tests passed

### Remaining work outside this implementation closeout

- Manual device validation for native share-sheet behavior is still deferred.
- Real-device review should confirm:
  - capture output quality,
  - share-sheet availability,
  - platform-specific behavior,
  - final visual polish on exported images.
