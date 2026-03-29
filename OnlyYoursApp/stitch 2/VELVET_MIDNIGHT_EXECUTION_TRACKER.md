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
- [x] Confirm `stitch 2` is the working design baseline
- [x] Confirm Velvet Midnight docs are the active source of truth
- [x] Review Stitch 2 screens for unsupported product features
- [x] Record the “do not implement” list from Stitch drift
- [x] Confirm screen mapping against [`AppNavigator.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/navigation/AppNavigator.js)

### Validation
- [x] Verify all current app screens are accounted for in the spec
- [x] Verify known missing screens/states are explicitly listed

### Docs
- [x] Keep [`VELVET_MIDNIGHT_IMPLEMENTATION_SPEC.md`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursApp/stitch%202/VELVET_MIDNIGHT_IMPLEMENTATION_SPEC.md) aligned if scope decisions change
- [x] Keep [`VELVET_MIDNIGHT_PHASED_IMPLEMENTATION_PLAN.md`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursApp/stitch%202/VELVET_MIDNIGHT_PHASED_IMPLEMENTATION_PLAN.md) aligned if phase sequencing changes

### Notes / Blockers
- Notes: `stitch 2` is now the approved working baseline; unsupported Stitch drift has been documented in the spec and phased plan.
- Blockers:

---

## Phase 1. Theme and Design Tokens

### Implementation
- [x] Audit current theme token usage in:
  - [`tokens.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/theme/tokens.js)
  - [`gradients.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/theme/gradients.js)
  - [`ThemeProvider.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/theme/ThemeProvider.js)
- [x] Replace old palette foundations with Velvet Midnight tokens
- [x] Add tonal surface hierarchy tokens
- [x] Add primary CTA gradient tokens
- [x] Add glow tokens for hero emphasis and progress
- [x] Update typography tokens for `Newsreader` + `Manrope`
- [x] Preserve `system`, `light`, and `dark` mode support
- [x] Normalize text contrast tokens for dark mode
- [x] Define any new spacing/radius/elevation tokens required by the redesign

### Validation
- [x] App renders successfully with new theme tokens
- [x] Existing screens do not crash due to token changes
- [ ] Dark mode matches Velvet Midnight direction
- [ ] Light mode still feels brand-consistent
- [x] Theme switching still works correctly

### Docs
- [ ] Update design-spec notes if token naming changes materially
- [ ] Record final token decisions in the implementation spec if they differ from Stitch

### Notes / Blockers
- Notes: Token names were intentionally preserved to avoid breaking existing screens while swapping the underlying palette and surface hierarchy to Velvet Midnight. A later polish pass further deepened the light-mode blush/plum surfaces, strengthened ambient glow tokens, and adjusted the light-mode gradient set so browse/auth shells no longer read like near-white utility screens. Targeted Jest validation passed for auth, gameplay, theme-provider, category-selection, and custom-question screen slices after the token swap.
- Blockers: No known functional blockers remain in the token layer. The remaining closure work is visual: dark/light/system consistency, browse-shell vs focused-shell cohesion, and deciding whether light mode should move even closer to the darker Velvet Midnight hero treatment.

---

## Phase 2. Shared Shell and Core UI Primitives

### Implementation
- [x] Define browse shell requirements
- [x] Define focused shell requirements
- [x] Define auth shell requirements
- [x] Create reusable top app bar primitive
- [x] Create reusable bottom nav primitive
- [x] Create reusable screen container/background primitive
- [x] Create primary button component
- [x] Create secondary/ghost/destructive button variants
- [x] Create branded text input component
- [x] Create status pill component
- [x] Create glowing progress bar component
- [x] Create reusable card primitives:
  - hero card
  - section card
  - stat card
  - option card
- [x] Create reusable empty/loading/error states if current ones need redesign
- [x] Refactor any early screens/components needed to prove the primitives work

### Validation
- [x] Browse shell works with bottom nav and top bar
- [x] Focused shell works without bottom nav
- [x] Auth shell supports centered branded forms
- [x] Shared button/input/card primitives are usable across multiple screens

### Docs
- [x] Add component names and responsibilities to the spec if they evolve
- [x] Record any shared-component decisions that differ from the original plan

