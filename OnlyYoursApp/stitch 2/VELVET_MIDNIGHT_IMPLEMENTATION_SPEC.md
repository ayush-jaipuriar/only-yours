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
- `Stats`
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
- The light-mode implementation should not collapse into near-white utility surfaces. A later polish pass intentionally pushed browse/auth screens toward blush-plum layering so `system` / `light` still reads as the same brand family as the dark hero mode.

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
- Stats
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
| `profile_progression` | [`StatsScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/StatsScreen.js), [`ProfileScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/ProfileScreen.js) |
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
   - `Stats`
   - `Profile`
4. browse tabs also provide direct access to `GameHistory` and `CustomQuestions`
5. from `Profile` user can go to `Settings`
6. active sessions route into `Game`
7. completed sessions route into `Results`

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

Runtime findings to preserve during implementation:
- A physical-device smoke pass using local throwaway users confirmed the real invite flow, invitation-pending screen, Question 1 render, and partner presence notices (`PARTNER_LEFT` and `PARTNER_RETURNED`) are all reachable in the current build.
- Follow-up diagnosis confirmed the apparent Round 1 "progression mismatch" was expected behavior, not a sync defect. The product model, manual QA guide, and backend service tests all treat Round 1 as asynchronous per user: each player advances through their own next unanswered question independently, and `Continue Game` restores the next unanswered question for that specific user rather than a shared per-question cursor.
- A later two-device pass on a phone plus tablet confirmed that the real app UI follows that same asynchronous model on hardware: in the same active session, one device can legitimately show Question 3 while the other still shows Question 2, because Round 1 progress is tracked per user rather than by a shared couple question index.

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
- the auth shell now also hides the global real-time reconnection banner while signed out, which keeps the sign-in experience truthful and avoids implying a broken live session before authentication has even started

Current runtime review status:
- sign-out back to the sign-in screen is hardware-validated and visually correct
- the backend auth path and persisted-login hydration are both healthy again after correcting the local device API host setup
- a clean manual sign-in on tablet using a known-good linked account now lands back on the real linked dashboard successfully, which closes the core sign-in UX path
- direct adb text-entry is still not reliable enough on the connected devices to treat automated email/password submission as a trustworthy sign-in certification step; `%40` was inserted literally on phone and focus shifted unexpectedly after keyboard movement

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
- Jest coverage still validates the replay-onboarding flow through `SettingsScreenFlow`, but live tablet runtime review found a real navigation bug: tapping `Replay Onboarding` from settings surfaced `The action 'REPLACE' with payload {"name":"Onboarding"} was not handled by any navigator`
- replay-onboarding should now be treated as an open implementation defect rather than a closed manual-validation item
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

Implementation rule:
- keep bottom nav here
- keep strong hero hierarchy
- keep Home action-oriented rather than analytics-heavy

Current implementation status:
- `DashboardScreen` now uses a true state-driven Velvet Midnight layout instead of a mostly linear migrated stack.
- The live implementation preserves the existing `useDashboardGameFlow` contract and works only with currently available dashboard data, which keeps the redesign safe from backend drift.
- The hero now branches cleanly across the three mandatory dashboard states:
  - active game: continuation-focused hero with round/question context and progress bar
  - linked without active game: start-new-session hero with a secondary path into `Stats`
  - not linked: partner-linking hero with a softer path into `Stats`
- A later browse-shell simplification removed the extra `Custom Questions`, `Game History`, and `Profile` destination cards from Home. Those routes already exist in the persistent bottom nav, so keeping them in the dashboard as large repeated cards made the screen feel more verbose and sitemap-like than necessary.
- The browse IA was then tightened one step further: progression, recent celebrations, gameplay metrics, and achievements were moved into a dedicated `Stats` tab, so Home now focuses on the question “what should I do now?” rather than duplicating the app’s analytics and growth surfaces.

Implementation deviations from Stitch 2:
- We intentionally did not invent any “recent history preview” content cards because the current dashboard data contract does not provide that payload directly.
- We also avoided introducing unsupported avatar/media treatments from the Stitch mockup; the implemented version stays within the current product’s real data surface.
- Bottom nav behavior remains consistent through `VelvetBrowseLayout`, which matches the browse-surface rule from the spec.
- The shipped browse IA intentionally diverges from the earliest Stitch grouping by introducing `Stats` as a dedicated browse destination and reserving `Profile` for identity/account actions only.

