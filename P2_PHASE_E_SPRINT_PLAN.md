# P2 Phase E Sprint Plan - Dark Mode Completion and Cross-Theme Visual Polish

**Created:** Mar 11, 2026  
**Status:** Implemented (automated validation complete; manual visual sign-off pending)  
**Source of truth:** `P2_IMPLEMENTATION_PLAN.md` -> Phase E (`E1` to `E4`)

---

## 0) Workflow Gate (Mandatory)

This phase follows your required workflow:

- [x] Step 1: In-depth phase planning in a dedicated `.md` with detailed checklists
- [x] Step 2: User approval of this plan
- [x] Step 3: Implementation
- [x] Step 4: In-depth automated validation (unit + integration + regression)
- [x] Step 5: Completion report after all tests pass

Implementation began only after Step 2 explicit approval.

---

## 1) Sprint Goal

Deliver a premium-quality dark mode across the active Expo app so that:

1. Dark mode feels intentional, romantic, and visually richer than simple light/dark parity.
2. All primary screens share a coherent "Warm Luxe" visual direction.
3. Shared surfaces and reusable components stop leaking light-biased styling into dark mode.
4. Theme switching (`system` / `light` / `dark`) remains stable and persistent.
5. The app is visually cleaner in both themes where Phase E exposes cross-theme inconsistencies.

---

## 2) Locked Product Decisions For This Phase

These are locked for the sprint and should not be reconsidered during implementation unless new blocking information appears.

### D1) Dark-mode visual direction

- Direction: **Warm Luxe**
- Visual character:
  - deep wine / rose / plum evening surfaces,
  - premium romantic ambiance,
  - softer glows and highlights,
  - richer depth separation between background, cards, overlays, and celebratory surfaces.
- Explicitly avoid:
  - flat token-parity dark mode,
  - neon/cyberpunk styling,
  - harsh near-black cinematic contrast,
  - muddy low-contrast gray-on-gray surfaces.

### D2) Scope policy for light mode

- Phase E is primarily a dark-mode completion phase.
- However, **broader polish is allowed** where dark-mode redesign reveals inconsistencies in shared components or cross-theme parity.
- Allowed light-mode work:
  - token cleanup,
  - shared-surface parity fixes,
  - component-level refinements required to keep both themes coherent.
- Not allowed:
  - unrelated UX redesign,
  - navigation changes,
  - feature expansion outside the visual/theming layer.

### D3) Phase completion expectation

- Phase E implementation can be considered complete after:
  - code is implemented,
  - docs are updated,
  - automated validation is complete,
  - confidence is high.
- Final **manual visual QA remains explicitly deferred** for later user-run validation.
- Therefore completion language for this phase must be:
  - "implemented and automatedly validated; manual visual sign-off pending."

### D4) Frontend target

- Active target is **`OnlyYoursExpo/` only**.
- Legacy `OnlyYoursApp/` is out of scope for this phase.

---

## 3) Scope and Non-Goals

### In Scope (Phase E)

- Theme token expansion beyond baseline parity.
- Dark-specific semantic treatment for:
  - cards,
  - overlays,
  - banners,
  - gradients,
  - celebratory states,
  - form surfaces.
- Dark-mode redesign pass for all primary Expo screens:
  - auth,
  - onboarding,
  - dashboard,
  - partner link,
  - category selection,
  - game,
  - results,
  - history,
  - profile,
  - settings.
- Shared component cleanup for dark-mode correctness:
  - badges,
  - empty states,
  - loading states,
  - reconnect banners,
  - shared layout containers,
  - modal/panel-like surfaces.
- Focused regression coverage for theme switching and critical screen rendering.
- Documentation updates for deferred manual visual QA.

### Explicit Non-Goals (deferred)

- Accessibility semantics and screen-reader work (`Phase F`).
- Haptic feedback (`Phase G`).
- Custom questions (`Phase H`).
- Sharing cards (`Phase I`).
- XP / levels / expanded progression (`Phase J`).
- Secret manager and rollback work (`Phase K`).
- Backend API changes.
- Navigation architecture changes.
- New gameplay or notification behavior.

---