### Notes / Blockers
- Notes: Added first-pass Velvet primitives under `src/components/velvet/`: `VelvetAtmosphere`, `VelvetSurfaceCard`, `VelvetPrimaryButton`, `VelvetSecondaryButton`, `VelvetStatusPill`, `VelvetProgressBar`, `VelvetTopBar`, `VelvetBottomNav`, and `VelvetTextField`. We now also have higher-level screen containers in `VelvetScreen`, `VelvetScrollScreen`, and `VelvetFocusedScreen`, plus a reusable `VelvetBrowseLayout` that owns browse-surface bottom-nav and top-bar behavior. `AuthFormScreenLayout`, `EmptyState`, and `LoadingSpinner` consume the new primitives. `DashboardScreen`, `GameHistoryScreen`, `CustomQuestionsScreen`, and `ProfileScreen` now share the browse-layout wrapper, and native stack headers are suppressed for those browse destinations so the Velvet shell is the single visible header source. Safe-area ownership is now explicit: browse layouts own top/left/right framing when the in-screen browse header is hidden, `VelvetTopBar` owns top inset when browse screens opt into it, and `VelvetBottomNav` owns bottom inset. Focused shell rollout is now proven on `PartnerLinkScreen`, `CategorySelectionScreen`, and `CustomQuestionEditorScreen`, with native stack headers suppressed there as well. Added reusable card families: `VelvetHeroCard`, `VelvetSectionCard`, `VelvetStatCard`, and `VelvetOptionCard`, and adopted them in dashboard/custom-questions/category-selection flows. A later polish pass also simplified the browse-shell contract further: the redundant top browse header was removed from the main tabs, bottom-nav icons were enlarged for phone and tablet, and high-visibility browse copy was tightened so Home/History/Custom/Profile feel less text-heavy in runtime. Jest validation passed for the shared-shell and card-adoption slice: `SignInScreen`, `SignUpScreen`, `ForgotPasswordScreen`, `ResetPasswordScreen`, `CategorySelectionScreen`, `CustomQuestionEditorScreen`, `CustomQuestionsScreen`, `GameScreen`, `useDashboardGameFlow`, `ProfileScreenFlow`, and `useGameHistoryFlow`.
- Blockers: None for Phase 2. Remaining screen-level migrations now belong to later phases.

---

## Phase 3. Authentication and Onboarding

### Implementation
- [x] Rebuild [`SignInScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/SignInScreen.js) using Velvet auth shell
- [x] Remove unsupported social/alternate login concepts from sign-in redesign
- [x] Rebuild [`SignUpScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/SignUpScreen.js)
- [x] Rebuild [`ForgotPasswordScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/ForgotPasswordScreen.js) using auth design language
- [x] Rebuild [`ResetPasswordScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/ResetPasswordScreen.js) using auth design language
- [x] Rebuild [`OnboardingScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/OnboardingScreen.js) as a 3-step flow
- [x] Preserve skip flow and replay onboarding support
- [x] Ensure onboarding CTAs and progress indicators match the new system

### Validation
- [x] Sign in works
- [x] Sign up works
- [x] Forgot password request works
- [x] Reset password works
- [x] Validation and error states are legible and consistent
- [x] Onboarding shows correct step flow
- [x] Replay onboarding still works from settings

### Docs
- [x] Record any auth-state UI decisions made during implementation
- [x] Update spec if forgot/reset screens introduce new shared auth patterns

### Notes / Blockers
- Notes: The auth stack now uses the stable Velvet Midnight primitive layer rather than raw `TextInput` and ad-hoc buttons. `SignInScreen`, `SignUpScreen`, `ForgotPasswordScreen`, and `ResetPasswordScreen` all retain their existing API contracts and validation logic, but now share a stronger content pattern: editorial eyebrow + title hierarchy, `VelvetTextField` inputs, primary CTA through `VelvetPrimaryButton`, calmer secondary navigation, and inline error/success message cards rather than plain text-only feedback. The sign-in redesign explicitly keeps only real product actions and does not introduce any social or alternate login concepts. A follow-up polish pass also added more intentional helper/meta copy, stronger secondary-button treatment where appropriate, and autofill/autocomplete hints so the forms feel better in real use. Onboarding has now been rebuilt into a true 3-step Velvet Midnight story flow with step-specific emotional framing, stronger visual anchors, explicit progress treatment, optional back navigation, and preserved skip/completion behavior. Jest validation passed for `SignInScreen`, `SignUpScreen`, `ForgotPasswordScreen`, `ResetPasswordScreen`, `OnboardingScreenFlow`, and `SettingsScreenFlow`. A later hardware auth check also confirmed the live `Sign Out` path returns to the redesigned sign-in surface cleanly. This runtime pass fixed the replay-onboarding bug in code by making onboarding replay state-driven at the app-shell level instead of issuing a leaf-screen `navigation.replace('Onboarding')`. The same pass also removed the misleading global `No connection` banner from signed-out auth screens and confirmed on real tablet hardware that tapping `Replay Onboarding` now lands on `STEP 1 OF 3` as intended. A fresh manual sign-in on tablet with the disposable linked account (`vmtablet1774771274@example.com`) now also re-enters the real linked dashboard successfully, which closes the core sign-in validation path.
- Blockers: adb text entry is still unreliable on the connected devices, so future auth automation should not depend on blind `input text` for email/password certification. Manual on-device typing is currently the trustworthy path for auth validation.

---

## Phase 4. Dashboard and Core Navigation Surfaces

### Implementation
- [x] Rebuild [`DashboardScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/DashboardScreen.js) with Velvet browse shell
- [x] Implement `linked + active game` dashboard state
- [x] Implement `linked + no active game` dashboard state
- [x] Implement `not linked yet` dashboard state
- [x] Restyle progression section
- [x] Restyle milestone section
- [x] Restyle stats section
- [x] Restyle achievements section
- [x] Restyle dashboard entry-point cards/buttons
- [x] Finalize bottom nav behavior for browse surfaces

