# Velvet Midnight Phased Implementation Plan

Version: Draft 1  
Date: March 28, 2026  
Parent Spec: [`VELVET_MIDNIGHT_IMPLEMENTATION_SPEC.md`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursApp/stitch%202/VELVET_MIDNIGHT_IMPLEMENTATION_SPEC.md)  
Design Baseline: [`OnlyYoursApp/stitch 2`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursApp/stitch%202)

## 1. Objective

This plan translates the Velvet Midnight redesign into an implementation sequence for the real Only Yours app.

The plan is optimized for a balanced approach:
- visible progress early enough to maintain momentum
- shared foundations first so we do not create inconsistent one-off screens
- low-risk sequencing where structural UI work lands before the most state-heavy screens

This plan covers:
- Expo frontend UI overhaul
- any backend or API touchpoints needed to safely support the redesigned flows
- testing, verification, and documentation updates that should happen alongside implementation

## 2. Execution Principles

### 2.1 Build the System Before the Screens

The main reason to start with foundations is that the current app already has many screens and many shared states. If we restyle screen by screen without first stabilizing:
- color tokens
- layout primitives
- shell behavior
- reusable cards and inputs

we will create rework, drift, and duplicated styling logic.

### 2.2 Treat Stitch as Intent, Not Literal Code

The exported HTML is useful because it teaches us:
- hierarchy
- spacing
- component mood
- motion tone
- shell behavior

But React Native implementation should be idiomatic and shared-component driven. We should not manually replicate each screen as an isolated one-off.

### 2.3 Keep Product Truth Intact

The redesign must not introduce product behavior we do not currently support.

That means:
- no chat
- no stories
- no journal archives
- no secret-key management
- no shared-data export
- no social login unless later approved

If Stitch output suggests any of those patterns visually, we reinterpret the screen using the same visual language but with the real product actions.

## 3. Deliverables

By the end of this plan, we should have:
- a unified Velvet Midnight theme system
- shared shell primitives for focused and browse surfaces
- redesigned React Native screens for the current app surface
- missing states designed in-code where Stitch 2 has no dedicated mockup
- updated tests for major visual and behavioral flows
- updated docs describing what changed and what remains

## 4. Phase Overview

### Phase 0. Alignment and Guardrails
Purpose:
- lock the design baseline
- prevent feature drift
- prepare the implementation surface

### Phase 1. Theme and Design Tokens
Purpose:
- replace the old romance/pastel token system with Velvet Midnight foundations

### Phase 2. Shared Shell and Core UI Primitives
Purpose:
- build reusable layout and interaction primitives before touching many screens

### Phase 3. Authentication and Onboarding
Purpose:
- redesign the top-of-funnel and first-run experience using the new foundation

### Phase 4. Dashboard and Core Navigation Surfaces
Purpose:
- establish the primary app shell and emotional home state

### Phase 5. Partner Linking and Category Selection
Purpose:
- redesign the setup and game-entry flows

### Phase 6. Gameplay Surfaces
Purpose:
- rebuild the most important experiential flow with focused transactional shells

### Phase 7. Custom Questions and History
Purpose:
- align supporting flows with the new system

### Phase 8. Profile and Settings
Purpose:
- redesign identity and controls while removing invented Stitch-only features

### Phase 9. Results and Missing States
Purpose:
- close the current gaps not fully represented in Stitch 2

### Phase 10. QA, Refinement, and Documentation Closure
Purpose:
- verify consistency, fidelity, and readiness

## 5. Detailed Phases

## Phase 0. Alignment and Guardrails

### Goals
- confirm `stitch 2` is the active design baseline
- lock the source-of-truth docs
- define which screens are direct references and which are “interpret with corrections”

### Inputs
- [`VELVET_MIDNIGHT_IMPLEMENTATION_SPEC.md`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursApp/stitch%202/VELVET_MIDNIGHT_IMPLEMENTATION_SPEC.md)
- [`velvet_midnight/DESIGN.md`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursApp/stitch%202/velvet_midnight/DESIGN.md)
- exported Stitch 2 screen set

