# Velvet Midnight Execution Tracker

Version: Draft 1  
Date: March 28, 2026  
Companion Docs:
- [`VELVET_MIDNIGHT_IMPLEMENTATION_SPEC.md`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursApp/stitch%202/VELVET_MIDNIGHT_IMPLEMENTATION_SPEC.md)
- [`VELVET_MIDNIGHT_PHASED_IMPLEMENTATION_PLAN.md`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursApp/stitch%202/VELVET_MIDNIGHT_PHASED_IMPLEMENTATION_PLAN.md)

## How To Use This Tracker

This tracker is the operational version of the phased plan.

Use it to:
- mark implementation progress
- record validation completed per phase
- note docs updated during each iteration
- capture blockers and design decisions while we work

Status convention:
- `[ ]` not started
- `[-]` in progress
- `[x]` completed

---

## Phase 0. Alignment and Guardrails

### Implementation
- [ ] Confirm `stitch 2` is the working design baseline
- [ ] Confirm Velvet Midnight docs are the active source of truth
- [ ] Review Stitch 2 screens for unsupported product features
- [ ] Record the “do not implement” list from Stitch drift
- [ ] Confirm screen mapping against [`AppNavigator.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/navigation/AppNavigator.js)

### Validation
- [ ] Verify all current app screens are accounted for in the spec
- [ ] Verify known missing screens/states are explicitly listed

### Docs
- [ ] Keep [`VELVET_MIDNIGHT_IMPLEMENTATION_SPEC.md`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursApp/stitch%202/VELVET_MIDNIGHT_IMPLEMENTATION_SPEC.md) aligned if scope decisions change
- [ ] Keep [`VELVET_MIDNIGHT_PHASED_IMPLEMENTATION_PLAN.md`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursApp/stitch%202/VELVET_MIDNIGHT_PHASED_IMPLEMENTATION_PLAN.md) aligned if phase sequencing changes

### Notes / Blockers
- Notes:
- Blockers:

---

## Phase 1. Theme and Design Tokens

### Implementation
- [ ] Audit current theme token usage in:
  - [`tokens.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/theme/tokens.js)
  - [`gradients.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/theme/gradients.js)
  - [`ThemeProvider.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/theme/ThemeProvider.js)
- [ ] Replace old palette foundations with Velvet Midnight tokens
- [ ] Add tonal surface hierarchy tokens
- [ ] Add primary CTA gradient tokens
- [ ] Add glow tokens for hero emphasis and progress
- [ ] Update typography tokens for `Newsreader` + `Manrope`
- [ ] Preserve `system`, `light`, and `dark` mode support
- [ ] Normalize text contrast tokens for dark mode
- [ ] Define any new spacing/radius/elevation tokens required by the redesign

### Validation
- [ ] App renders successfully with new theme tokens
- [ ] Existing screens do not crash due to token changes
- [ ] Dark mode matches Velvet Midnight direction
- [ ] Light mode still feels brand-consistent
- [ ] Theme switching still works correctly

### Docs
- [ ] Update design-spec notes if token naming changes materially
- [ ] Record final token decisions in the implementation spec if they differ from Stitch

### Notes / Blockers
- Notes:
- Blockers:

---

## Phase 2. Shared Shell and Core UI Primitives

### Implementation
- [ ] Define browse shell requirements
- [ ] Define focused shell requirements
- [ ] Define auth shell requirements
- [ ] Create reusable top app bar primitive
- [ ] Create reusable bottom nav primitive
- [ ] Create reusable screen container/background primitive
- [ ] Create primary button component
- [ ] Create secondary/ghost/destructive button variants
- [ ] Create branded text input component
- [ ] Create status pill component
- [ ] Create glowing progress bar component
- [ ] Create reusable card primitives:
  - hero card
  - section card
  - stat card
  - option card
- [ ] Create reusable empty/loading/error states if current ones need redesign
- [ ] Refactor any early screens/components needed to prove the primitives work

### Validation
- [ ] Browse shell works with bottom nav and top bar
- [ ] Focused shell works without bottom nav
- [ ] Auth shell supports centered branded forms
- [ ] Shared button/input/card primitives are usable across multiple screens

### Docs
- [ ] Add component names and responsibilities to the spec if they evolve
- [ ] Record any shared-component decisions that differ from the original plan

### Notes / Blockers
- Notes:
- Blockers:

---

## Phase 3. Authentication and Onboarding