Current validation status:
- `DashboardScreen.test.js` now verifies the three dashboard hero states directly:
  - linked with active game
  - linked without active game
  - not linked
- The same screen test also protects the primary CTAs for continue/start/link actions.
- `useDashboardGameFlow.test.js` still covers the underlying couple/active-game/progression loading contract, so the dashboard now has both screen-level and data-level automated coverage.

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

Current implementation status:
- `PartnerLinkScreen` now uses the focused Velvet Midnight shell and a clearer two-step structure:
  - generate/share your code
  - enter their code and connect
- The implementation still preserves the original API behaviors (`/couple/generate-code` and `/couple/link`) plus native copy/share actions, but the hierarchy is now closer to the Stitch intent.
- The previous success alert has been upgraded into an in-screen success state, which is a deliberate implementation improvement over the older interaction pattern.

Implementation deviations from Stitch 2:
- We did not introduce unsupported “security marketing” claims like end-to-end encryption copy as product fact unless it already existed in the app contract.
- Instead of a static success mockup, the screen now conditionally transitions into a real connected state after the backend link succeeds.

Current validation status:
- `PartnerLinkScreen.test.js` now verifies:
  - partner code generation
  - successful linking into the connected state
- Device-level partner-linking verification is now complete on Android tablet:
  - dashboard `Link with Partner` CTA routes correctly for an authenticated-but-unlinked account
  - `Generate Code` produces a large readable code block
  - `Copy Code` visibly confirms with a `Copied!` state
  - `Share Code` opens the native Android share sheet and successfully hands off into a real Gmail compose target
- The Android chooser integration is therefore runtime-proven, even though downstream target apps may render the received text differently once they receive the intent.

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

Current implementation status:
- `CategorySelectionScreen` now presents the custom deck as a featured hero path rather than a flat list item, which better matches the product importance of authored couple prompts.
- Standard categories remain operationally identical, but the UI now frames them as mood/energy choices instead of raw backend categories.
- The implementation preserves the existing behavior contract:
  - custom-deck readiness gating
  - sensitive-content confirmation
  - WebSocket invite sending
  - invite-in-flight lockout
  - existing loading/error/empty states

Implementation deviations from Stitch 2:
- We intentionally did not invent rich image-backed category cards because the current product data contract does not provide that asset layer.
- Instead, we used stronger card hierarchy, status pills, and featured custom-deck framing to get most of the same UX effect without introducing fake content dependencies.

Current validation status:
- `CategorySelectionScreen.test.js` verifies:
  - playable custom deck sends the correct WebSocket invite
  - non-playable custom deck shows the deck-building guidance
- Existing dashboard regression tests remained green after this phase, which helps confirm the focused-flow changes did not destabilize adjacent navigation assumptions.

Current runtime review status:
- The linked `no active game` dashboard state now has real hardware proof on tablet: `Start New Game` routes cleanly into `CategorySelection`.
- The custom-deck not-ready state reads clearly on-device and explains why custom play is gated.
- Selecting a standard category from that same tablet flow transitions into the real invitation-pending gameplay surface instead of dropping the user back to dashboard or leaving them in a stale chooser state.
- A deeper recovery pass now also confirms the browse-to-game handoff survives a real app restart on phone. With a live backend session in `INVITED`, the phone cold-launched back into the dashboard’s `ACTIVE SESSION` hero, correctly labeled `ROUND1 • QUESTION 1/8`, and `Continue Game` routed back into the same Round 1 question screen.
- This means the current dashboard recovery path is no longer just visually correct for idle states; it has runtime proof for at least one real in-progress session resume path.

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

Current runtime review status:
- Phone and tablet both render the browse surface coherently with the new Velvet Midnight hierarchy.
- The empty custom-deck state reads clearly on-device, with the authored-count summary and `Add Custom Question` CTA behaving as the dominant next action.
- A later runtime pass completed populated-data validation too: a real authored question rendered in the list, opened in edit mode with the correct prefilled content, saved cleanly through the live update path, and deleted through the confirmation dialog. After deletion, the summary hero recomputed correctly and the authored list returned to the empty state.

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