## 4) Baseline and Constraints

### Current baseline (as of end of Phase D)

- A theme foundation already exists in:
  - `OnlyYoursExpo/src/theme/tokens.js`
  - `OnlyYoursExpo/src/theme/gradients.js`
  - `OnlyYoursExpo/src/theme/ThemeProvider.js`
  - `OnlyYoursExpo/src/theme/useTheme.js`
- Theme preference support is already implemented:
  - `system`
  - `light`
  - `dark`
- Most priority Expo screens already consume `useTheme()` and read from `theme.colors.*`.
- Phase C introduced baseline dark-mode support, but it is still closer to token parity than a premium redesign.

### Verified gaps in the current implementation

- Current dark palette is relatively flat and underspecified for richer surface hierarchy.
- Some reusable surfaces still contain hardcoded, light-biased values, for example:
  - `OnlyYoursExpo/src/components/BadgeChip.js`
  - `OnlyYoursExpo/src/components/ReconnectionBanner.js`
  - result badge background mappings in `OnlyYoursExpo/src/screens/GameHistoryScreen.js`
- Current gradients are still sparse and light-biased for premium dark usage:
  - `OnlyYoursExpo/src/theme/gradients.js`
- Current shadows/elevation treatment is generic and not tuned for dark ambience.
- The app needs dark-specific treatment for:
  - form fields,
  - elevated cards,
  - banners and reliability UI,
  - success/warning/error emphasis,
  - celebratory and badge surfaces.

### Constraints carried into Phase E

- Existing gameplay/auth/settings behavior must not regress.
- Theme switching contract must remain stable and persistent.
- Frontend test confidence is currently lower than backend confidence because local toolchain mismatch was previously observed:
  - repo declares Node `>=24 <25`
  - repo declares npm `>=11 <12`
- Manual visual QA is intentionally deferred by user.

---

## 5) Architecture Decisions For Phase E (Proposed)

### D5) Semantic-token-first migration

- Extend the token system first before doing broad screen polish.
- Move from mostly flat color roles into clearer semantic surface roles.
- Prefer semantic roles such as:
  - `backgroundBase`,
  - `backgroundElevated`,
  - `surfaceCard`,
  - `surfacePanel`,
  - `surfaceInput`,
  - `overlayScrim`,
  - `bannerWarning`,
  - `bannerDanger`,
  - `celebrationSurface`,
  - `badgeSurface`,
  - `badgeBorder`,
  - `focusRing`,
  - `glowPrimary`,
  - `glowAccent`.
- Preserve backward compatibility during migration by either:
  - keeping existing color aliases temporarily, or
  - migrating all in-scope consumers in the same implementation wave.

### D6) Warm Luxe surface hierarchy

- Dark mode must communicate depth clearly through layered surfaces.
- Surface stack should distinguish:
  - app background,
  - muted background sections,
  - standard cards,
  - elevated/high-emphasis cards,
  - overlays/modals,
  - celebratory surfaces.
- Form controls should feel intentional in dark mode, not like lightly inverted light-mode inputs.

### D7) Dark gradients and glow policy

- Use richer gradients sparingly and intentionally.
- Gradients should be reserved for:
  - hero / premium emphasis,
  - celebratory states,
  - selective badge or CTA accents.
- All gradient usage must have solid fallback values defined in tokens.
- Avoid turning every screen into a full-gradient canvas.

### D8) Cross-theme parity policy

- Shared components must render coherently in both light and dark modes.
- If a shared component requires structural styling cleanup to support dark mode, that cleanup should be applied for both themes in the same phase.
- Do not leave the codebase in a half-tokenized state where dark mode uses new semantics and light mode still depends on unrelated hardcoded values.

### D9) Validation strategy

- Keep backend regression optional and safety-oriented only.
- Frontend validation should focus on:
  - theme resolution logic,
  - theme persistence,
  - screen rendering in dark mode,
  - shared component styling invariants,
  - settings theme toggle behavior.
- Manual visual QA remains deferred, but documentation for it must be prepared now.

---

## 6) Phase E Priority, Effort, and Dependency Board

