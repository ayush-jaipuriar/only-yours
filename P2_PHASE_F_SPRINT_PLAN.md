# P2 Phase F Sprint Plan - Accessibility Baseline Across Primary Flows

**Created:** Mar 11, 2026  
**Status:** Implemented (automated validation in progress; manual screen-reader sign-off pending)  
**Source of truth:** `P2_IMPLEMENTATION_PLAN.md` -> Phase F (`F1` to `F3`)

---

## 0) Workflow Gate (Mandatory)

This phase follows your required workflow:

- [x] Step 1: In-depth phase planning in a dedicated `.md` with detailed checklists
- [x] Step 2: User approval of this plan
- [x] Step 3: Implementation
- [ ] Step 4: In-depth automated validation (unit + integration + regression)
- [ ] Step 5: Completion report after all tests pass

Implementation began only after Step 2 explicit approval.

---

## 1) Sprint Goal

Deliver a practical, testable accessibility baseline for the active Expo app so that:

1. Primary flows are usable with VoiceOver/TalkBack at a baseline level.
2. Interactive controls expose clear labels, roles, and state where needed.
3. Critical dynamic events are announced instead of being only visual.
4. Common focus-order issues and unlabeled-control regressions are removed.
5. The phase improves accessibility without turning into a broad redesign or WCAG-compliance rewrite.

---

## 2) Locked Product Decisions For This Phase

These are locked for the sprint and should not be reconsidered during implementation unless new blocking information appears.

### F1) Accessibility level for this phase

- Phase F is a **baseline screen-reader usability pass**, not a full accessibility certification effort.
- The standard for this sprint is:
  - major controls are discoverable,
  - important state is understandable,
  - essential flows are navigable,
  - critical transitions are announced.
- This phase does **not** promise:
  - full keyboard-only web parity,
  - complete motion/contrast remediation,
  - exhaustive WCAG audit coverage,
  - every possible assistive technology edge case.

### F2) Scope target

- Active target is **`OnlyYoursExpo/` only**.
- Legacy `OnlyYoursApp/` remains out of scope.
- Primary flows in scope:
  - auth
  - onboarding
  - dashboard
  - partner linking
  - category selection
  - gameplay
  - results
  - history
  - profile
  - settings

### F3) Behavior policy

- Accessibility improvements must not change product behavior unless the existing behavior is unusable with a screen reader.
- Prefer:
  - explicit labels,
  - semantic roles,
  - accessible state/value metadata,
  - live announcements for critical transitions,
  - focus management on dialogs/overlays when feasible in React Native.
- Avoid:
  - visual redesign work unrelated to semantics,
  - navigation rewrites,
  - large component architecture churn unless clearly required.

### F4) Completion expectation

- Phase F implementation can be considered complete after:
  - accessibility contract is defined,
  - baseline semantics are applied,
  - automated checks are run where practical,
  - manual screen-reader walkthrough guidance is documented.
- Real-device/manual screen-reader validation is expected for confidence, but if you defer it again we will document that explicitly rather than pretending the phase is fully signed off.

---

## 3) Scope and Non-Goals

### In Scope (Phase F)

- Shared accessibility contract for interactive Expo components.
- Baseline accessibility props across primary screens and shared components:
  - `accessible`
  - `accessibilityLabel`
  - `accessibilityHint`
  - `accessibilityRole`
  - `accessibilityState`
  - `accessibilityValue`
  - `importantForAccessibility`
  - selective `accessibilityLiveRegion` / announcement helpers where supported.
- Decorative-vs-meaningful treatment for emojis, icons, loaders, and banners.
- Screen-reader announcements for critical runtime states:
  - reconnect/disconnect,
  - round transition,
  - guess outcome,
  - results ready,
  - session expired,
  - unlink/recover confirmations,
  - other high-salience alerts already surfaced in-app.
- Focus-order cleanup for:
  - forms,
  - inline banners,
  - modal-like confirmation blocks,
  - loading/error/empty states where semantics are currently missing.
- Documentation updates for manual accessibility verification and known limitations.

### Explicit Non-Goals (deferred)