Current runtime review status:
- The editor renders correctly on phone hardware and matches the intended focused-flow framing: strong title, supportive privacy copy, clear field sequence, and a strong primary `Create Question` action.
- A small-screen layout polish pass is now in code: extra bottom content spacing plus `keyboardShouldPersistTaps="handled"` give the secondary `Cancel` action more breathing room and make the form feel less one-way on phone-sized screens.
- Real-data edit behavior is now also verified on hardware: the editor hydrates existing authored content correctly, `Save Changes` returns to the list without losing the card, and the follow-on delete flow can remove that same saved item cleanly.

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

Current runtime review status:
- Phone empty-state review is strong: the archive framing and empty copy feel intentional, and the `Refresh` path remains visible and easy to understand.
- Populated-data runtime validation is now complete on hardware using a seeded history-bearing account.
- `Recent` and `Oldest` visibly reorder the archive as expected.
- `I Won` narrows correctly to the winning session only.
- `Partner Won` renders the dedicated filtered-empty state when no partner-win sessions exist.
- The filtered-empty `Show All` action correctly restores the full archive list.

## 8.12 Stats and Profile

Reference:
- [`profile_progression`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursApp/stitch%202/profile_progression/code.html)

Target files:
- [`StatsScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/StatsScreen.js)
- [`ProfileScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/ProfileScreen.js)

Required UI for `Stats`:
- couple progression
- personal progression
- milestone highlights
- achievements
- gameplay stats
- share celebration / achievement actions where supported

Required UI for `Profile`:
- avatar / identity
- username and bio
- edit profile action
- settings entry
- sign out

Corrective changes:
- replace invented entries like `Journal Archives` with real destinations/actions
- keep share actions where supported by the real product, but locate them in `Stats` rather than the identity/account surface

Current runtime review status:
- The browse IA now uses five tabs: `Home`, `History`, `Custom`, `Stats`, and `Profile`.
- `StatsScreen` owns progression, recent celebrations, achievements, and gameplay metrics, which removes the earlier redundancy between Home and Profile.
- `ProfileScreen` is now intentionally lean and account-focused: avatar, name, email, username, bio, `Edit Profile`, `Settings`, and `Sign Out`.
- No residual invented `Journal Archives`-style action was visible in the reviewed runtime surface.
- The first phone runtime pass exposed a useful implementation lesson: the initial `Stats` surface looked malformed despite green screen tests, which pointed to a combination of stale dev-runtime state and an overly layered screen composition. After a clean Metro refresh and a simplified `StatsScreen` built directly from `VelvetBrowseLayout`, `VelvetSectionCard`, `VelvetStatCard`, and `VelvetSecondaryButton`, the phone now renders progression, celebrations, metrics, and achievements correctly.
- A follow-up tablet sweep now also confirms the large-screen browse path is coherent after the IA split: `Stats` shows the intended progression-led surface, `Profile` remains lean and action-oriented, and the handoff into `Settings` still feels structurally correct.
- Tablet runtime review now also confirms the live `Sign Out` action works and returns the user to the Velvet Midnight auth surface rather than leaving the app in a broken intermediate shell.
- On large tablet surfaces, the lower profile actions are reachable, but the inner content column must be scrolled directly; broad outer-area swipes can make the page feel stuck even though the content is still scrollable. That should be treated as a tablet usability polish note rather than a core functional defect.

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