| Item | Priority | Estimate | Depends on |
| --- | --- | --- | --- |
| E1 Dark token expansion | Critical | 1-1.5 days | Phase C foundation |
| E2 Screen-level redesign pass | Critical | 2-3 days | E1 |
| E3 Visual QA and regression hardening | High | 1-1.5 days | E2 |
| E4 Documentation and acceptance closure | High | 0.5-1 day | E3 |

---

## 7) Dependency Map

### Cross-phase dependencies

- `E1` depends on Phase C theme/provider foundation being stable.
- `E2` depends on Phase C responsive rollout and Phase D settings/profile surfaces already being in place.
- `F1/F2` accessibility work should build on the final visual structure from `E2`, not the pre-Phase-E state.
- `I2` future share-card visual system should inherit brand direction from Phase E.

### Intra-phase dependencies

- `PE-E1.*` must complete before major screen-level redesign work.
- `PE-E2.1` shared components should begin before `PE-E2.2` to reduce duplicate styling decisions.
- `PE-E3.*` validates all new token and redesign work before docs are finalized.
- `PE-E4.*` is not complete until deferred manual-signoff language is recorded clearly.

---

## 8) Detailed Implementation Backlog

Task IDs use `PE-*` format.

### Track E1 - Dark Token Expansion

#### PE-E1.1 Theme semantic role audit

- [x] Audit the current theme token surface and list where flat roles are insufficient for premium dark mode.
- [x] Identify all remaining hardcoded light-biased values in active Expo shared components and priority screens.
- [x] Define the migration strategy for:
  - compatibility aliases,
  - full consumer migration,
  - token naming boundaries.

**Files (target):**

- `OnlyYoursExpo/src/theme/tokens.js`
- `OnlyYoursExpo/src/theme/gradients.js`
- `OnlyYoursExpo/src/components/`
- `OnlyYoursExpo/src/screens/`

#### PE-E1.2 Semantic dark token expansion

- [x] Add richer semantic roles for dark mode:
  - background layers,
  - card/panel tiers,
  - form/input surfaces,
  - overlay/scrim values,
  - banner and reliability surfaces,
  - celebratory/badge surfaces,
  - glow and emphasis accents.
- [x] Add matching light-theme parity roles where needed so shared components remain coherent.
- [x] Keep existing `system` / `light` / `dark` resolution intact.

**Files (target):**

- `OnlyYoursExpo/src/theme/tokens.js`
- `OnlyYoursExpo/src/theme/ThemeProvider.js` (only if value shape must expand)

#### PE-E1.3 Gradient and shadow refinement

- [x] Expand gradient tokens for dark-mode emphasis surfaces.
- [x] Add dark-appropriate elevation / shadow / glow semantics.
- [x] Define safe fallback solids for every new gradient-driven surface.

**Files (target):**

- `OnlyYoursExpo/src/theme/gradients.js`
- `OnlyYoursExpo/src/theme/tokens.js`

#### PE-E1.4 Consumer migration guardrails

- [x] Decide and implement how old tokens map to new roles during migration.
- [x] Prevent mixed-theme drift by ensuring in-scope components all use the same semantic layer.
- [x] Remove or isolate temporary compatibility aliases if they are no longer needed by the end of the phase.

**Files (target):**

- `OnlyYoursExpo/src/theme/`
- in-scope shared components and screens

---

### Track E2 - Screen-Level Redesign Pass

#### PE-E2.1 Shared component dark-mode redesign

- [x] Refine shared surfaces first:
  - `BadgeChip`
  - `AuthFormScreenLayout`
  - `EmptyState`
  - `LoadingSpinner`
  - `ReconnectionBanner`
  - any shared button/panel wrappers in active use.
- [x] Remove hardcoded light-biased backgrounds, borders, and banner colors.
- [x] Ensure shared components look premium in dark mode and remain coherent in light mode.

**Files (target):**

- `OnlyYoursExpo/src/components/BadgeChip.js`
- `OnlyYoursExpo/src/components/AuthFormScreenLayout.js`
- `OnlyYoursExpo/src/components/EmptyState.js`
- `OnlyYoursExpo/src/components/LoadingSpinner.js`
- `OnlyYoursExpo/src/components/ReconnectionBanner.js`

