# P2 Phase G Sprint Plan - Haptic Feedback System

**Created:** Mar 14, 2026
**Status:** Implemented on Mar 14, 2026; automated validation complete; manual device sign-off pending
**Source of truth:** `P2_IMPLEMENTATION_PLAN.md` -> Phase G (`G1` to `G3`)

---

## 0) Workflow Gate (Mandatory)

This phase follows your required workflow:

- [x] Step 1: In-depth phase planning in a dedicated `.md` with detailed checklists
- [x] Step 2: User approval of this plan
- [x] Step 3: Implementation
- [x] Step 4: In-depth automated validation (unit + integration + regression)
- [x] Step 5: Completion report after all tests pass

Workflow note:
- User approved implementation after the clarification round.
- Implementation and automated validation are complete.
- Manual device validation remains deferred for later product sign-off.

---

## 1) Sprint Goal

Deliver a subtle, centralized, and user-controllable haptic feedback layer for the active Expo app so that:

1. Key app moments feel more tangible without becoming noisy or gimmicky.
2. Haptic behavior is driven by semantic app events, not scattered one-off calls.
3. Users can disable haptics in-app and have that preference persist locally.
4. Unsupported-device and simulator paths degrade safely with no crashes or broken UX.
5. The phase builds on the event taxonomy already established in `Phase F` accessibility work instead of inventing a parallel interaction language.

---

## 2) Locked Product Decisions For This Phase

These decisions are locked for the sprint unless new blocking information appears during implementation.

### G1) Haptic intensity policy

- First release should be **subtle but noticeable**.
- Prefer:
  - light-to-medium confirmation cues,
  - clear but restrained differentiation between success/warning/error moments,
  - slightly stronger feedback for high-salience milestones like round transitions or game completion.
- Explicitly avoid:
  - haptics on every tap,
  - long repetitive buzz patterns,
  - aggressive feedback on routine navigation,
  - treating haptics as a substitute for visible or accessible cues.

### G2) Scope target

- Active target is **`OnlyYoursExpo/` only**.
- Legacy `OnlyYoursApp/` remains out of scope.
- Backend changes are **not required** for this phase.

### G3) Preference ownership

- Haptic preference should be **local-first and device-specific**, not synced through backend profile settings.
- Why:
  - haptics are device capability/comfort dependent,
  - this keeps the phase small and reliable,
  - it matches how other local UX preferences like theme are already handled in Expo.

### G4) Feature boundary

- This phase includes **haptics only**.
- Explicitly out of scope:
  - sound effects,
  - vibration pattern customization,
  - backend preference sync,
  - large settings redesign,
  - broader motion redesign,
  - any new gameplay logic.
- Tiny related polish changes are allowed if they are needed to integrate haptics cleanly and do not expand the feature scope.

### G5) Included first-release event scope

- The first release should include **all currently proposed event categories** from the master plan and this sprint plan.
- This includes:
  - gameplay submit events
  - correct/incorrect guess feedback
  - round transition / game completion
  - invitation sent / invitation accepted
  - unlink / recover actions
  - settings/profile save success
  - error / invalid-action feedback
  - partner code generate / copy / share
- No currently proposed event category is intentionally excluded from Phase G scope.

### G6) Default preference policy

- Haptics should default to **enabled** with in-app opt-out.
- Preference remains **local-only per device/app install**.

### G7) Completion expectation

- Phase G can be considered implementation-complete when:
  - the semantic haptic map is defined,
  - the local preference is persisted and wired into settings,
  - major in-scope runtime events trigger the intended feedback,
  - automated tests cover storage + event mapping + critical integration points,
  - documentation is updated with manual validation guidance.
- Real-device haptic validation is still important, but if deferred again it should be documented honestly instead of being treated as complete sign-off.

---

## 3) Scope and Non-Goals

### In Scope (Phase G)

- Add Expo haptic runtime support in the active client.
- Create a centralized semantic haptic map for approved event categories.
- Add a local persisted haptic preference.
- Add an in-app Settings control for enabling/disabling haptics.
- Wire haptic feedback into key flows already present in the app:
  - invitation send/accept,
  - answer submit,
  - guess submit,
  - correct guess,
  - incorrect guess,
  - round unlock/transition,
  - game completed,
  - invalid action/error,
  - unlink confirmation,
  - relationship recovery,
  - important save/confirm flows where feedback meaningfully helps.
- Add test coverage and documentation for the new behavior.

Clarified scope decisions from user approval round:

- Phase chosen: `Phase G`
- Preference model: local-only per device
- Default: enabled with opt-out
- Included event coverage: all proposed event categories
- Strength target: subtle but noticeable
- Tiny related polish is allowed when needed for clean integration

### Explicit Non-Goals (deferred)

- Full “micro-interaction everywhere” treatment.
- Haptics on ordinary navigation-only taps.
- Per-option haptics during answer selection before submit.
- Custom vibration pattern editor or advanced tuning UI.
- Backend/user-account synced feedback preference.
- Sound effects or animation expansion.
- Legacy client migration.

---

## 4) Baseline and Constraints

### Current baseline (as of end of Phase F)

- The active Expo app already has:
  - stable theme/provider patterns,
  - a broad settings surface,
  - a clear gameplay state layer in `GameContext`,
  - established accessibility event semantics from `Phase F`.
- Relevant runtime surfaces already exist for major semantic moments:
  - category invitation send in `CategorySelectionScreen`
  - invitation accept / realtime failure in `GameContext` and `AuthContext`
  - answer/guess submit in `GameContext`
  - guess result, round transition, and game completion in `GameContext` + `GameScreen`
  - save preferences, unlink, and recover in `SettingsScreen`
  - partner code generate/copy/share in `PartnerLinkScreen`
- There is no current haptic infrastructure:
  - no `expo-haptics` dependency
  - no persisted haptic preference
  - no centralized feedback helper/provider

### Constraints carried into Phase G

- Existing gameplay/auth/settings behavior must not regress.
- The haptic layer must no-op safely on unsupported devices, simulators, and failure cases.
- Settings integration should preserve the current visual/language patterns from `Phase C/E`.
- Haptics should align with accessibility event taxonomy from `Phase F`, not conflict with it.
- This phase should remain frontend-only unless a truly blocking issue is discovered.

---

## 5) Architecture Decisions For Phase G (Proposed)

### G8) Provider-based preference model

- Introduce a small Expo-local `HapticsProvider` and `useHaptics()` hook.
- Why:
  - we need both runtime dispatch and UI preference state,
  - this mirrors the successful local-persistence pattern already used by `ThemeProvider`,
  - it keeps event dispatch testable and avoids prop-drilling.

Proposed provider responsibilities:

- hydrate persisted preference from `AsyncStorage`
- expose `isHapticsEnabled`
- expose `setHapticsEnabled(nextValue)`
- expose semantic dispatch helpers such as `triggerHaptic(eventName)`
- swallow runtime/device errors so the app never breaks because haptics are unavailable

### G9) Semantic-map-first design

- Centralize all event-to-pattern mapping in one place.
- Do not call Expo haptic primitives ad hoc throughout screens.
- Why:
  - consistency,
  - simpler future tuning,
  - easier regression testing,
  - clearer relationship with accessibility announcements already introduced in `Phase F`.

Proposed semantic event families:

- `confirm`
  - invitation sent
  - invitation accepted
  - settings/profile save success
  - partner code generated
  - partner code copied
  - partner code shared
- `submit`
  - answer submitted
  - guess submitted
- `guess`
  - correct guess
  - incorrect guess
- `transition`
  - round 1 complete / round 2 begins
  - results ready / game complete
- `relationship`
  - unlink confirmed
  - relationship recovered
- `error`
  - invalid action
  - failed submit
  - realtime unavailable when action depends on it

### G10) Sparse trigger policy

- Trigger on outcome-bearing events, not raw taps.
- Examples:
  - yes: successful answer submit
  - no: tapping option A/B/C/D before submit
  - yes: correct/incorrect guess reveal
  - no: ordinary scroll, tab, or back navigation

Why:

- this keeps the experience intentional,
- reduces notification fatigue,
- avoids turning repeated gameplay loops into physical noise.

### G11) Local preference strategy

- Store the preference locally in `AsyncStorage` under a dedicated stable key.
- Default should be `enabled`.
- The UI should behave predictably during hydration:
  - if storage has not loaded yet, default visible state should still be safe,
  - dispatch should no-op if provider state is not ready rather than risking flicker or crashes.

### G12) Validation strategy

- Unit-test the semantic map and preference persistence behavior.
- Integration/regression-test the highest-risk event emitters:
  - settings preference toggle
  - gameplay submit/result events
  - unlink/recover flows
- Manual device testing should focus on:
  - enabled behavior,
  - disabled behavior,
  - unsupported/simulator no-op behavior.

---

## 6) Phase G Priority, Effort, and Dependency Board

| Item | Priority | Estimate | Depends on |
|---|---|---|---|
| G1 Haptic design map and preferences | High | 0.75-1 day | Phase F event taxonomy |
| G2 Runtime integration | High | 1.5-2 days | G1 |
| G3 Validation and docs | High | 1 day | G2 |

Dependency notes:

- `G1` should build on the existing accessibility event taxonomy from `Phase F`.
- `G2` depends on `G1` so runtime dispatch stays centralized and tunable.
- `G3` depends on the final event map, otherwise tests/docs will drift immediately.

---

## 7) Detailed Implementation Checklist

Task IDs use `PG-*` format.

### PG-G1 Haptic design map and local preference

#### PG-G1.1 Runtime dependency and local architecture

- [x] Add `expo-haptics` to `OnlyYoursExpo/`.
- [x] Create a small Expo-local haptics module/provider with:
  - persisted preference hydration
  - enabled/disabled state
  - semantic dispatch entry point
  - graceful no-op behavior on runtime/device failures
- [x] Wrap the active app tree with the new provider in the same layer family as existing providers.

Likely files:

- `OnlyYoursExpo/package.json`
- `OnlyYoursExpo/App.js`
- `OnlyYoursExpo/src/haptics/` or `OnlyYoursExpo/src/feedback/`

#### PG-G1.2 Semantic haptic map

- [x] Define the first-release semantic event list.
- [x] Map each approved semantic event to a specific Expo haptic strategy.
- [x] Keep the map intentionally small and documented.
- [x] Ensure every mapped event has a clear reason to exist.

Likely files:

- `OnlyYoursExpo/src/haptics/`
- possible colocated constants/helpers

#### PG-G1.3 Settings preference integration

- [x] Add a Settings control for enabling/disabling haptics.
- [x] Keep wording simple and non-technical.
- [x] Persist the preference locally.
- [x] Ensure toggling the preference does not interfere with theme or notification preference behavior.

Likely files:

- `OnlyYoursExpo/src/screens/SettingsScreen.js`
- new local storage helper/provider files

### PG-G2 Runtime integration

#### PG-G2.1 Gameplay integration

- [x] Trigger semantic feedback for:
  - answer submitted
  - guess submitted
  - correct guess
  - incorrect guess
  - round transition
  - game completion
- [x] Ensure gameplay haptics fire from stable state transitions, not fragile render timing.
- [x] Avoid duplicate firing when the same state is replayed or rehydrated.

Likely files:

- `OnlyYoursExpo/src/state/GameContext.js`
- `OnlyYoursExpo/src/screens/GameScreen.js`
- `OnlyYoursExpo/src/screens/ResultsScreen.js` only if needed for final completion surface

#### PG-G2.2 Invitation, linking, and relationship-control integration

- [x] Trigger semantic feedback for:
  - invitation sent
  - invitation accepted
  - partner code generated
  - partner code copied
  - partner code shared
  - unlink confirmed
  - relationship recovered
- [x] Keep the feedback noticeable but still restrained relative to gameplay/result moments.

Likely files:

- `OnlyYoursExpo/src/screens/CategorySelectionScreen.js`
- `OnlyYoursExpo/src/state/AuthContext.js`
- `OnlyYoursExpo/src/state/GameContext.js`
- `OnlyYoursExpo/src/screens/PartnerLinkScreen.js`
- `OnlyYoursExpo/src/screens/SettingsScreen.js`

#### PG-G2.3 Important save/error flows

- [x] Add haptic feedback for selected high-value non-game actions:
  - save notification preferences success
  - profile save success
  - invalid action / realtime unavailable / failed critical submit
- [x] Keep error feedback limited so it informs without becoming punishing.

Likely files:

- `OnlyYoursExpo/src/screens/SettingsScreen.js`
- `OnlyYoursExpo/src/screens/ProfileScreen.js`
- `OnlyYoursExpo/src/state/GameContext.js`
- possibly auth screens only if a clearly valuable case emerges during implementation

### PG-G3 Validation and documentation

#### PG-G3.1 Automated validation

- [x] Add unit tests for:
  - semantic event mapping
  - local preference persistence/hydration
  - disabled-mode no-op behavior
- [x] Add integration/regression tests for:
  - settings toggle behavior
  - gameplay event dispatch at key state transitions
  - relationship-control triggers if practical and stable
- [x] Run focused frontend suites for touched areas.
- [x] Run full Expo frontend regression in the compliant Node/npm environment.
- [x] Run backend full suite as a safety regression if needed for overall confidence reporting.

Likely test targets:

- `OnlyYoursExpo/src/haptics/__tests__/`
- `OnlyYoursExpo/src/state/__tests__/GameContext.test.js`
- `OnlyYoursExpo/src/state/__tests__/SettingsScreenFlow.test.js`
- `OnlyYoursExpo/src/state/__tests__/ProfileScreenFlow.test.js`

#### PG-G3.2 Manual validation docs

- [x] Update `MANUAL_TESTING_GUIDE_SPRINT6.md` with a dedicated Phase G haptics section.
- [x] Add a manual matrix for:
  - enabled haptics
  - disabled haptics
  - simulator/unsupported-device behavior
  - repeated gameplay-loop sanity check
- [x] Document any intentionally deferred tuning or unsupported-path caveats.

#### PG-G3.3 Completion reporting

- [x] Record which files and surfaces were updated.
- [x] Record which semantic events made the final cut.
- [x] Record what was automatedly validated vs what remains manual.
- [x] Keep completion language truthful if real-device haptic validation is deferred.

---

## 8) Proposed File-Level Target Map

Primary expected implementation targets:

- `OnlyYoursExpo/package.json`
- `OnlyYoursExpo/App.js`
- `OnlyYoursExpo/src/screens/SettingsScreen.js`
- `OnlyYoursExpo/src/state/GameContext.js`
- `OnlyYoursExpo/src/state/AuthContext.js`
- `OnlyYoursExpo/src/screens/CategorySelectionScreen.js`
- `OnlyYoursExpo/src/screens/PartnerLinkScreen.js`
- `OnlyYoursExpo/src/screens/ProfileScreen.js`

Likely new files:

- `OnlyYoursExpo/src/haptics/HapticsProvider.js`
- `OnlyYoursExpo/src/haptics/useHaptics.js`
- `OnlyYoursExpo/src/haptics/index.js`
- `OnlyYoursExpo/src/haptics/constants.js`
- `OnlyYoursExpo/src/haptics/__tests__/...`

Possible exclusions unless implementation proves necessary:

- backend source files
- navigation structure
- theme token system
- notification backend contracts

---

## 9) Validation Plan

### Focused automated validation

- Haptics provider/storage tests
- Settings flow tests
- Game context state-transition tests
- Profile/settings confirmation-flow tests where haptics are added

### Full automated validation

- Expo full Jest regression under repo-supported Node/npm versions
- Backend full test suite as a safety regression if touched files interact with shared contracts indirectly

### Manual validation to prepare for later sign-off

- physical device with haptics enabled
- physical device with haptics disabled
- simulator/emulator path where haptics are unavailable or no-op
- repeated gameplay loop sanity check to ensure feedback is not too frequent

Suggested commands after implementation:

```bash
cd OnlyYoursExpo
npm ci --legacy-peer-deps
npm test -- --runInBand
```

```bash
cd backend
./gradlew test
```

---

## 10) Risks and Mitigations

### Risk 1 - Haptics become noisy or annoying

- Mitigation:
  - semantic-map-first design
  - sparse trigger policy
  - default to subtle patterns
  - avoid per-tap spam

### Risk 2 - Duplicate firing from React rerenders or repeated payload handling

- Mitigation:
  - trigger from stable handlers/effects tied to state transitions
  - avoid render-time dispatch
  - add targeted tests around repeated payload application

### Risk 3 - Unsupported devices or simulator paths throw runtime errors

- Mitigation:
  - wrap Expo haptic calls in safe no-op/error-guard helpers
  - treat capability issues as non-fatal
  - include unsupported-path validation guidance

### Risk 4 - Preference state drifts from runtime behavior

- Mitigation:
  - single provider owns both persistence and dispatch gating
  - test enabled/disabled transitions
  - avoid separate storage reads throughout the app

### Risk 5 - Phase scope balloons into general interaction redesign

- Mitigation:
  - keep this phase locked to haptics only
  - no sound, no motion-system overhaul, no backend sync

---

## 11) Definition of Done

Phase G should be considered done when:

- Haptic feedback exists for the approved major semantic moments.
- Feedback is subtle, centralized, and consistent.
- Users can disable haptics from Settings and that preference persists locally.
- Unsupported-device behavior degrades safely.
- Automated tests cover the core mapping and preference behavior.
- Manual validation instructions are documented for later execution.

---

## 12) This Planning Iteration

Changed in this iteration:

- Created a dedicated implementation-gated sprint plan for `Phase G`.
- Converted the high-level `Phase G` checklist from the master P2 plan into a file-level execution plan.
- Locked the main architectural direction before coding:
  - Expo-only
  - local persisted preference
  - centralized semantic map
  - default enabled with opt-out
  - all proposed event categories included
  - subtle-but-noticeable first-release behavior
- Updated the plan with the user clarification round on Mar 14, 2026.
- Backfilled implementation, validation, and remaining-manual status after Phase G shipped on Mar 14, 2026.

Files added:

- `P2_PHASE_G_SPRINT_PLAN.md`

Next step:

- Manual device validation and product sign-off can be run later using the updated manual guide.

---

## 13) Implementation Outcome (Mar 14, 2026)

### What changed

- Added `expo-haptics` to the active Expo client.
- Added a centralized haptics runtime under `OnlyYoursExpo/src/haptics/`.
- Wrapped the app in `HapticsProvider` from `OnlyYoursExpo/App.js`.
- Added a local `Settings` toggle with persisted preference storage.
- Wired semantic haptic triggers into gameplay, invitation/linking, partner-code, profile, and settings flows.
- Added automated coverage for provider behavior and key integration points.

### Files modified during implementation

- `OnlyYoursExpo/package.json`
- `OnlyYoursExpo/package-lock.json`
- `OnlyYoursExpo/App.js`
- `OnlyYoursExpo/jest.setup.js`
- `OnlyYoursExpo/src/haptics/constants.js`
- `OnlyYoursExpo/src/haptics/HapticsProvider.js`
- `OnlyYoursExpo/src/haptics/useHaptics.js`
- `OnlyYoursExpo/src/haptics/index.js`
- `OnlyYoursExpo/src/haptics/__tests__/HapticsProvider.test.js`
- `OnlyYoursExpo/src/screens/CategorySelectionScreen.js`
- `OnlyYoursExpo/src/screens/PartnerLinkScreen.js`
- `OnlyYoursExpo/src/screens/ProfileScreen.js`
- `OnlyYoursExpo/src/screens/SettingsScreen.js`
- `OnlyYoursExpo/src/state/AuthContext.js`
- `OnlyYoursExpo/src/state/GameContext.js`
- `OnlyYoursExpo/src/state/__tests__/GameContext.test.js`
- `OnlyYoursExpo/src/state/__tests__/ProfileScreenFlow.test.js`
- `OnlyYoursExpo/src/state/__tests__/SettingsScreenFlow.test.js`
- `MANUAL_TESTING_GUIDE_SPRINT6.md`
- `P2_IMPLEMENTATION_PLAN.md`

### Main functions, components, and surfaces touched

- `HapticsProvider`
  - owns local preference hydration, runtime dispatch gating, and safe error swallowing
- `useHaptics`
  - exposes semantic dispatch to feature code
- `GameContext`
  - triggers feedback for submit, result, transition, completion, and invalid/realtime-failure states
- `AuthContext`
  - triggers relationship invitation accept/decline and status-related feedback
- `SettingsScreen`
  - exposes persisted preference control and haptics for save/unlink/recover flows
- `ProfileScreen`
  - adds confirmation/error haptics around profile persistence
- `PartnerLinkScreen`
  - adds generate/copy/share/link feedback
- `CategorySelectionScreen`
  - adds invitation send and error feedback

### Final semantic event coverage

- `INVITATION_SENT`
- `INVITATION_ACCEPTED`
- `ANSWER_SUBMITTED`
- `GUESS_SUBMITTED`
- `GUESS_CORRECT`
- `GUESS_INCORRECT`
- `ROUND_UNLOCKED`
- `GAME_COMPLETED`
- `INVALID_ACTION`
- `ACTION_ERROR`
- `REALTIME_UNAVAILABLE`
- `UNLINK_CONFIRMED`
- `COUPLE_RECOVERED`
- `SETTINGS_SAVED`
- `PROFILE_SAVED`
- `PARTNER_CODE_GENERATED`
- `PARTNER_CODE_COPIED`
- `PARTNER_CODE_SHARED`

### Automated validation completed

- Focused Expo suites:
  - `src/haptics/__tests__/HapticsProvider.test.js`
  - `src/state/__tests__/SettingsScreenFlow.test.js`
  - `src/state/__tests__/ProfileScreenFlow.test.js`
  - `src/state/__tests__/GameContext.test.js`
- Full Expo regression:
  - `npx jest --runInBand`
- Backend safety regression:
  - `./gradlew test`

### Still manual

- Physical-device haptic feel validation with haptics enabled
- Physical-device disabled-mode confirmation
- Unsupported-device/simulator confirmation as part of product sign-off