### Validation
- [x] Active game CTA routes correctly
- [x] Link with partner CTA routes correctly
- [x] Start new game CTA routes correctly
- [x] Dashboard still works with real progression/stats data
- [x] All three main dashboard states render correctly
- [x] Latest-results recovery hero renders when a completed session snapshot exists

### Docs
- [x] Record any dashboard-state deviations from Stitch 2
- [x] Update spec if bottom-nav decisions change from plan assumptions

### Notes / Blockers
- Notes: `DashboardScreen` now uses a state-driven Velvet Midnight structure instead of a mostly linear utility stack. The screen keeps the existing `useDashboardGameFlow` contract and navigation behavior, but reorganizes the content into a stronger browse-home shape: editorial greeting, stateful hero (`active game`, `ready to start`, `not linked`), progression as a richer narrative section, a bento-style celebration area, denser stats lower in the scroll, and achievements with clearer section framing. The implementation now consumes more of the shared primitive layer directly: `VelvetPrimaryButton`, `VelvetSecondaryButton`, `VelvetStatusPill`, and `VelvetProgressBar` alongside the existing browse shell and card primitives. A later polish pass also removed the redundant `Custom Questions`, `Game History`, and `Profile` cards from the dashboard because those destinations already live in the persistent footer tabs; Home now focuses more clearly on continuation, starting a game, and progression rather than duplicating tab navigation. Automated validation now covers both halves of the dashboard contract: `DashboardScreen.test.js` verifies the three main screen states plus their primary CTAs, and `useDashboardGameFlow.test.js` continues to cover the underlying data/loading behavior. Neighboring browse-surface flow tests (`ProfileScreenFlow`, `useGameHistoryFlow`) also remain green after the redesign. This runtime pass revalidated the `not linked` to `linked + no active game` transition using disposable real accounts on phone and tablet: after linking the pair through the real backend, both devices cold-launched back into the `Ready to Begin` dashboard hero, and `Start New Game` routed correctly into `CategorySelection` on tablet. We then advanced the same real session into `INVITED` and Round 1. After force-stopping the phone mid-session, the app cold-launched back into the correct `ACTIVE SESSION` dashboard hero (`ROUND1 • QUESTION 1/8`), and `Continue Game` routed back into the same live question screen. A later recovery pass extended the hero model with a persisted `results_ready` state backed by `latest_completed_session_v1`, so a just-finished session can now be surfaced from dashboard instead of disappearing on relaunch. Phone runtime verification using a seeded completed-session snapshot confirmed the new `Results ready` hero renders correctly, and the CTA row was moved above the metadata block so the action appears earlier on smaller screens.
- Blockers: The active-session recovery matrix is now materially closed for both in-progress and post-completion dashboard continuity. The remaining dashboard polish work is visual rather than behavioral, especially around how soft light-mode browse surfaces should remain compared with the darker hero mode.

---

## Phase 5. Partner Linking and Category Selection

### Implementation
- [x] Rebuild [`PartnerLinkScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/PartnerLinkScreen.js)
- [x] Implement focused shell for linking flow
- [x] Restyle generate/share code state
- [x] Restyle enter partner code state
- [x] Implement success / connected state
- [x] Rebuild [`CategorySelectionScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/CategorySelectionScreen.js)
- [x] Restyle standard category cards
- [x] Restyle custom deck featured card
- [x] Implement custom deck ready state
- [x] Implement custom deck not-ready state
- [x] Restyle loading/error/empty states

### Validation
- [x] Generate code works
- [x] Copy/share code works
- [x] Enter/connect flow works
- [x] Connected success flow works
- [x] Category selection works for standard categories
- [x] Category selection handles custom deck readiness correctly

### Docs
- [x] Record any linking-flow UX adjustments made for real constraints
- [x] Record any category-state additions needed beyond Stitch 2

### Notes / Blockers
- Notes: `PartnerLinkScreen` now uses the focused Velvet Midnight shell and has been reframed as a true two-step transactional flow: editorial intro, generated-code hero, explicit enter-their-code panel, and a calmer explanatory helper card. The previous success alert has been replaced with an in-screen connected state that gives the user a clean next choice between starting the first game and returning to the dashboard. `CategorySelectionScreen` has also been rebuilt around clearer hierarchy: a stronger intro, a featured custom-deck hero, a standard-category section with better readiness/invite status treatment, and a helper panel that explains the role of authored custom prompts. The new design keeps all prior behavior contracts intact: custom-deck readiness gating, sensitive-content confirmation, invite-in-flight locking, WebSocket invite sending, and existing loading/error/empty fallbacks. Hardware review on the paired tablet now confirms the linked `no active game` dashboard state routes cleanly into `CategorySelection`, the custom-deck not-ready message reads clearly, and selecting a standard category transitions into the real invitation-pending gameplay surface. Device-level partner-linking validation is now also complete on tablet: generating a code produced a large readable code block, tapping `Copy Code` updated the button to `Copied!`, and tapping `Share Code` opened the native Android share sheet and handed off into a real Gmail compose target.
- Blockers: None currently blocking Phase 5. The native share payload is integration-proven through Android chooser handoff, though third-party target apps may still present the shared text differently once they receive it.

---

## Phase 6. Gameplay Surfaces

### Implementation
- [x] Rebuild [`GameScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/GameScreen.js) using focused gameplay shell
- [x] Implement Round 1 answering UI
- [x] Implement Round 2 guessing UI
- [x] Implement waiting-for-partner UI
- [x] Restyle progress indicator
- [x] Restyle answer-option cards
- [x] Restyle fixed action footer
- [x] Add custom deck badge styling
- [x] Design in-code invitation pending state
- [x] Design in-code session refresh state
- [x] Design in-code reconnect/offline banner state
- [x] Design in-code partner disconnected/returned state
- [x] Design in-code expired session state
- [x] Design in-code results-not-ready state
- [x] Ensure no bottom nav appears in gameplay

### Validation
- [x] Round 1 renders correctly
- [x] Round 2 renders distinctly from Round 1
- [x] Waiting state feels intentional and clear
- [x] Invitation pending flow is understandable
- [x] Reconnect/offline state is calm and usable
- [x] Expired session state is actionable
- [x] Existing gameplay behavior still functions correctly
- [x] Results reveal works on real devices

### Docs
- [x] Record all extra gameplay states designed beyond Stitch 2
- [x] Update spec if gameplay shell behavior changes during implementation

### Notes / Blockers
- Notes: `GameScreen` now uses a focused Velvet Midnight gameplay shell rather than a generic stacked utility layout. The implementation preserves the full `useGame()` state machine and result navigation, but re-frames each real state with stronger hierarchy: minimal top bar, cinematic question hero, explicit Round 2 prompt, stronger option selection treatment, calmer waiting panels, and a more intentional action footer. We also hid the native stack header for the `Game` route so the custom gameplay top bar is now the single visible header source. The redesign now covers the live states we truly receive today: loading, invitation pending, Round 1 answering, Round 2 guessing, submission feedback, waiting for partner with review list, round transition, realtime reconnect banner treatment via `wsConnectionState`, partner disconnected / returned notices, and an explicit expired-session takeover state. The gameplay context now translates `PARTNER_LEFT`, `PARTNER_RETURNED`, and `SESSION_EXPIRED` payloads into screen state directly, and hydration now also treats `410` responses from `/current-question` as an expired-session surface instead of dropping back to a generic loader. Automated validation now includes direct gameplay tests for loading, custom-question badge rendering, Round 2 guessing, waiting review state, invitation-pending state, reconnect-banner treatment, partner-left notice rendering, expired-session rendering, and targeted `GameContext` coverage for the new status payload handling. Manual Android runtime verification now includes both a phone and a tablet authenticated as the live paired account. On hardware we confirmed: the invite modal appears route-appropriately on phone while the inviter sees the invitation-pending screen on tablet, accepting the invite moves both devices into the same Round 1 question, and after choosing an option and submitting, both devices advance from Question 1 to Question 2 as expected. We then pushed the same real session all the way through the later-phase recovery matrix: both devices reached Round 2, a phone force-stop during Round 2 recovered into the `ACTIVE SESSION` dashboard hero at `ROUND2 • QUESTION 6/8`, `Continue Game` restored the live guess screen, the faster phone finished Round 2 and landed on the dedicated waiting state with submitted-guess review intact, and a hard relaunch from that waiting state came back through the dashboard active-session hero before `Continue Game` restored the waiting screen again. Finally, when the slower tablet submitted its last guess, the phone transitioned automatically from waiting into shared results on-device.
- Blockers: The earlier Question 3 vs Question 2 observation is no longer treated as a gameplay defect. Repo validation and backend service tests confirm Round 1 is intentionally asynchronous per user: each player advances through their own next unanswered question without per-question partner blocking, and `Continue Game` should restore the next unanswered question for that specific user. Two-device runtime behavior matched that model. The STOMP dev-runtime escalation has been hardened in code and no longer redboxes in the reproduced phone flow. The one remaining nuance after the full invite-through-results pass is post-completion continuity: after the results screen has already been reached, a hard relaunch returns the user to the normal linked dashboard instead of preserving the just-finished results context.

---

## Phase 7. Custom Questions and History

### Implementation
- [x] Rebuild [`CustomQuestionsScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/CustomQuestionsScreen.js)
- [x] Rebuild [`CustomQuestionEditorScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/CustomQuestionEditorScreen.js)
- [x] Rebuild [`GameHistoryScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/GameHistoryScreen.js)
- [x] Restyle custom-question summary hero
- [x] Restyle custom-question authored cards
- [x] Restyle custom-question empty state
- [x] Restyle editor form and validation states
- [x] Restyle history filter pills/controls
- [x] Restyle history cards
- [x] Restyle history loading/empty/error states

### Validation
- [x] Custom question create works
- [x] Custom question edit works
- [x] Custom question delete works
- [x] History sort works
- [x] History winner filters work
- [x] Empty and error states remain functional

### Docs
- [x] Record any custom-question or history state deviations from Stitch 2

### Notes / Blockers
- Notes: Runtime review is now complete for the most important custom-question and history surfaces. `CustomQuestionsScreen` presents well on both form factors: the summary hero, deck-readiness explanation, authored empty state, and `Add Custom Question` CTA all read clearly and match the intended premium browse-surface direction. `GameHistoryScreen` empty-state review on phone also looked strong: the archive title, empty-state copy, and refresh action were readable and emotionally consistent rather than feeling like a bare placeholder. We also applied a focused editor polish pass: `CustomQuestionEditorScreen` now has extra bottom breathing room and handled keyboard taps more gracefully. On hardware, `Cancel` still is not in the very first phone viewport, but after a small natural scroll it now appears cleanly with comfortable spacing instead of feeling pinned to the bottom edge. A later phone run confirmed full custom-question CRUD with real saved data: a disposable authored question rendered in the list, opened in edit mode with the correct prefilled values, saved successfully through the live update path, and then deleted through the destructive confirmation flow. After deletion, the summary hero recomputed correctly to `0` authored questions, `0` active couple deck count, and `8` still needed to play, and the authored list returned to the empty state. We then seeded the phone with a history-bearing account and completed populated-data runtime validation on `GameHistoryScreen`: `Recent` and `Oldest` visibly reorder the archive, `I Won` narrows to the winning session only, `Partner Won` shows the dedicated filtered-empty state, and the `Show All` recovery action returns the user to the full archive list.
- Blockers: No current blockers in the custom-question/history slice. The earlier history-validation gap is now closed.