Current runtime review status:
- Phone runtime review confirms the real settings grouping is now coherent and faithful to product scope: theme, haptics, notification preferences, relationship controls, and replay onboarding are all present and readable.
- The active-game unlink safeguard is now strengthened in code: `SettingsScreen` also checks `/game/active`, renders unlink as an explicitly unavailable guarded action while a live session exists, and shows the “Finish or expire your active game before unlinking.” guidance before the user taps.
- This keeps the backend protection intact while making the destructive control more truthful in the interface.
- Recover-previous-partner is now runtime-validated end to end on phone hardware.
- The linked state renders correctly, unlink presents a final confirmation block with cooldown language and optional reason input, confirm unlink transitions the account into `COOLDOWN_ACTIVE`, and the same settings surface then exposes a `Recover Previous Partner` CTA with an absolute recovery timestamp.
- Recovering from that cooldown state returns the same account to the linked state and restores the normal `Unlink Partner` affordance.
- Backend verification after the runtime pass confirms both users in the disposable pair are again `LINKED` to the same couple record.
- Re-entry testing after sign-out on the original `alphatwo` throwaway account initially failed because the remembered local credentials were stale (`a2@t.co / Testpass123` returned a real backend `401 Invalid credentials`), so that specific observation should not be misclassified as a frontend/UI regression.
- A follow-up tablet runtime pass with a known-good paired account successfully restored the authenticated app shell, which closes the practical re-entry concern even though the old throwaway credentials remain invalid.
- Replay onboarding is now runtime-safe again. The bug came from trying to `replace('Onboarding')` directly from `SettingsScreen` before the route was mounted in the logged-in stack. The fix moved replay into a state-driven app-shell reset in `AppNavigator`, and a follow-up tablet hardware pass confirmed that tapping `Replay Onboarding` now lands on `STEP 1 OF 3` instead of throwing a navigator error.
- The auth-shell runtime is also more truthful now: the global real-time reconnection banner is hidden while signed out, which removes the misleading `No connection` state from the sign-in experience when there is no authenticated WebSocket session yet.
- A later shell-polish pass also themed the native `Settings` stack header from the active Velvet Midnight tokens. This removed the bright platform-default header that was visually clashing with the otherwise dark settings surface on tablet hardware.
- The latest tablet verification pass still shows that themed header in place and confirms the upper settings groups (`Theme`, `Haptics`, and `Notification Preferences`) remain readable after the `Stats/Profile` IA split.

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

Current implementation status:
- `GameScreen` now uses a true focused gameplay shell with the native stack header hidden at the navigator level so the in-screen Velvet top bar is the only visible framing.
- The live implementation preserves the existing `useGame()` contract and state machine. We did not change gameplay backend behavior; we changed how the same states are presented.
- The current in-code gameplay surfaces now cover:
  - loading / hydration
  - invitation pending
  - Round 1 answering
  - Round 1 to Round 2 transition
  - Round 2 guessing
  - submission feedback
  - waiting-for-partner review state
  - reconnect/offline banner driven by `wsConnectionState`
  - partner disconnected / returned notice banners driven from gameplay status payloads
  - explicit expired-session takeover state driven from gameplay status payloads and `410` hydration responses
- The main visual upgrades are:
  - stronger editorial question hierarchy
  - explicit round framing in the top bar
  - more distinct Round 2 tone and guess prompt
  - clearer option-card selection/submission treatment
  - a calmer, more emotionally intentional waiting state with dashboard fallback
  - route-aware partner-presence handling, with in-game notices preserved while `PARTNER_RETURNED` no longer interrupts browse surfaces with a modal alert
  - a hardened mobile transport path in `WebSocketService`, so recoverable STOMP/send failures now move the app into reconnecting state and warn in logs instead of surfacing as redbox-level dev errors

Implementation deviations from Stitch 2:
- We intentionally did not invent image-backed gameplay canvases because the current product data contract does not provide that asset layer.
- We also kept the active-question flow exitless from the top bar for safety, rather than introducing a casual close action that could increase accidental exits during live sessions.

## 8.15 Game: Round 2 Guessing

Reference:
- [`game_round_2_guessing`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursApp/stitch%202/game_round_2_guessing/code.html)