### Implementation
- [ ] Rebuild [`SignInScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/SignInScreen.js) using Velvet auth shell
- [ ] Remove unsupported social/alternate login concepts from sign-in redesign
- [ ] Rebuild [`SignUpScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/SignUpScreen.js)
- [ ] Rebuild [`ForgotPasswordScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/ForgotPasswordScreen.js) using auth design language
- [ ] Rebuild [`ResetPasswordScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/ResetPasswordScreen.js) using auth design language
- [ ] Rebuild [`OnboardingScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/OnboardingScreen.js) as a 3-step flow
- [ ] Preserve skip flow and replay onboarding support
- [ ] Ensure onboarding CTAs and progress indicators match the new system

### Validation
- [ ] Sign in works
- [ ] Sign up works
- [ ] Forgot password request works
- [ ] Reset password works
- [ ] Validation and error states are legible and consistent
- [ ] Onboarding shows correct step flow
- [ ] Replay onboarding still works from settings

### Docs
- [ ] Record any auth-state UI decisions made during implementation
- [ ] Update spec if forgot/reset screens introduce new shared auth patterns

### Notes / Blockers
- Notes:
- Blockers:

---

## Phase 4. Dashboard and Core Navigation Surfaces

### Implementation
- [ ] Rebuild [`DashboardScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/DashboardScreen.js) with Velvet browse shell
- [ ] Implement `linked + active game` dashboard state
- [ ] Implement `linked + no active game` dashboard state
- [ ] Implement `not linked yet` dashboard state
- [ ] Restyle progression section
- [ ] Restyle milestone section
- [ ] Restyle stats section
- [ ] Restyle achievements section
- [ ] Restyle dashboard entry-point cards/buttons
- [ ] Finalize bottom nav behavior for browse surfaces

### Validation
- [ ] Active game CTA routes correctly
- [ ] Link with partner CTA routes correctly
- [ ] Start new game CTA routes correctly
- [ ] Dashboard still works with real progression/stats data
- [ ] All three main dashboard states render correctly

### Docs
- [ ] Record any dashboard-state deviations from Stitch 2
- [ ] Update spec if bottom-nav decisions change from plan assumptions

### Notes / Blockers
- Notes:
- Blockers:

---

## Phase 5. Partner Linking and Category Selection

### Implementation
- [ ] Rebuild [`PartnerLinkScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/PartnerLinkScreen.js)
- [ ] Implement focused shell for linking flow
- [ ] Restyle generate/share code state
- [ ] Restyle enter partner code state
- [ ] Implement success / connected state
- [ ] Rebuild [`CategorySelectionScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/CategorySelectionScreen.js)
- [ ] Restyle standard category cards
- [ ] Restyle custom deck featured card
- [ ] Implement custom deck ready state
- [ ] Implement custom deck not-ready state
- [ ] Restyle loading/error/empty states

### Validation
- [ ] Generate code works
- [ ] Copy/share code works
- [ ] Enter/connect flow works
- [ ] Connected success flow works
- [ ] Category selection works for standard categories
- [ ] Category selection handles custom deck readiness correctly

### Docs
- [ ] Record any linking-flow UX adjustments made for real constraints
- [ ] Record any category-state additions needed beyond Stitch 2

### Notes / Blockers
- Notes:
- Blockers:

---

## Phase 6. Gameplay Surfaces

### Implementation
- [ ] Rebuild [`GameScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/GameScreen.js) using focused gameplay shell
- [ ] Implement Round 1 answering UI
- [ ] Implement Round 2 guessing UI
- [ ] Implement waiting-for-partner UI
- [ ] Restyle progress indicator
- [ ] Restyle answer-option cards
- [ ] Restyle fixed action footer
- [ ] Add custom deck badge styling
- [ ] Design in-code invitation pending state
- [ ] Design in-code session refresh state
- [ ] Design in-code reconnect/offline banner state
- [ ] Design in-code partner disconnected/returned state
- [ ] Design in-code expired session state
- [ ] Design in-code results-not-ready state
- [ ] Ensure no bottom nav appears in gameplay

### Validation
- [ ] Round 1 renders correctly
- [ ] Round 2 renders distinctly from Round 1
- [ ] Waiting state feels intentional and clear
- [ ] Invitation pending flow is understandable
- [ ] Reconnect/offline state is calm and usable
- [ ] Expired session state is actionable
- [ ] Existing gameplay behavior still functions correctly

### Docs
- [ ] Record all extra gameplay states designed beyond Stitch 2
- [ ] Update spec if gameplay shell behavior changes during implementation

### Notes / Blockers
- Notes:
- Blockers:

---

## Phase 7. Custom Questions and History

### Implementation
- [ ] Rebuild [`CustomQuestionsScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/CustomQuestionsScreen.js)
- [ ] Rebuild [`CustomQuestionEditorScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/CustomQuestionEditorScreen.js)
- [ ] Rebuild [`GameHistoryScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/GameHistoryScreen.js)
- [ ] Restyle custom-question summary hero
- [ ] Restyle custom-question authored cards
- [ ] Restyle custom-question empty state
- [ ] Restyle editor form and validation states
- [ ] Restyle history filter pills/controls
- [ ] Restyle history cards
- [ ] Restyle history loading/empty/error states