---

## Phase 8. Profile and Settings

### Implementation
- [x] Rebuild [`ProfileScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/ProfileScreen.js)
- [x] Remove unsupported profile concepts such as journal archives
- [ ] Preserve real profile actions:
  - edit profile
  - settings
  - sign out
  - progression
  - achievements
- [x] Rebuild [`SettingsScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/SettingsScreen.js)
- [x] Remove unsupported settings concepts:
  - secret key
  - export shared data
  - chat history references
  - unsupported retention promises
- [x] Restyle theme controls
- [x] Restyle haptics controls
- [x] Restyle notification preferences
- [x] Restyle relationship controls
- [x] Restyle unlink flow
- [x] Restyle recover previous partner flow
- [x] Restyle replay onboarding action

### Validation
- [x] Profile data still renders correctly
- [ ] Edit profile still works
- [ ] Settings preferences still persist
- [x] Unlink flow still works
- [x] Recover previous partner flow still works
- [x] Sign out still works

### Docs
- [x] Record every unsupported Stitch feature removed from profile/settings
- [x] Update spec if any control-grouping changes are made for usability

### Notes / Blockers
- Notes: Runtime review is now broad and concrete on phone and tablet. `ProfileScreen` looked strong in the live app: progression, achievements, `Edit Profile`, `Settings`, and `Sign Out` all render as real product actions with no leftover invented Stitch concepts visible in the inspected surface. `SettingsScreen` upper and lower sections also rendered coherently in hardware review, including theme controls, haptics, notification preferences, relationship controls, and replay onboarding. The unlink safeguard is now improved in code for the active-game state: `SettingsScreen` loads `/game/active`, renders unlink as an explicitly unavailable guarded action when a live session exists, and shows pre-tap guidance instead of relying on a post-tap backend rejection. This guarded unlink state is now also visually confirmed on hardware. A tablet runtime pass confirms the real sign-out path works from the live profile screen and resets the app back to the Velvet Midnight auth surface. A follow-up tablet re-entry pass with a known-good paired account also successfully restored the live app shell, which confirms the earlier `alphatwo` confusion was stale test-data drift rather than a frontend auth regression. Recover-previous-partner is now hardware-validated on phone end to end: the linked state rendered correctly, unlink opened a final confirmation block with 24-hour cooldown language, confirm unlink transitioned the screen into `COOLDOWN_ACTIVE` with an absolute recovery timestamp and `Recover Previous Partner` CTA, and recovery returned the same account to the linked state. Backend verification after the runtime pass confirms both users in the disposable pair are again `LINKED` to the same couple record.
- Blockers: No current blocker in the profile/settings validation slice. The earlier `alphatwo` problem is now documented as stale credentials (`a2@t.co / Testpass123` returned a real backend `401 Invalid credentials`), not a confirmed UI defect.

---

## Phase 9. Results and Missing States