Target file:
- [`GameScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/GameScreen.js)

Required differentiation from Round 1:
- explicit “guess your partner’s answer” framing
- visible match/correctness context
- distinct selection treatment

Current implementation status:
- Round 2 now uses:
  - explicit guessing subtitle in the top bar
  - a dedicated “How did your partner answer this?” prompt panel
  - accent-toned option state treatment
  - running correctness context in the header status pill when data exists

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

Current implementation status:
- The waiting state now has:
  - clear completion acknowledgment
  - a centered emotional waiting hero
  - submitted-answer / submitted-guess review list
  - refresh-status action
  - partner presence notice banners when the other player disconnects or returns

## 8.17 Game: Expired Session and Presence Interruptions

Target file:
- [`GameScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/GameScreen.js)
- [`GameContext.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/state/GameContext.js)

Required UX:
- if the partner disconnects, the active gameplay surface should stay in place and explain that the session is still being held
- if the partner returns, the player should see a calm recovery notice instead of a modal interruption
- if the session expires, gameplay should switch into an explicit non-playable state with a clear dashboard recovery path

Current implementation status:
- `GameContext` now translates `PARTNER_LEFT`, `PARTNER_RETURNED`, and `SESSION_EXPIRED` status payloads into dedicated gameplay state instead of letting them remain alert-only side effects.
- `GameScreen` consumes that state as:
  - inline notice banners for partner-left / partner-returned events
  - a focused expired-session takeover with a single safe recovery action back to dashboard
- Hydration from `/game/:sessionId/current-question` now treats `410` as a first-class expired-session outcome, which matters because expiry can be discovered during reconnect/reload, not only from realtime events.
- `AuthContext` still preserves the broader recovery UX off-screen, but it now avoids duplicating alert interruptions when the user is already inside that exact game route and the gameplay screen can represent the status itself.

Validation status:
- `GameScreen.test.js` now verifies:
  - partner-left notice rendering during an active question
  - explicit expired-session rendering from a `410` hydration failure
- `GameContext.test.js` now verifies:
  - partner presence notice state
  - expired-session state transition
  - explicit back-to-dashboard fallback

Current validation status:
- `GameScreen.test.js` verifies:
  - loading state
  - custom question badge state
  - Round 2 guessing state
  - waiting-for-partner review state
  - invitation-pending state
  - reconnect banner treatment
- Existing transactional-screen regression tests stayed green after the gameplay refactor, which helps confirm the new gameplay shell did not destabilize adjacent focused-flow navigation.

Current runtime review status:
- Two-device hardware review now confirms the invite handoff path is coherent end to end in the redesigned UI:
  - inviter sees the dedicated invitation-pending surface
  - partner sees the route-level invitation modal
  - accepting the invite moves both devices into the same Round 1 gameplay screen
- On both phone and tablet, the first question renders clearly with the Velvet Midnight answering shell.
- Choosing an option and submitting advances both devices from Question 1 to Question 2, which gives us functional proof that the redesigned first-answer path is not just visually correct but operational.
- The later-phase recovery matrix is now runtime-proven too:
  - both devices advanced into real Round 2 guessing
  - a force-stop and reconnect on phone during Round 2 restored the session through the active-session dashboard hero at `ROUND2 • QUESTION 6/8`
  - `Continue Game` returned the phone to the correct live Round 2 question
  - after the faster phone finished Round 2, the dedicated waiting state rendered with the submitted-guess review list intact
  - a force-stop and reconnect from that waiting state again returned through the active-session hero, and `Continue Game` restored the waiting screen correctly
  - when the slower tablet finished the last Round 2 guess, the waiting phone transitioned into shared results automatically
- One UX nuance surfaced during this pass: on tablet landscape, the primary `Lock Selection` CTA sits just below the initial viewport and becomes visible after a small natural scroll. This is usable, but it is worth tracking as a potential layout polish opportunity if we want the first-answer CTA to remain fully above the fold on larger landscape devices.

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

Current implementation status:
- `ResultsScreen` now uses the Velvet Midnight screen primitives directly rather than a legacy utility layout:
  - `VelvetScreen`
  - `VelvetTopBar`
  - `VelvetHeroCard`
  - `VelvetSectionCard`
  - `VelvetStatCard`
  - `VelvetPrimaryButton`
  - `VelvetSecondaryButton`
  - `VelvetStatusPill`
- The screen now supports the complete intended state family:
  - loading results for a known `sessionId`
  - celebratory loaded result
  - `409` “Results Aren't Ready Yet” recovery state
  - unavailable fallback for `404` and non-recoverable failures
- It also now owns its own navigation chrome, and `AppNavigator` hides the native stack header for `Results` so the screen does not render duplicate headers.
- Exit actions now intentionally clear the temporary latest-results recovery snapshot so the dashboard does not keep surfacing stale completion context after the user has explicitly moved on.

Why this matters:
- Backend semantics here are meaningful: `409` does not mean the result is gone, it means the session exists but the finishing condition has not been met yet. Treating that as a distinct user-facing state prevents a dead-end experience when one partner opens Results early from a notification or deeplink.

Validation status:
- `ResultsScreen.test.js` now verifies:
  - normal happy-path rendering
  - share-result action
  - play-again and dashboard exits
  - dedicated `409` not-ready recovery state
  - refresh-from-not-ready behavior
- Manual runtime validation now also proves:
  - real finished sessions render on-device results with correct scores on both devices
  - `Share Result Card` opens the native Android share sheet with a generated image payload
  - `Play Again` exits results into `CategorySelection` for a fresh session flow
  - `Back to Dashboard` now returns to the linked dashboard on hardware on both phone and tablet after recreating a fresh clean results route specifically for that validation

Manual runtime note:
- The functional results path is now proven end to end, and the main remaining work on this screen is visual QA rather than missing implementation.
- On-device Android validation now reaches the real auth UI through the dev client, which confirms the app boots on hardware.
- A later shared-foundation polish pass also deepened the light-mode token hierarchy and browse-shell atmosphere so auth and dashboard surfaces no longer read like flat near-white utility screens in `system` / `light`. This improved brand coherence on-device, but the approved design intent still treats dark mode as the hero expression of Velvet Midnight.
- The full two-device gameplay path is now runtime-proven on a phone and tablet:
  - invite from category selection
  - accept on the partner device
  - Round 1 answering
  - Round 2 guessing
  - waiting-for-partner after the faster finisher completes Round 2
  - final shared results on both devices once the slower device finishes
- This closes the earlier uncertainty around later-round completion and real results reveal behavior.
- The post-completion continuity gap has now been addressed in code. `GameContext` persists a short-lived `latest_completed_session_v1` snapshot, `useDashboardGameFlow` exposes it, and `DashboardScreen` renders a dedicated `results_ready` hero with a `View Latest Results` recovery path instead of dropping the user into a generic fresh-start state.
- Follow-up regression after the shared shell/token polish also confirmed:
  - phone can still deep-link into the real auth surface through the dev client
  - tablet dark browse surfaces remain visually coherent after enabling browse atmosphere by default
  - `Start New Game` still transitions from dashboard into `CategorySelection` on tablet after the shell changes
- Seeded device validation on phone confirmed that this recovery hero renders with real completed-session data after app rehydration, and a follow-up dashboard polish pass moved the primary recovery CTA above the metadata block so the action is visible earlier on smaller screens.
- Broader frontend regression is also green after these flows: `npm test -- --runInBand` passed with 26/26 suites and 127/127 tests.

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
- `StatsScreen` now uses `VelvetBrowseLayout` as its outer browse container
- `ProfileScreen` now uses `VelvetBrowseLayout` as its outer browse container
- Native stack headers are hidden for browse destinations so the Velvet shell remains the visible source of browse-surface framing
- `PartnerLinkScreen`, `CategorySelectionScreen`, and `CustomQuestionEditorScreen` now use the focused shell path with native stack headers hidden
- The `Stats` browse destination now intentionally stays flatter than the old profile-growth composition: direct section cards, direct stat cards, and simpler share buttons proved more reliable in live runtime than reusing a more nested account-oriented surface structure.

Implementation note:
- The remaining Phase 2 work is no longer “invent the shell abstraction.”
- Browse-screen framing is now standardized through `VelvetBrowseLayout`.
- The main browse tabs no longer render a redundant in-screen top title/subtitle by default; the active tab state in the bottom nav is now treated as the primary browse-location indicator.
- Later polish also increased the visual weight of the bottom-nav icons and then reworked the footer into a full-width equal-flex layout so Home/History/Custom/Stats/Profile fit on phone and tablet without clipping the rightmost tab.
- Focused-screen top-bar/back behavior is now standardized through `VelvetFocusedScreen`.
- Later phases can now consume the shell system rather than inventing new framing patterns.

Rules:
- top bar varies by screen mode
- bottom nav only on browse/hub surfaces
- shell blur/background treatment should be centralized, not reauthored per screen
- safe-area ownership should stay explicit to avoid doubled insets:
  - browse layout owns top/left/right framing when no in-screen browse header is shown
  - top bar owns top inset when a screen opts into a browse or focused header
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
- `DashboardScreen` now also directly consumes `VelvetPrimaryButton`, `VelvetSecondaryButton`, `VelvetStatusPill`, and `VelvetProgressBar` for its stateful hero and section actions

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