### Validation
- [ ] Custom question create works
- [ ] Custom question edit works
- [ ] Custom question delete works
- [ ] History sort works
- [ ] History winner filters work
- [ ] Empty and error states remain functional

### Docs
- [ ] Record any custom-question or history state deviations from Stitch 2

### Notes / Blockers
- Notes:
- Blockers:

---

## Phase 8. Profile and Settings

### Implementation
- [ ] Rebuild [`ProfileScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/ProfileScreen.js)
- [ ] Remove unsupported profile concepts such as journal archives
- [ ] Preserve real profile actions:
  - edit profile
  - settings
  - sign out
  - progression
  - achievements
- [ ] Rebuild [`SettingsScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/SettingsScreen.js)
- [ ] Remove unsupported settings concepts:
  - secret key
  - export shared data
  - chat history references
  - unsupported retention promises
- [ ] Restyle theme controls
- [ ] Restyle haptics controls
- [ ] Restyle notification preferences
- [ ] Restyle relationship controls
- [ ] Restyle unlink flow
- [ ] Restyle recover previous partner flow
- [ ] Restyle replay onboarding action

### Validation
- [ ] Profile data still renders correctly
- [ ] Edit profile still works
- [ ] Settings preferences still persist
- [ ] Unlink flow still works
- [ ] Recover previous partner flow still works
- [ ] Sign out still works

### Docs
- [ ] Record every unsupported Stitch feature removed from profile/settings
- [ ] Update spec if any control-grouping changes are made for usability

### Notes / Blockers
- Notes:
- Blockers:

---

## Phase 9. Results and Missing States

### Implementation
- [ ] Design and implement [`ResultsScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/ResultsScreen.js) in Velvet Midnight style
- [ ] Implement celebratory results hero
- [ ] Implement player score cards
- [ ] Implement milestones/progression section
- [ ] Implement share-result CTA styling
- [ ] Implement play-again/dashboard exit actions
- [ ] Design in-code results loading state
- [ ] Design in-code results unavailable/error state
- [ ] Add forgot-password success/error styling if still incomplete
- [ ] Add reset-password success/error styling if still incomplete
- [ ] Add unlink confirmation panel styling if still incomplete
- [ ] Add recover partner state styling if still incomplete

### Validation
- [ ] Results render correctly with real data
- [ ] Play again works
- [ ] Back to dashboard works
- [ ] Share result action still works
- [ ] Results fallback state is understandable

### Docs
- [ ] Add notes for results design decisions since Stitch 2 has no dedicated export
- [ ] Update master spec with the implemented results direction

### Notes / Blockers
- Notes:
- Blockers:

---

## Phase 10. QA, Refinement, and Documentation Closure

### Implementation
- [ ] Run frontend test suite
- [ ] Fix regressions introduced by redesign
- [ ] Run cross-screen visual consistency pass
- [ ] Check dark/light/system mode behavior
- [ ] Check browse-shell vs focused-shell consistency
- [ ] Polish spacing, hierarchy, and text contrast issues
- [ ] Remove any obsolete styling or dead components left from previous system

### Validation
- [ ] Manual auth pass
- [ ] Manual onboarding pass
- [ ] Manual dashboard-state pass
- [ ] Manual linking pass
- [ ] Manual category-selection pass
- [ ] Manual gameplay pass
- [ ] Manual custom-question pass
- [ ] Manual history pass
- [ ] Manual profile pass
- [ ] Manual settings pass
- [ ] Manual results pass
- [ ] Light/dark/system visual QA complete

### Docs
- [ ] Update implementation spec with final deltas
- [ ] Update phased plan if execution diverged materially
- [ ] Add a short completion summary once overhaul reaches stable baseline

### Notes / Blockers
- Notes:
- Blockers:

---

## Cross-Phase Backend/API Watchlist

Use this section to track any real backend/API touchpoints discovered during implementation.

- [ ] Auth payload review needed
- [ ] Dashboard stats/progression payload review needed
- [ ] Active session summary payload review needed
- [ ] Category/custom-deck readiness payload review needed
- [ ] Custom-question payload review needed
- [ ] Notification preferences payload review needed
- [ ] Relationship unlink/recover payload review needed
- [ ] Results/progression payload review needed

Notes:

---

## Global Risks

- [ ] Theme token migration breaks older components unexpectedly
- [ ] Shared shell abstraction becomes too rigid for special-case screens
- [ ] Gameplay UI refactor accidentally affects session flow behavior
- [ ] Stitch-inspired visuals introduce unsupported product assumptions
- [ ] Missing states get deferred too long and create visual inconsistency

Mitigations:
- keep docs updated while implementing
- validate each phase before moving on
- prefer shared primitives over screen-specific styling duplication

---

## Progress Summary

Current active phase:

Overall notes:

Next recommended task:

