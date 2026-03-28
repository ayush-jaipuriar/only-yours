# Only Yours UI Overhaul Spec

Version: Draft 1  
Date: March 28, 2026  
Design Baseline: [`OnlyYoursApp/stitch 2`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursApp/stitch%202)  
Primary Design System Reference: [`velvet_midnight/DESIGN.md`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursApp/stitch%202/velvet_midnight/DESIGN.md)  
Primary App Codebase: [`OnlyYoursExpo/src`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src)

## 1. Purpose

This document turns the `stitch 2` export set into the implementation baseline for the Android UI/UX overhaul of Only Yours.

It combines:
- design spec
- engineering implementation guide
- screen-to-screen navigation mapping
- UI state mapping
- component breakdown
- corrective notes where Stitch output diverges from the real product

This is the source of truth we should use when rebuilding the app UI unless a later revision explicitly replaces it.

## 2. Scope

This spec covers the current real app surface in [`AppNavigator.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/navigation/AppNavigator.js):
- `SignIn`
- `SignUp`
- `ForgotPassword`
- `ResetPassword`
- `Onboarding`
- `Dashboard`
- `Profile`
- `Settings`
- `GameHistory`
- `PartnerLink`
- `CategorySelection`
- `CustomQuestions`
- `CustomQuestionEditor`
- `Game`
- `Results`

This spec does not authorize inventing new product areas. We are redesigning the current product, not expanding it into a different app.

Explicitly out of scope as product features:
- chat
- stories
- support hubs
- about pages in the core shell
- secret-key management
- export shared data
- journal archives
- social login unless later approved

## 3. Baseline Decision

We are officially using `stitch 2` as the working visual baseline.

That means:
- the visual language is approved as the starting point
- the exported screens are strong enough to guide implementation
- we will correct small product-fidelity issues ourselves in code and in follow-up design notes

This is not yet a perfect final design-signoff pack. It is an implementation-ready baseline with known deltas.

## 4. Design North Star

The target experience is:
- cinematic
- intimate
- premium
- emotionally warm
- dark-luxe
- private and couple-centric

The user should feel like they are entering a private shared world for two people, not a generic quiz app and not a generic social product.

The UI should balance:
- editorial romance in the typography and atmosphere
- modern product clarity in forms, actions, and system feedback
- immersive emotional pacing in gameplay and results

## 5. Visual System

### 5.1 Core Palette

Use the `Velvet Midnight` direction from [`DESIGN.md`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursApp/stitch%202/velvet_midnight/DESIGN.md#L1), with this practical interpretation:

- background base: deep midnight plum
- primary CTA: hot pink / magenta gradient
- supporting interactive tone: soft rose
- high-contrast text: warm cream, not stark blue-white
- surfaces: layered eggplant / aubergine / smoked-plum panels

Primary action colors should remain anchored to:
- `#FF3B78`
- `#FF2E6E`

Practical engineering note:
- Stitch still leans on `#FF4E7B` in several places.
- We can keep it as a nearby support token if needed.
- The dominant CTA feel should still read as hot pink, not soft coral.

### 5.2 Typography

Use:
- emotional/editorial headings: `Newsreader`
- body, controls, metadata, stats: `Manrope`

Rules:
- serif for emotional emphasis only
- sans for interaction and utility
- never use serif for dense control-heavy UI

### 5.3 Surfaces and Depth

We are not building a flat app.

Use:
- layered tonal surfaces instead of hard outlines
- blurred shell elements for top bars and bottom nav
- subtle pink ambient glows around hero content and active states
- rounded corners consistently

Avoid:
- pure black
- harsh white backgrounds
- sharp corners
- heavy divider lines

### 5.4 Navigation Shell Rules

Persistent bottom nav is allowed on browse/hub surfaces:
- Dashboard
- GameHistory
- CustomQuestions
- Profile

Bottom nav should be suppressed on focused/transactional flows:
- SignIn
- SignUp
- ForgotPassword
- ResetPassword
- Onboarding
- PartnerLink
- CustomQuestionEditor
- Game
- Results

Settings may be implemented without bottom nav and accessed from profile/top utility.

## 6. Source Mapping

### 6.1 Stitch Export to Real Screen Mapping

| Stitch 2 screen | Real app target |
| --- | --- |
| `auth_sign_in` | [`SignInScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/SignInScreen.js) |
| `auth_sign_up` | [`SignUpScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/SignUpScreen.js) |
| `onboarding_step_1` | [`OnboardingScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/OnboardingScreen.js) |
| `onboarding_step_2` | [`OnboardingScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/OnboardingScreen.js) |
| `onboarding_step_3` | [`OnboardingScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/OnboardingScreen.js) |
| `dashboard_active_game` | [`DashboardScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/DashboardScreen.js) |
| `dashboard_no_active_game` | [`DashboardScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/DashboardScreen.js) |
| `dashboard_not_linked` | [`DashboardScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/DashboardScreen.js) |
| `partner_linking_connect` | [`PartnerLinkScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/PartnerLinkScreen.js) |
| `linking_success_connected` | [`PartnerLinkScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/PartnerLinkScreen.js) success state |
| `game_choose_category` | [`CategorySelectionScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/CategorySelectionScreen.js) |
| `custom_question_list` | [`CustomQuestionsScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/CustomQuestionsScreen.js) |
| `custom_edit_question` | [`CustomQuestionEditorScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/CustomQuestionEditorScreen.js) |
| `game_round_1_answering` | [`GameScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/GameScreen.js) Round 1 |
| `game_round_2_guessing` | [`GameScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/GameScreen.js) Round 2 |
| `game_waiting_for_partner` | [`GameScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/GameScreen.js) wait state |
| `game_history_archive` | [`GameHistoryScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/GameHistoryScreen.js) |
| `profile_progression` | [`ProfileScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/ProfileScreen.js) |
| `settings_controls` | [`SettingsScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/SettingsScreen.js) |

### 6.2 Real Screens Not Yet Represented Cleanly in Stitch 2

These need in-code design completion using the same visual system:
- [`ForgotPasswordScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/ForgotPasswordScreen.js)
- [`ResetPasswordScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/ResetPasswordScreen.js)
- [`ResultsScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/ResultsScreen.js)

### 6.3 Real States Not Yet Represented Cleanly in Stitch 2

These states are required and should be designed in implementation:
- invitation pending
- invitation acceptance
- refresh session
- reconnect banner
- offline recovery
- partner left / partner returned
- expired session
- results unavailable
- forgot-password success/error
- reset-password success/error
- unlink confirmation panel
- recover previous partner state

## 7. Navigation and UX Flow Spec

### 7.1 Authenticated Flow

Primary sequence:
1. `Onboarding` if `shouldShowOnboarding`
2. `Dashboard`
3. from `Dashboard` user can go to:
   - `PartnerLink`
   - `CategorySelection`
   - `CustomQuestions`
   - `GameHistory`
   - `Profile`
4. from `Profile` user can go to `Settings`
5. active sessions route into `Game`
6. completed sessions route into `Results`

### 7.2 Logged-Out Flow

Sequence:
1. `SignIn`
2. optional:
   - `SignUp`
   - `ForgotPassword`
   - `ResetPassword`

### 7.3 Game Flow

Authoritative gameplay flow:
1. user opens or receives invite
2. accept invitation if pending
3. Round 1 answering
4. Round 1 completion
5. waiting state if partner not done
6. Round 2 guessing
7. waiting state if partner not done
8. results

Gameplay shell rules:
- no persistent bottom nav
- minimal top bar
- strong progress marker
- one dominant question at a time

## 8. Screen-by-Screen UX Spec

## 8.1 Sign In

Reference:
- [`auth_sign_in`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursApp/stitch%202/auth_sign_in/code.html)
- target file: [`SignInScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/SignInScreen.js)

Intent:
- trusted, intimate re-entry into the app

Keep:
- strong vertical form rhythm
- cinematic background treatment
- premium CTA treatment

Required UI:
- app title / brand
- email field
- password field
- forgot password
- sign in CTA
- sign up link
- validation / invalid credentials state
- loading state

Corrective changes:
- remove social or alternate sign-in buttons
- keep only real auth actions supported by the app

Implementation status:
- implemented with the Velvet auth shell already in [`AuthFormScreenLayout.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/components/AuthFormScreenLayout.js)
- content layer rebuilt using `VelvetTextField` and `VelvetPrimaryButton`
- auth errors now render as inline message cards instead of plain detached text
- sign-in secondary action grouping keeps only forgot-password and create-account pathways
- autofill and keyboard hints are now explicitly configured to improve real-device form usability

## 8.2 Sign Up

Reference:
- [`auth_sign_up`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursApp/stitch%202/auth_sign_up/code.html)
- target file: [`SignUpScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/SignUpScreen.js)

Required UI:
- username
- email
- password
- confirm password
- create account CTA
- validation errors
- loading state
- link back to sign in

Tone:
- account creation should feel like entering a private shared world, not signing up for a generic service

Implementation status:
- implemented with the shared auth layout and Velvet inputs/buttons
- CTA and heading hierarchy now separate “screen identity” from “button action,” which avoids duplicate-label ambiguity while keeping the form easier to scan
- back-to-sign-in is now treated as a calmer secondary action rather than competing with the primary create-account CTA

## 8.3 Forgot Password

No dedicated Stitch 2 screen.

Implementation rule:
- derive layout language from `auth_sign_in` and `auth_sign_up`
- same background treatment
- single email field
- success state should feel reassuring and lightweight

Target file:
- [`ForgotPasswordScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/ForgotPasswordScreen.js)

Implementation status:
- implemented using the same auth visual language as sign-in/sign-up
- success and error states now use the shared auth message-card pattern
- back-to-sign-in is elevated into a calmer secondary button instead of another plain link
- supporting copy now explicitly reassures users that account existence is not exposed through the reset request flow

## 8.4 Reset Password

No dedicated Stitch 2 screen.

Implementation rule:
- derive layout language from auth stack
- fields: token, new password, confirm password
- success state should be clear and calm

Target file:
- [`ResetPasswordScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/ResetPasswordScreen.js)

Implementation status:
- implemented using the same auth shell and message-card pattern
- token and new-password fields now follow the same labeled-field rhythm as the rest of auth
- success still routes back to sign-in after the existing timed confirmation
- secondary guidance now reinforces how the reset token flow should be used instead of leaving the screen feeling purely transactional

## 8.5 Onboarding

References:
- [`onboarding_step_1`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursApp/stitch%202/onboarding_step_1/code.html)
- [`onboarding_step_2`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursApp/stitch%202/onboarding_step_2/code.html)
- [`onboarding_step_3`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursApp/stitch%202/onboarding_step_3/code.html)

Target file:
- [`OnboardingScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/OnboardingScreen.js)

Core message sequence:
1. private shared space
2. round-by-round play
3. growth and celebration together

Required UX:
- full-screen storytelling
- progress indicator
- skip option
- one clear primary CTA
- under-one-minute feel

Implementation status:
- implemented as a cinematic 3-step story flow rather than a single repeated card with swapped copy
- preserves onboarding start-on-mount, skip, completion, and dashboard redirect behavior
- replay-onboarding support remains intact and now validates cleanly through `SettingsScreenFlow`
- each step now has stronger visual identity and supporting copy while keeping the core message sequence intact

## 8.6 Dashboard

References:
- [`dashboard_active_game`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursApp/stitch%202/dashboard_active_game/code.html)
- [`dashboard_no_active_game`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursApp/stitch%202/dashboard_no_active_game/code.html)
- [`dashboard_not_linked`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursApp/stitch%202/dashboard_not_linked/code.html)

Target file:
- [`DashboardScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/DashboardScreen.js)

Dashboard is the emotional home of the app.

Mandatory states:
- linked + active game
- linked + no active game
- not linked yet

Required sections:
- greeting
- partner status
- hero action card
- couple progression
- milestone highlights
- stats
- achievements
- custom questions entry
- history entry
- profile entry

Implementation rule:
- keep bottom nav here
- keep strong hero hierarchy
- preserve product density without making it feel crowded

## 8.7 Partner Linking

References:
- [`partner_linking_connect`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursApp/stitch%202/partner_linking_connect/code.html)
- [`linking_success_connected`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursApp/stitch%202/linking_success_connected/code.html)

Target file:
- [`PartnerLinkScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/PartnerLinkScreen.js)

Required states:
- generate code
- share code
- copy code
- enter their code
- connect
- success / connected

Implementation corrections:
- keep transactional and focused
- no bottom nav on linking flow
- remove any messaging-like implications

## 8.8 Category Selection

Reference:
- [`game_choose_category`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursApp/stitch%202/game_choose_category/code.html)

Target file:
- [`CategorySelectionScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/CategorySelectionScreen.js)

Required states:
- category list
- custom deck featured card
- custom deck ready
- custom deck not ready
- loading
- error
- empty
- mature content label

Use this screen as the visual standard for “choose a mood/journey” rather than “choose a data category.”

## 8.9 Custom Questions List

Reference:
- [`custom_question_list`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursApp/stitch%202/custom_question_list/code.html)

Target file:
- [`CustomQuestionsScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/CustomQuestionsScreen.js)

Required UI:
- summary hero
- deck readiness
- authored list
- add question CTA
- edit
- delete
- empty state
- loading
- error

Use bottom nav on this screen.

## 8.10 Custom Question Editor

Reference:
- [`custom_edit_question`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursApp/stitch%202/custom_edit_question/code.html)

Target file:
- [`CustomQuestionEditorScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/CustomQuestionEditorScreen.js)

Required UI:
- question field
- options A-D
- create/edit mode
- save
- cancel
- validation error
- loading / saving

No bottom nav.

## 8.11 Game History

Reference:
- [`game_history_archive`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursApp/stitch%202/game_history_archive/code.html)

Target file:
- [`GameHistoryScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/GameHistoryScreen.js)

Required UI:
- sort controls
- winner filter
- cards with date / result / partner / scores
- load more
- empty
- filtered empty
- error
- loading

Bottom nav is allowed here.

## 8.12 Profile

Reference:
- [`profile_progression`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursApp/stitch%202/profile_progression/code.html)

Target file:
- [`ProfileScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/ProfileScreen.js)

Required UI:
- avatar / identity
- username and bio
- edit profile action
- settings entry
- couple progression
- personal progression
- milestone highlights
- achievements
- sign out

Corrective changes:
- replace invented entries like `Journal Archives` with real destinations/actions
- keep share actions where supported by the real product

## 8.13 Settings

Reference:
- [`settings_controls`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursApp/stitch%202/settings_controls/code.html)

Target file:
- [`SettingsScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/SettingsScreen.js)

Required sections:
- theme
- haptics
- notification preferences
- relationship controls
- replay onboarding

Corrective changes:
- remove unsupported features:
  - secret key
  - shared data export
  - chat history references
  - unsupported archival claims
- replace with real unlink / recover partner flows from the current product

## 8.14 Game: Round 1 Answering

Reference:
- [`game_round_1_answering`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursApp/stitch%202/game_round_1_answering/code.html)

Target file:
- [`GameScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/GameScreen.js)

This is the strongest gameplay baseline in the export set.

Keep:
- minimal top bar
- question count
- strong question hierarchy
- clear selected state
- fixed bottom CTA
- no bottom nav

## 8.15 Game: Round 2 Guessing

Reference:
- [`game_round_2_guessing`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursApp/stitch%202/game_round_2_guessing/code.html)

Target file:
- [`GameScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/GameScreen.js)

Required differentiation from Round 1:
- explicit “guess your partner’s answer” framing
- visible match/correctness context
- distinct selection treatment

## 8.16 Game: Waiting for Partner

Reference:
- [`game_waiting_for_partner`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursApp/stitch%202/game_waiting_for_partner/code.html)

Target file:
- [`GameScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/GameScreen.js)

This screen is emotionally strong and should guide the waiting-state implementation.

Required UX:
- completion acknowledgment
- calm waiting message
- soft progress indicator
- dashboard fallback action

Corrective change:
- no menu-style browse framing; keep the state focused and session-aware

## 8.17 Results

No Stitch 2 screen currently exists.

Target file:
- [`ResultsScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/ResultsScreen.js)

Design direction:
- combine the stronger emotional structure from older results explorations with the `Velvet Midnight` palette
- keep it immersive and share-worthy
- no global bottom nav

Required UI:
- celebratory headline
- combined score / match emphasis
- player score cards
- milestones unlocked
- progression gained
- share result
- play again
- back to dashboard

## 9. Component Breakdown

## 9.1 Global Shell Components

Needed shared primitives:
- `VelvetTopBar`
- `VelvetBottomNav`
- `VelvetAtmosphere`
- `VelvetSurfaceCard`
- `VelvetScreen` or equivalent screen-shell wrapper
- `EditorialScreenTitle`

Phase 2 status:
- Implemented in code:
  - `VelvetTopBar`
  - `VelvetBottomNav`
  - `VelvetAtmosphere`
  - `VelvetSurfaceCard`
  - `VelvetScreen`
  - `VelvetScrollScreen`
  - `VelvetFocusedScreen`
  - `VelvetBrowseLayout`
- Still needed as stronger higher-level abstractions:
  - more opinionated screen-title helpers where useful

Current adoption:
- `AuthFormScreenLayout` already uses the Velvet shell/surface primitives for branded auth presentation
- `DashboardScreen` now uses `VelvetBrowseLayout` as its outer browse container
- `GameHistoryScreen` now uses `VelvetBrowseLayout` as its outer browse container
- `CustomQuestionsScreen` now uses `VelvetBrowseLayout` as its outer browse container
- `ProfileScreen` now uses `VelvetBrowseLayout` as its outer browse container
- Native stack headers are hidden for browse destinations so the Velvet shell remains the visible source of browse-surface framing
- `PartnerLinkScreen`, `CategorySelectionScreen`, and `CustomQuestionEditorScreen` now use the focused shell path with native stack headers hidden

Implementation note:
- The remaining Phase 2 work is no longer “invent the shell abstraction.”
- Browse-screen top-bar behavior is now standardized through `VelvetBrowseLayout`.
- Focused-screen top-bar/back behavior is now standardized through `VelvetFocusedScreen`.
- Later phases can now consume the shell system rather than inventing new framing patterns.

Rules:
- top bar varies by screen mode
- bottom nav only on browse/hub surfaces
- shell blur/background treatment should be centralized, not reauthored per screen
- safe-area ownership should stay explicit to avoid doubled insets:
  - browse layout owns left/right framing
  - top bar owns top inset
  - bottom nav owns bottom inset

## 9.2 Buttons

Needed variants:
- primary action button
- secondary tonal button
- ghost / low-emphasis action
- destructive bordered action
- icon-only utility button

Phase 2 status:
- Implemented in code:
  - `VelvetPrimaryButton`
  - `VelvetSecondaryButton`
- Still needed:
  - explicit ghost button primitive if later screens need one repeatedly
  - explicit icon-only utility button primitive if later screens need one repeatedly

## 9.3 Cards

Needed reusable card families:
- hero card
- progression card
- milestone card
- stat card
- gameplay option card
- settings row card
- list item card

Phase 2 status:
- Implemented in code:
  - `VelvetSurfaceCard` as the base shared surface primitive
  - `VelvetHeroCard`
  - `VelvetSectionCard`
  - `VelvetStatCard`
  - `VelvetOptionCard`
- Still needed:
  - additional specialized wrappers only if later screen migrations reveal new repeated patterns

Current adoption:
- `DashboardScreen` uses `VelvetHeroCard`, `VelvetSectionCard`, and `VelvetStatCard`
- `CustomQuestionsScreen` uses `VelvetHeroCard` and `VelvetSectionCard`
- `CategorySelectionScreen` uses `VelvetOptionCard`

## 9.4 Form Controls

Needed primitives:
- branded text input
- password input with reveal affordance
- segmented selector
- inline validation text
- helper text
- switch/toggle

Phase 2 status:
- Implemented in code:
  - `VelvetTextField`
- Still needed:
  - dedicated password-field wrapper if reuse becomes high
  - segmented selector primitive

## 9.5 Progress and Status

Needed shared UI:
- glowing progress bar
- round badge
- status pill
- partner presence indicator
- loading state
- empty state
- error state
- reconnect banner

Phase 2 status:
- Implemented in code:
  - `VelvetProgressBar`
  - `VelvetStatusPill`
  - early primitive adoption in `AuthFormScreenLayout`, `EmptyState`, and `LoadingSpinner`
- Still needed:
  - reusable round badge
  - partner presence indicator
  - reconnect-banner restyle

## 10. Corrective Design Rules for Stitch 2

These corrections must be applied during implementation even if the mockups show something else.

### 10.1 Remove Invented Product Features

Do not implement:
- chat history
- secret keys
- export shared data
- journal archives
- unsupported social auth

### 10.2 Preserve Real Product Logic

Must remain true:
- one active session
- one-question-at-a-time gameplay
- partner linking via code
- custom authored questions
- results after both complete Round 2
- settings based on real theme/haptics/notification/relationship controls

### 10.3 Missing States Must Be Designed in Code

Required states to design using the same style:
- forgot password success/error
- reset password success/error
- invitation pending
- expired session
- reconnect/offline
- results unavailable
- unlink confirmation step
- recover previous partner flow

## 11. Engineering Mapping by Area

## 11.1 Navigation

Primary file:
- [`AppNavigator.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/navigation/AppNavigator.js)

Implementation tasks:
- redesign headers / shell behavior
- suppress default stack header where custom velvet header is needed
- standardize which screens own bottom nav vs custom focused shell

## 11.2 Theme System

Primary existing files:
- [`ThemeProvider.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/theme/ThemeProvider.js)
- [`tokens.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/theme/tokens.js)
- [`gradients.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/theme/gradients.js)
- [`useTheme.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/theme/useTheme.js)

Implementation tasks:
- replace old romance/pastel token set with Velvet Midnight tokens
- add tonal surface hierarchy
- add action gradient tokens
- add top bar / shell blur tokens

## 11.3 Shared Components

Likely target area:
- [`OnlyYoursExpo/src/components`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/components)

Implementation tasks:
- create reusable shell components
- create standardized buttons/cards/inputs
- refactor current screens to consume shared patterns

## 11.4 Screen Rebuild Targets

High-priority sequence:
1. theme system and shell primitives
2. auth stack
3. onboarding
4. dashboard
5. gameplay
6. linking
7. category selection
8. custom questions/editor
9. profile/settings/history
10. results and missing states

## 12. Acceptance Criteria

The overhaul is considered design-complete when:
- all current app screens follow a single visual system
- gameplay feels immersive and focused
- dashboard states all feel coherent
- auth, onboarding, and linking feel like the same brand
- profile/settings/history/custom flows match the same shell logic
- unsupported product ideas from Stitch have been removed
- missing states have been designed in the same system

The overhaul is considered implementation-ready when:
- each screen has a mapped code target
- each major state is accounted for
- shared components exist for repeated UI patterns
- theme tokens are centralized
- screen shell rules are documented and consistent

## 13. Practical Build Notes

### 13.1 Use Stitch 2 as Reference, Not Literal HTML

We should not recreate the exported HTML literally.

Instead:
- extract hierarchy
- extract proportions and component intent
- extract palette and motion tone
- implement idiomatically in React Native

### 13.2 Mobile-First Discipline

Many exports are visually rich and editorial. In implementation:
- preserve atmosphere
- protect readability
- prioritize touch ergonomics
- avoid overusing decorative image layers if they hurt performance or clarity

### 13.3 Teach-the-Code Rule

When implementing complex shared primitives, document:
- why the primitive exists
- which screens use it
- which visual rule from this spec it is enforcing

## 14. Recommended Next Step

The best next implementation step is:
1. create Velvet Midnight theme tokens and shell primitives
2. rebuild the auth stack and onboarding first
3. then move to dashboard and gameplay

That order gives us:
- brand consistency early
- shared primitives before expensive screen rewrites
- the highest user-facing payoff in the shortest path