#### PE-E2.2 Auth + onboarding surface pass

- [x] Redesign dark mode for:
  - `SignInScreen`
  - `SignUpScreen`
  - `ForgotPasswordScreen`
  - `ResetPasswordScreen`
  - `OnboardingScreen`
- [x] Improve form-surface hierarchy, text contrast, and primary/secondary CTA emphasis.
- [x] Keep auth readability and keyboard-safe layouts intact.

**Files (target):**

- `OnlyYoursExpo/src/screens/SignInScreen.js`
- `OnlyYoursExpo/src/screens/SignUpScreen.js`
- `OnlyYoursExpo/src/screens/ForgotPasswordScreen.js`
- `OnlyYoursExpo/src/screens/ResetPasswordScreen.js`
- `OnlyYoursExpo/src/screens/OnboardingScreen.js`

Progress note (current iteration):

- `AuthFormScreenLayout` and auth form token styling were upgraded as the shared foundation for auth surfaces.
- `OnboardingScreen` received a first-pass Warm Luxe card/hero polish and dark-mode-aware gradient fallback.

#### PE-E2.3 Dashboard + linking + category pass

- [x] Redesign dark mode for:
  - `DashboardScreen`
  - `PartnerLinkScreen`
  - `CategorySelectionScreen`
- [x] Improve hero/CTA emphasis, card depth, and category/warning treatments.
- [x] Ensure history and game entry points remain visually clear at a glance.

**Files (target):**

- `OnlyYoursExpo/src/screens/DashboardScreen.js`
- `OnlyYoursExpo/src/screens/PartnerLinkScreen.js`
- `OnlyYoursExpo/src/screens/CategorySelectionScreen.js`

Progress note (current iteration):

- `DashboardScreen` and `PartnerLinkScreen` have received an initial Phase E redesign pass.

#### PE-E2.4 Gameplay + results pass

- [x] Redesign dark mode for:
  - `GameScreen`
  - `ResultsScreen`
- [x] Improve answer option contrast, round-state emphasis, waiting/reconnect surfaces, and results celebration treatment.
- [x] Ensure both gameplay clarity and emotional payoff improve in dark mode.

**Files (target):**

- `OnlyYoursExpo/src/screens/GameScreen.js`
- `OnlyYoursExpo/src/screens/ResultsScreen.js`

Progress note (completion):

- `GameScreen` and `ResultsScreen` were fully completed for the Phase E pass, including dynamic themed surfaces for choice states, result overlays, and celebration hierarchy.
- Follow-up hardening moved `GameScreen` theme memoization above all early-return branches so loading, invitation-pending, transition, and result-overlay states keep valid hook order and no longer risk runtime crashes.

#### PE-E2.5 History + profile + settings pass

- [x] Redesign dark mode for:
  - `GameHistoryScreen`
  - `ProfileScreen`
  - `SettingsScreen`
- [x] Replace current hardcoded history result badge backgrounds with semantic theme roles.
- [x] Make profile/settings surfaces feel premium and more cohesive with the Warm Luxe direction.

**Files (target):**

- `OnlyYoursExpo/src/screens/GameHistoryScreen.js`
- `OnlyYoursExpo/src/screens/ProfileScreen.js`
- `OnlyYoursExpo/src/screens/SettingsScreen.js`

Progress note (completion):

- `GameHistoryScreen`, `ProfileScreen`, and `SettingsScreen` were brought onto the updated surface system, with semantic history-result treatments and stronger cross-theme polish.

#### PE-E2.6 Cross-theme parity cleanup

- [x] Apply shared-component cleanup in light mode where dark-mode redesign revealed mismatch.
- [x] Verify that token usage is coherent and no critical screen still relies on ad hoc visual styling.
- [x] Keep the broader polish bounded to visual consistency work only.

**Files (target):**

- in-scope shared components and screens above

---

### Track E3 - Visual QA and Regression Hardening

#### PE-E3.1 Theme switching regression coverage

- [x] Validate existing automated coverage for:
  - theme hydration,
  - explicit mode switching,
  - resolved-mode behavior,
  - settings screen theme selection flow.
- [x] Use existing theme/settings coverage as the Phase E regression baseline for dark-mode changes.

**Files (target):**

- `OnlyYoursExpo/src/theme/__tests__/ThemeProvider.test.js`
- `OnlyYoursExpo/src/state/__tests__/SettingsScreenFlow.test.js`
- additional component/screen tests as needed

#### PE-E3.2 Priority screen render sanity coverage

- [x] Validate high-risk screen flows with focused existing regression suites covering:
  - auth,
  - dashboard,
  - game,
  - results,
  - history,
  - settings.
- [x] Verify critical text, CTA, and state surfaces render without test regressions in the affected flows.

**Files (target):**

- frontend test files under `OnlyYoursExpo/src/**/__tests__/`

#### PE-E3.3 Automated confidence validation

- [x] Run focused frontend suites tied to:
  - theme/provider,
  - settings flow,
  - dashboard/history flow,
  - auth flow,
  - gameplay/result screens where affected.
- [x] Run full frontend regression in a compliant Node/npm environment.
- [x] Run backend full suite as a safety regression if needed for overall confidence reporting.

**Validation command targets:**

- `OnlyYoursExpo/` Jest focused suites
- `OnlyYoursExpo/` full Jest suite
- `backend/` `./gradlew test` safety regression

---

### Track E4 - Documentation and Acceptance Closure

#### PE-E4.1 Manual guide update

- [x] Update the manual testing guide with:
  - dark-mode acceptance criteria,
  - visual evidence capture guidance,
  - required screen list for later QA.
- [x] Explicitly document `system`, `light`, and `dark` verification expectations.

**Files (target):**

- `MANUAL_TESTING_GUIDE_SPRINT6.md`

#### PE-E4.2 Deferred sign-off documentation

- [x] Record that manual visual QA is deferred by user and remains pending after implementation.
- [x] Document any intentionally deferred dark-only polish items, if any remain after implementation.
- [x] Add a final parity checklist note before future accessibility work begins.

**Files (target):**

- `P2_PHASE_E_SPRINT_PLAN.md`
- `P2_IMPLEMENTATION_PLAN.md` (only after implementation, if completion notes are added)
- optional project status docs if touched later

#### PE-E4.3 Completion note and evidence summary

- [x] Record final automated validation results.
- [x] Summarize changed screen groups and shared components.
- [x] State whether the phase is:
  - implementation complete,
  - automated validation complete,
  - manual sign-off pending.

**Files (target):**

- `P2_PHASE_E_SPRINT_PLAN.md`

---

## 9) Validation Strategy

### Automated validation (required before reporting completion)

- Theme/provider tests:
  - stored preference hydration
  - `system` mode resolution
  - explicit `light` / `dark` persistence
- Shared component render sanity:
  - badge chip
  - empty state
  - loading spinner
  - reconnect banner
  - auth layout
- Screen-level focused tests for priority surfaces affected by redesign
- Full frontend regression suite in Node 24 / npm 11 environment
- Backend full-suite safety regression if needed for confidence

### Manual validation (prepared now, executed later by user)

- Verify `system`, `light`, and `dark` behavior on phone and tablet
- Verify no unreadable text, clipped text, or inconsistent surfaces
- Verify dark-mode visual hierarchy on:
  - auth
  - dashboard
  - game
  - results
  - history
  - profile
  - settings
- Verify shared surfaces:
  - badges
  - banners
  - empty states
  - loading states
  - form controls

### Completion rule for this phase

- Phase E can be reported as complete only after:
  - implementation is finished,
  - automated validation is complete,
  - documentation is updated,
  - confidence is high.
- Final manual visual sign-off remains pending and must be called out explicitly.

---

## 10) Risks and Mitigations

### Risk 1 - Theme-token sprawl or mixed abstraction levels

- **Risk:** New semantic tokens are introduced, but old ad hoc values remain scattered across the app.
- **Mitigation:** Audit hardcoded values first, migrate shared surfaces first, and use semantic roles consistently before screen polish.

### Risk 2 - Premium dark mode hurts contrast or clarity

- **Risk:** Warmer/luxury styling can drift into lower readability if contrast is not watched carefully.
- **Mitigation:** Keep contrast checks built into focused render reviews and later manual QA guidance.

### Risk 3 - Broader polish becomes an unbounded redesign

- **Risk:** Allowing light-mode cleanup could accidentally turn Phase E into a full visual overhaul.
- **Mitigation:** Restrict broader polish to parity fixes and shared-component cleanup only; no unrelated structure or feature changes.

### Risk 4 - Frontend validation remains unreliable locally

- **Risk:** Theme work lands without trustworthy frontend regression confidence.
- **Mitigation:** Use the repo-declared Node/npm versions during automated validation and document exact commands/results.

---

## 11) Definition of Done

Phase E is considered done when:

- Dark mode feels intentionally premium and aligned with the Warm Luxe direction.
- Shared surfaces no longer leak obvious light-biased styling into dark mode.
- All primary Expo screens in scope have completed the dark redesign pass.
- Theme switching remains stable and persistent for `system`, `light`, and `dark`.
- Automated validation passes with strong confidence.
- Manual visual QA remains pending by explicit user deferral and is documented for later execution.

---

## 12) Completion Notes

### Final implementation status

Phase E is implementation-complete for the active Expo app and has passed automated validation. Manual visual sign-off is still pending because it was intentionally deferred for later device testing.

### What changed

- Theme semantics were expanded in `OnlyYoursExpo/src/theme/tokens.js` and `OnlyYoursExpo/src/theme/gradients.js` to support richer Warm Luxe surface hierarchy across light and dark mode.
- Shared visual primitives were upgraded in:
  - `OnlyYoursExpo/src/components/AuthFormScreenLayout.js`
  - `OnlyYoursExpo/src/components/BadgeChip.js`
  - `OnlyYoursExpo/src/components/EmptyState.js`
  - `OnlyYoursExpo/src/components/LoadingScreen.js`
  - `OnlyYoursExpo/src/components/LoadingSpinner.js`
  - `OnlyYoursExpo/src/components/ReconnectionBanner.js`
- Screen-level Phase E polish was completed in:
  - `OnlyYoursExpo/src/screens/OnboardingScreen.js`
  - `OnlyYoursExpo/src/screens/DashboardScreen.js`
  - `OnlyYoursExpo/src/screens/PartnerLinkScreen.js`
  - `OnlyYoursExpo/src/screens/CategorySelectionScreen.js`
  - `OnlyYoursExpo/src/screens/GameScreen.js`
  - `OnlyYoursExpo/src/screens/ResultsScreen.js`
  - `OnlyYoursExpo/src/screens/GameHistoryScreen.js`
  - `OnlyYoursExpo/src/screens/ProfileScreen.js`
  - `OnlyYoursExpo/src/screens/SettingsScreen.js`
- Auth-form styling was strengthened through `OnlyYoursExpo/src/theme/createAuthFormStyles.js`, which gives the auth screens upgraded field, button, and contrast behavior without changing auth flow behavior.

### Automated validation evidence

The following validation was completed after implementation:

- Frontend syntax/parse validation for modified files using `@babel/parser`
- Focused frontend Jest suites in `OnlyYoursExpo/` under Node 24:
  - `src/theme/__tests__/ThemeProvider.test.js`
  - `src/state/__tests__/SettingsScreenFlow.test.js`
  - `src/state/__tests__/useDashboardGameFlow.test.js`
  - `src/state/__tests__/useGameHistoryFlow.test.js`
  - `src/state/__tests__/AuthContext.test.js`
- Full frontend Jest regression in `OnlyYoursExpo/` under Node 24 / CI mode:
  - `12` test suites passed
  - `66` tests passed
- Backend safety regression:
  - `backend/./gradlew test` passed successfully

### Deferred items

- Manual visual QA across real devices for `system`, `light`, and `dark` modes remains pending by choice and is documented in `MANUAL_TESTING_GUIDE_SPRINT6.md`.
- No backend API changes were made in this phase.
- Documentation is updated with later manual visual QA steps.
- Any remaining manual visual sign-off is clearly marked as pending, not silently omitted.