- Haptic feedback (`Phase G`).
- Deep contrast audits beyond issues directly discovered during screen-reader pass.
- Large-scale copy rewrites unless existing text is ambiguous for accessibility.
- Full accessibility audit for backend-driven content outside current primary screens.
- Web-specific keyboard and ARIA parity beyond what Expo Native paths naturally support.
- Localization, font scaling audit, reduced motion pass, and advanced motor-accessibility improvements unless they become blocking discoveries.

---

## 4) Baseline and Constraints

### Current baseline (as of end of Phase E)

- The app already has a shared theming system and a fairly consistent screen structure in `OnlyYoursExpo/`.
- Phase E recently stabilized visual hierarchy, which matters here because accessibility work is easier after visual surfaces stop shifting.
- There is existing test coverage around:
  - auth flow state,
  - settings/theme flow,
  - dashboard/game-history flow,
  - game state flow,
  - theme/provider behavior.
- Several screens still likely rely on visible text only, without explicit accessibility metadata.
- Dynamic game/reliability states currently appear visually, but not all of them are guaranteed to be announced to assistive tech users.

### Constraints carried into Phase F

- Existing auth/gameplay/settings behavior must not regress.
- Accessibility work should remain compatible with React Native / Expo primitives already in use.
- The repo’s stronger automated confidence is around render/state tests, not dedicated accessibility tooling, so some checks will necessarily be manual or assertion-light.
- Phase F should not absorb `Phase G` haptics or broader UX redesign decisions.

---

## 5) Architecture Decisions For Phase F (Proposed)

### F5) Shared-rule-first rollout

- Define the accessibility contract before mass-editing screens.
- Why:
  - this prevents inconsistent label patterns,
  - reduces drift between similar controls,
  - makes later review faster because each screen follows the same rules.

### F6) Semantic-wrapper preference

- Prefer adding accessibility metadata at the actual touch target or semantic container rather than stacking duplicate labels on nested children.
- Why:
  - screen readers become noisy when both a wrapper and inner text compete for focus,
  - React Native semantics are clearer when one interactive target maps to one spoken target.

### F7) Decorative content policy

- Decorative emoji/art should be hidden from accessibility when they do not add meaning.
- Meaningful status icons/emoji should be reflected in the surrounding label text instead of relying on the visual glyph alone.
- Why:
  - this avoids confusing output like random emoji names being read aloud before the actual content.

### F8) Announcement policy

- Use explicit announcements only for dynamic changes that materially affect user understanding or next action.
- Expected announcement categories:
  - connectivity status changes,
  - round/state transitions in gameplay,
  - success/failure result reveals,
  - destructive confirmation outcomes,
  - session/result readiness.
- Avoid announcing every cosmetic state change.

### F9) Baseline over perfection

- If a screen has a complex custom layout, prioritize:
  1. discoverable controls,
  2. understandable labels,
  3. correct state exposure,
  4. critical announcements,
  5. focus-order cleanup.
- This keeps the phase shippable and prevents paralysis on low-signal edge cases.

---

## 6) Phase F Priority, Effort, and Dependency Board

| Item | Priority | Estimate | Depends on |
|---|---|---|---|
| F1 Shared accessibility contract | High | 0.75-1 day | Phase E visual stabilization |
| F2 Screen-reader baseline pass | High | 2-2.5 days | F1 |
| F3 Validation and docs | High | 1 day | F2 |

Dependency notes:

- `F1` depends on the active Expo shared components being visually stable after `Phase E`.
- `F2` depends on `F1` so labels/hints/states stay consistent across flows.
- `G1` future haptic mapping should respect the same event taxonomy defined for `F` announcements.

---

## 7) Detailed Implementation Checklist

Task IDs use `PF-*` format.

### PF-F1 Shared accessibility contract

#### PF-F1.1 Baseline rule inventory

- [ ] Audit current shared components and primary screens for missing or inconsistent:
  - labels,
  - hints,
  - roles,
  - state/value metadata,
  - decorative-content suppression.
- [ ] Produce a short contract for common UI patterns in Expo:
  - primary/secondary buttons,
  - icon-only buttons,
  - text inputs,
  - list rows/cards,
  - loading blocks,
  - empty/error states,
  - banners,
  - modal-like confirmation surfaces.