### Tasks
- mark `stitch 2` as the working design baseline
- identify unsupported features embedded in the Stitch export
- create a short “do not implement” list in code comments or developer notes where helpful
- confirm the screen mapping against [`AppNavigator.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/navigation/AppNavigator.js)

### Deliverables
- this plan
- the master implementation spec

### Exit Criteria
- team has a stable design source of truth
- no ambiguity about current product scope

## Phase 1. Theme and Design Tokens

### Goals
- move the app from the current palette/system into Velvet Midnight
- centralize colors, gradients, type, elevation, spacing, and shell behavior

### Primary files
- [`tokens.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/theme/tokens.js)
- [`gradients.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/theme/gradients.js)
- [`ThemeProvider.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/theme/ThemeProvider.js)
- [`useTheme.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/theme/useTheme.js)

### Tasks
- define Velvet Midnight light and dark tokens
- update typography scale to reflect Newsreader + Manrope usage expectations
- define surface hierarchy tokens:
  - background
  - dim
  - container low
  - container
  - container high
  - container highest
- define action gradient tokens for primary CTAs
- define glow tokens for hero emphasis and progress
- define neutral text hierarchy with cream-first contrast
- preserve theme mode support: `system`, `light`, `dark`

### Engineering notes
- dark mode is the hero mode and should match Stitch 2 most closely
- light mode should remain brand-consistent, not revert to generic white-purple defaults
- token names should be implementation-friendly and reusable, not tied to one screen

### Testing
- smoke test theme provider behavior
- ensure no screens crash due to token renames
- verify old components still render before deeper refactors

### Exit Criteria
- theme tokens are complete enough for cross-screen implementation
- gradients and tonal layering are reusable
- the app can render under the new theme foundation without visual chaos

## Phase 2. Shared Shell and Core UI Primitives

### Goals
- create the building blocks that all redesigned screens will use

### Candidate component areas
- [`OnlyYoursExpo/src/components`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/components)

### Components to create or refactor
- `VelvetTopBar`
- `VelvetBottomNav`
- `VelvetScreen`
- `VelvetHeroCard`
- `VelvetSectionCard`
- `VelvetPrimaryButton`
- `VelvetSecondaryButton`
- `VelvetGhostButton`
- `VelvetTextField`
- `VelvetSegmentedControl`
- `VelvetProgressBar`
- `VelvetStatusPill`
- `VelvetEmptyState`
- `VelvetErrorState`
- `VelvetLoadingState`

### Shell modes to support
- browse shell
  - top bar
  - bottom nav
  - content scroll
- focused shell
  - top bar only
  - no bottom nav
  - fixed action footer if needed
- auth shell
  - immersive background
  - centered form card

### Why this phase matters
Without these primitives, every later screen phase becomes slower and less consistent. This phase is the highest leverage part of the overhaul.

### Exit Criteria
- enough reusable primitives exist to rebuild screens without inline design duplication
- browse and focused shells are both working

## Phase 3. Authentication and Onboarding

### Goals
- deliver a visually transformed first-run and re-entry flow using the new system

### Target files
- [`SignInScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/SignInScreen.js)
- [`SignUpScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/SignUpScreen.js)
- [`ForgotPasswordScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/ForgotPasswordScreen.js)
- [`ResetPasswordScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/ResetPasswordScreen.js)
- [`OnboardingScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/OnboardingScreen.js)

### Design references
- `auth_sign_in`
- `auth_sign_up`
- `onboarding_step_1`
- `onboarding_step_2`
- `onboarding_step_3`

### Tasks
- rebuild sign-in layout using Velvet auth shell
- remove unsupported social-login concepts
- style forgot/reset screens using the same auth language even though Stitch 2 does not provide dedicated screens
- rebuild onboarding as a true 3-step storytelling flow
- ensure auth validation and success/error states still feel native to the same design system

### Backend/API touchpoints
- none expected beyond existing auth endpoints
- confirm no UI changes assume new auth methods

### Testing
- auth flows continue to function end-to-end
- onboarding replay still works
- validation/error messages remain accessible

### Exit Criteria
- logged-out and first-run experience fully matches the new brand
- all auth screens are visually coherent

## Phase 4. Dashboard and Core Navigation Surfaces

### Goals
- establish the main app shell and emotional home state