### Implementation
- [x] Design and implement [`ResultsScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/ResultsScreen.js) in Velvet Midnight style
- [x] Implement celebratory results hero
- [x] Implement player score cards
- [x] Implement milestones/progression section
- [x] Implement share-result CTA styling
- [x] Implement play-again/dashboard exit actions
- [x] Design in-code results loading state
- [x] Design in-code results unavailable/error state
- [ ] Add forgot-password success/error styling if still incomplete
- [ ] Add reset-password success/error styling if still incomplete
- [ ] Add unlink confirmation panel styling if still incomplete
- [ ] Add recover partner state styling if still incomplete

### Validation
- [x] Results render correctly with real data
- [x] Play again works
- [x] Back to dashboard works
- [x] Share result action still works
- [x] Results fallback state is understandable
- [x] Latest-results recovery state can route back toward results context

### Docs
- [x] Add notes for results design decisions since Stitch 2 has no dedicated export
- [x] Update master spec with the implemented results direction

### Notes / Blockers
- Notes: `ResultsScreen` is now fully on the Velvet Midnight primitive layer rather than a legacy utility composition. The screen owns its own chrome through `VelvetTopBar` and now presents a celebratory hero, animated score cards, milestone/progression sections, branded share actions, and explicit loading / `409 not ready` / unavailable recovery states using the same component family as the rest of the overhaul. `Play Again` and `Back to Dashboard` now also clear the temporary latest-results recovery snapshot on intentional exit, while `GameScreen` passes `sessionId` into results navigation so the screen can reliably re-fetch on reopen. Jest validation remains green across happy path rendering, share action, exit actions, `409` recovery, refresh behavior, and the new dashboard/latest-results recovery state.
- Blockers: The main remaining work around results is no longer core implementation. It is follow-up visual QA on real devices once the broader light/dark/system polish pass is complete.

---

## Phase 10. QA, Refinement, and Documentation Closure

### Implementation
- [x] Run frontend test suite
- [ ] Fix regressions introduced by redesign
- [-] Run cross-screen visual consistency pass
- [-] Check dark/light/system mode behavior
- [ ] Check browse-shell vs focused-shell consistency
- [ ] Polish spacing, hierarchy, and text contrast issues
- [ ] Remove any obsolete styling or dead components left from previous system

### Validation
- [x] Manual auth pass
- [-] Manual onboarding pass
- [x] Manual dashboard-state pass
- [x] Manual linking pass
- [x] Manual category-selection pass
- [x] Manual gameplay pass
- [x] Manual custom-question pass
- [x] Manual history pass
- [x] Manual profile pass
- [x] Manual settings pass
- [x] Manual results pass
- [-] Manual phone/tablet visual regression after latest shell/token polish
- [ ] Light/dark/system visual QA complete

### Docs
- [x] Update implementation spec with final deltas
- [ ] Update phased plan if execution diverged materially
- [ ] Add a short completion summary once overhaul reaches stable baseline

### Notes / Blockers
- Notes: Full frontend regression passed on Node 24 with `npm test -- --runInBand`. All 26 Jest suites and all 127 tests passed. Manual results validation is now functionally closed: real finished sessions reached the shared results screen on both devices, `Share Result Card` opened the native Android share sheet, `Play Again` routed into a fresh `CategorySelection` flow, and `Back to Dashboard` was manually verified on both phone and tablet after recreating a fresh clean results route. Post-completion continuity is also now implemented: the dashboard can surface a `results_ready` recovery hero after a hard relaunch, and explicit exits from results clear that temporary recovery state. A follow-up hardware regression after the shared shell/token polish also confirmed that the phone can still deep-link into the real auth surface through the dev client, the tablet dashboard remains visually coherent after browse-atmosphere defaults changed, and `Start New Game` still transitions into `CategorySelection` on tablet. Manual auth is now fully closed because both tablet and phone were manually signed in with real typing and both landed on the linked dashboard successfully. The same late-pass polish cycle also fixed the last obvious `Settings` shell mismatch by theming the native header from Velvet Midnight tokens instead of leaving a bright platform-default header above dark content. The remaining manual QA work is now concentrated in a broader full onboarding walkthrough on-device and the last cross-mode visual polish checks such as light/dark/system consistency, browse-shell vs focused-shell cohesion, and large-screen spacing.
- Blockers: Manual auth is no longer blocked. The remaining practical testing blocker is harness-related: full AsyncStorage swaps are useful for forced theme-mode QA on the debug build, but they can perturb dev-session auth/runtime state and should not be mistaken for a normal product re-entry path.

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
Phase 10. QA, Refinement, and Documentation Closure
Overall notes:
Phase 0 is complete. Phase 1 token work is landed. Phase 2 is complete with reusable browse and focused shell primitives, shared card families, and targeted Jest coverage validating the core primitive rollout. Phases 3 through 9 are largely implemented and broadly validated on hardware. Replay onboarding from settings is now fixed in live runtime. Manual auth is now closed on both tablet and phone with real typed sign-in landing on the linked dashboard. The active-session recovery matrix is functionally proven through Round 2, waiting-state continuation, and post-results relaunch recovery through the new dashboard `results_ready` hero. The main remaining closure work is the last round of visual polish/manual QA: a full onboarding walkthrough on-device, browse-shell vs focused-shell refinement, and the final light/dark/system pass.
Next recommended task:
Run one full onboarding walkthrough on-device, then finish the remaining light/dark/system and large-screen polish pass with special attention to browse-shell vs focused-shell cohesion.