- [ ] Decide the preferred announcement mechanism(s) for dynamic runtime state changes in the current stack.

**Files (likely):**

- `OnlyYoursExpo/src/components/`
- `OnlyYoursExpo/src/screens/`
- `OnlyYoursExpo/src/theme/` (only if helper constants are useful)

#### PF-F1.2 Shared helper/util strategy

- [ ] Decide whether to keep this phase prop-only or add a minimal helper utility for repeated accessibility label/announcement patterns.
- [ ] If a helper is introduced, keep it small and local to Expo app scope.
- [ ] Avoid over-abstraction unless repetition is already proven in 3+ places.

**Files (possible):**

- `OnlyYoursExpo/src/components/`
- `OnlyYoursExpo/src/utils/` or `OnlyYoursExpo/src/accessibility/` if needed

#### PF-F1.3 Dynamic announcement map

- [ ] Define which user-visible events require announcements.
- [ ] Define recommended message wording for:
  - reconnecting/disconnected,
  - round 1 complete / round 2 start,
  - guess correct / incorrect,
  - results available,
  - session expired,
  - unlink scheduled / couple restored,
  - code generated / code copied / invalid code where useful.
- [ ] Keep wording short, specific, and action-oriented.

### PF-F2 Screen-reader baseline pass

#### PF-F2.1 Shared component pass

- [ ] Add/adjust baseline accessibility semantics for shared components in active use, including:
  - `AuthFormScreenLayout`
  - `BadgeChip`
  - `EmptyState`
  - `LoadingSpinner`
  - `LoadingScreen`
  - `ReconnectionBanner`
- [ ] Hide decorative-only elements from screen readers where appropriate.
- [ ] Ensure reusable buttons/panels do not create duplicate spoken output.

#### PF-F2.2 Auth + onboarding pass

- [ ] Validate and improve semantics for:
  - `SignInScreen`
  - `SignUpScreen`
  - `ForgotPasswordScreen`
  - `ResetPasswordScreen`
  - `OnboardingScreen`
- [ ] Ensure text inputs expose purpose clearly.
- [ ] Ensure submit buttons expose disabled/loading state clearly.
- [ ] Ensure onboarding pagination/next actions are understandable without visual context alone.

#### PF-F2.3 Dashboard + linking + category pass

- [ ] Validate and improve semantics for:
  - `DashboardScreen`
  - `PartnerLinkScreen`
  - `CategorySelectionScreen`
- [ ] Ensure CTA cards, stats cards, and generated-code actions have meaningful spoken labels.
- [ ] Ensure category cards expose selection state and any sensitive-category warnings clearly.

#### PF-F2.4 Gameplay + results pass

- [ ] Validate and improve semantics for:
  - `GameScreen`
  - `ResultsScreen`
- [ ] Expose question progress, selected answers, disabled submit state, and waiting states clearly.
- [ ] Add or wire announcements for:
  - reconnect/disconnect,
  - invite-pending recovery state,
  - round transition,
  - guess outcome,
  - results ready.
- [ ] Make result-summary surfaces understandable without relying on layout alone.

#### PF-F2.5 History + profile + settings pass

- [ ] Validate and improve semantics for:
  - `GameHistoryScreen`
  - `ProfileScreen`
  - `SettingsScreen`
- [ ] Ensure history cards expose winner/result/date context coherently.
- [ ] Ensure settings toggles/selection controls expose current value/state.
- [ ] Ensure unlink/recover confirmation surfaces read clearly and in usable order.

#### PF-F2.6 Focus and dialog behavior pass

- [ ] Review confirmation and alert-like surfaces for focus/read-order pitfalls.
- [ ] Improve focus order where custom layouts create confusing traversal.
- [ ] Ensure loading/error/empty states do not strand users without spoken context.

### PF-F3 Validation and docs

#### PF-F3.1 Automated validation

- [ ] Add focused test assertions for accessibility props where practical and stable.
- [ ] Prioritize assertions in the highest-risk flows instead of forcing exhaustive snapshot churn.
- [ ] Run focused frontend tests for touched flows.
- [ ] Run full Expo frontend regression after accessibility edits stabilize.