### Target files
- [`DashboardScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/DashboardScreen.js)
- any navigation-shell helpers introduced in Phase 2

### Design references
- `dashboard_active_game`
- `dashboard_no_active_game`
- `dashboard_not_linked`

### Tasks
- rebuild dashboard into Velvet browse shell
- implement three primary dashboard states:
  - linked + active game
  - linked + no active game
  - not linked
- preserve real content blocks:
  - progression
  - milestones
  - stats
  - achievements
  - custom questions entry
  - history entry
  - profile entry
- establish final bottom nav behavior for browse surfaces

### Backend/API touchpoints
- confirm no new data dependencies are assumed
- verify existing stats/progression payloads remain sufficient for the redesigned dashboard

### Testing
- dashboard flow tests should still pass
- active game CTA and partner-link CTA must still route correctly

### Exit Criteria
- the app’s main emotional home is visually transformed
- browse shell is stable and reusable

## Phase 5. Partner Linking and Category Selection

### Goals
- modernize the pre-game setup flow without changing product behavior

### Target files
- [`PartnerLinkScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/PartnerLinkScreen.js)
- [`CategorySelectionScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/CategorySelectionScreen.js)

### Design references
- `partner_linking_connect`
- `linking_success_connected`
- `game_choose_category`

### Tasks
- rebuild linking screen using focused transactional shell
- preserve:
  - generate code
  - copy
  - share
  - enter partner code
  - connect
- implement connected-success moment in-app
- redesign category selection cards with better hierarchy and richer visual pacing
- keep custom deck featured state and mature-content labels

### Backend/API touchpoints
- partner linking contracts must remain unchanged
- category data shape should be checked against the redesigned cards
- custom deck readiness data should remain aligned with current backend summary payloads

### Testing
- partner code generation and connection
- copy/share entry points
- custom deck not-ready routing

### Exit Criteria
- setup path into the main relationship experience feels premium and clear

## Phase 6. Gameplay Surfaces

### Goals
- rebuild the most important user flow with immersive focused-shell behavior

### Target file
- [`GameScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/GameScreen.js)

### Design references
- `game_round_1_answering`
- `game_round_2_guessing`
- `game_waiting_for_partner`

### Tasks
- implement focused gameplay shell with no bottom nav
- redesign Round 1 answering
- redesign Round 2 guessing with visibly distinct identity
- redesign waiting-for-partner state
- integrate progress, selection state, and bottom CTA treatment
- design in-code missing gameplay states not fully represented in Stitch 2:
  - invitation pending
  - refresh session
  - reconnect banner
  - offline recovery
  - partner disconnected / partner returned
  - expired session
  - results not ready

### Why this phase is complex
Gameplay is not just visual. It is state-heavy and timing-sensitive. That means the UI overhaul must preserve all session logic and all async continuation behavior while improving clarity.

### Backend/API touchpoints
- no new endpoints expected
- verify no new UI assumes data not currently returned
- confirm session status values and partner presence indicators are sufficient for redesigned state presentation

### Testing
- existing game flow tests
- manual active-session continuation checks
- no-regression validation for round gates and waiting states

### Exit Criteria
- gameplay feels immersive and high-confidence
- all major gameplay states are accounted for visually

## Phase 7. Custom Questions and History

### Goals
- align supporting flows with the new system after the core journey is stable

### Target files
- [`CustomQuestionsScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/CustomQuestionsScreen.js)
- [`CustomQuestionEditorScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/CustomQuestionEditorScreen.js)
- [`GameHistoryScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/GameHistoryScreen.js)

### Design references
- `custom_question_list`
- `custom_edit_question`
- `game_history_archive`

### Tasks
- rebuild authored custom-question list
- rebuild custom-question editor
- restyle history cards, filters, empty states, and pagination
- ensure bottom nav behavior is consistent on browse surfaces

### Backend/API touchpoints
- custom question list and summary payloads should be checked against redesigned card density
- history payload already appears sufficient, but confirm no extra metadata is assumed

### Testing
- create / edit / delete custom question flow
- history sort/filter behavior
- loading and empty states

### Exit Criteria
- support flows no longer feel like visually older sections of the app

## Phase 8. Profile and Settings

### Goals
- redesign identity and control surfaces while correcting Stitch drift

### Target files
- [`ProfileScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/ProfileScreen.js)
- [`SettingsScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/SettingsScreen.js)

### Design references
- `profile_progression`
- `settings_controls`

### Tasks
- rebuild profile using Velvet browse shell
- keep:
  - identity
  - progression
  - milestones
  - achievements
  - settings entry
  - sign out
- remove invented profile concepts like journal archives
- rebuild settings using the real control set:
  - theme
  - haptics
  - notification preferences
  - relationship controls
  - replay onboarding
- replace invented settings concepts:
  - secret key
  - export data
  - chat history
  - unsupported retention promises

### Backend/API touchpoints
- notification preferences contract must still match backend fields
- unlink/recover controls must reflect the real relationship state model

### Testing
- settings persistence
- unlink flow
- recover previous partner behavior
- profile editing

### Exit Criteria
- profile/settings feel premium without inventing unsupported product behavior

## Phase 9. Results and Missing States

### Goals
- close the gaps not fully covered by Stitch 2

### Target files
- [`ResultsScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/ResultsScreen.js)
- supporting state surfaces in auth/game/settings flows

### Tasks
- design and implement Velvet Midnight results screen
- derive results from:
  - current app requirements
  - older results explorations
  - the new token/component system
- implement missing state designs:
  - forgot-password success/error
  - reset-password success/error
  - invitation pending
  - reconnect/offline
  - expired session
  - results unavailable
  - unlink confirmation
  - recover previous partner

### Backend/API touchpoints
- results payload and progression payload should be verified for completeness
- no new backend work expected unless UI gaps expose missing metadata

### Testing
- results rendering
- share entry points
- error and fallback states

### Exit Criteria
- no major screen or state remains visually outside the new system

## Phase 10. QA, Refinement, and Documentation Closure

### Goals
- verify the overhaul is coherent and shippable

### Tasks
- run frontend tests
- perform visual QA across dark/light/system modes
- verify bottom-nav shell rules are consistent
- verify focused flows suppress bottom nav correctly
- compare implemented screens against Stitch 2 and the implementation spec
- update documentation during each major completion step

### Suggested validation areas
- auth stack
- onboarding
- dashboard states
- linking
- category selection
- gameplay
- waiting state
- custom questions
- history
- profile
- settings
- results

### Exit Criteria
- implementation matches the design baseline closely enough
- remaining deltas are intentionally tracked

## 6. Backend and API Watchlist

This is a frontend-led overhaul, but these backend touchpoints should be watched closely because UI redesigns often expose missing or assumed fields.

### Watchlist
- auth responses
- dashboard progression/stats payloads
- active game session summary
- category/custom deck readiness summary
- custom question list and summary
- notification preferences contract
- unlink/recover state contract
- results/progression payloads

### Rule
Do not introduce backend changes unless the UI genuinely needs missing data. Prefer consuming the current contracts and adjusting the UI first.

## 7. Testing Strategy

### Automated
- preserve and update existing frontend tests where current flows already have coverage
- add tests for shared shell and new primitives where behavior matters
- add focused regression tests for gameplay state rendering if refactoring gets deep

### Manual
- visual pass in `dark`, `light`, and `system`
- navigation correctness pass
- gameplay pass with active session continuation
- settings persistence and relationship controls pass

## 8. Documentation Strategy

During implementation, update docs iteratively:
- note which screens are fully migrated
- note which states are still temporary
- record any deviations from Stitch 2 that were intentionally corrected for product fidelity

Primary docs to keep aligned:
- [`VELVET_MIDNIGHT_IMPLEMENTATION_SPEC.md`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursApp/stitch%202/VELVET_MIDNIGHT_IMPLEMENTATION_SPEC.md)
- this phased plan
- any relevant current progress trackers if the overhaul becomes the active workstream

## 9. Recommended Working Order

This is the concrete order I recommend we implement:

1. Phase 1: theme and tokens
2. Phase 2: shared shell and primitives
3. Phase 3: auth and onboarding
4. Phase 4: dashboard
5. Phase 5: partner linking and category selection
6. Phase 6: gameplay
7. Phase 7: custom questions and history
8. Phase 8: profile and settings
9. Phase 9: results and missing states
10. Phase 10: QA and docs closure

Why this order:
- it front-loads reusable infrastructure
- it gives visible user-facing transformation early
- it delays the most state-heavy gameplay work until the design system is stable
- it prevents support screens from being rebuilt twice

## 10. Definition of Done

The Velvet Midnight overhaul is done when:
- all current app screens are visually aligned to the new system
- unsupported Stitch-only product ideas are removed
- shell behavior is consistent
- gameplay and results feel immersive
- browse surfaces feel unified
- theme modes work correctly
- missing states are implemented
- tests and docs reflect the new UI baseline