#### PF-F3.2 Manual accessibility walkthrough docs

- [ ] Update `MANUAL_TESTING_GUIDE_SPRINT6.md` with a dedicated Phase F accessibility section.
- [ ] Add a manual walkthrough matrix for:
  - VoiceOver/TalkBack basic navigation,
  - auth form reading order,
  - gameplay state announcements,
  - history/settings semantics,
  - destructive confirmation comprehension.
- [ ] Record known limitations explicitly if any remain after implementation.

#### PF-F3.3 Completion reporting

- [ ] Record what components/screens were updated.
- [ ] Record what announcement behaviors were added.
- [ ] Record what was automatedly validated vs what remains manual.
- [ ] Keep completion language truthful if manual screen-reader runs are deferred.

---

## 8) Validation Strategy

### Automated validation targets

- Focused Jest coverage for screens/hooks/components touched during the pass.
- Render/assertion updates for accessibility props where test stability is acceptable.
- Full Expo frontend regression after focused fixes settle.

### Manual validation targets

- Real-device TalkBack and/or VoiceOver walkthrough across primary flows.
- At minimum, manually verify:
  - auth field order and button announcements,
  - dashboard CTA discoverability,
  - partner-link code generation/copy/connect semantics,
  - gameplay option selection and transition announcements,
  - results comprehension,
  - history card readability,
  - settings toggle/value comprehension,
  - unlink/recovery confirmation clarity.

### Validation note

- Accessibility quality is unusually dependent on real device behavior and assistive-tech output.
- That means automated testing helps catch regressions, but cannot fully replace manual screen-reader walkthroughs.

---

## 9) Risks and Mitigations

### Risk: Duplicate or noisy spoken output

- Cause:
  - nested `accessible` containers,
  - labels on both wrapper and child,
  - decorative emoji/icons being exposed.
- Mitigation:
  - keep one semantic owner per interactive target,
  - hide decorative-only content,
  - test spoken flow on representative screens.

### Risk: Scope explosion into full accessibility overhaul

- Cause:
  - accessibility work naturally reveals many adjacent improvements.
- Mitigation:
  - keep this phase locked to baseline screen-reader usability,
  - defer broader contrast/motion/font-scaling work unless a newly found issue blocks baseline use.

### Risk: Announcement spam

- Cause:
  - overusing live-region or explicit announcements.
- Mitigation:
  - only announce transitions that materially change task state or next action.

### Risk: Test brittleness

- Cause:
  - accessibility prop assertions can become noisy if done too broadly.
- Mitigation:
  - add focused assertions to high-value screens/components first,
  - avoid snapshot-heavy validation for low-signal prop churn.

---

## 10) Acceptance Criteria

Phase F can be reported as complete only after:

- Primary Expo flows are screen-reader usable at a baseline level.
- Core controls are labeled and expose their role/state where needed.
- Critical dynamic state changes are announced clearly.
- Common unlabeled-control and read-order issues are removed from in-scope screens.
- Docs are updated with accessibility validation steps and any remaining limitations.
- Automated validation is completed with reasonable confidence.
- Manual screen-reader validation is either completed or explicitly deferred with rationale.

---

## 11) Recommended Implementation Order

1. Define the shared accessibility contract and event-announcement map.
2. Fix shared components first so screen-level work inherits better defaults.
3. Apply semantics to auth/onboarding and dashboard/linking flows.
4. Tackle gameplay/results next because they have the richest dynamic state.
5. Finish history/profile/settings.
6. Add focused tests, run regression, and update manual validation docs.

Why this order:

- Shared primitives reduce repeated work.
- Static forms/screens are easier to normalize before dynamic gameplay states.
- Gameplay announcements are easier to implement once the general contract is already settled.

---

## 12) Exit State

When this phase is done:

- Screen-reader users can move through the app’s primary flows without depending on visual interpretation alone.
- The game’s important state changes are communicated beyond color, motion, and layout.
- Future phases (`G` haptics and beyond) can build on the same event/state semantics instead of inventing a parallel interaction language.
