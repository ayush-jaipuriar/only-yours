# Velvet Midnight Testing Bug Log

Date: March 29, 2026  
Scope: Android runtime QA, adb-assisted testing, Jest validation, and local backend/device integration checks for the Velvet Midnight overhaul.

Companion docs:
- [`VELVET_MIDNIGHT_EXECUTION_TRACKER.md`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursApp/stitch%202/VELVET_MIDNIGHT_EXECUTION_TRACKER.md)
- [`VELVET_MIDNIGHT_IMPLEMENTATION_SPEC.md`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursApp/stitch%202/VELVET_MIDNIGHT_IMPLEMENTATION_SPEC.md)

## How To Read This Log

Status values:
- `Open`: confirmed product bug still unresolved
- `Fixed`: confirmed product bug found during testing and now resolved
- `Testing blocker`: issue that affects QA reliability or local test conditions, but is not necessarily a product defect
- `Not a product bug`: investigated and intentionally closed as expected behavior, stale data, or automation noise

Severity guide:
- `P1`: blocks a core user flow
- `P2`: meaningful functional or UX defect
- `P3`: polish or correctness issue that does not block the core path

---

## Open Product Bugs

### VM-OPEN-001
- Title: Gameplay surfaces still read lighter/softer than the intended Velvet Midnight hero mode
- Status: `Open`
- Severity: `P3`
- Area: UI polish / gameplay theming
- Evidence:
  - Phone gameplay screenshot: [`/tmp/onlyyours-phone-round1.png`](/tmp/onlyyours-phone-round1.png)
  - Tablet gameplay screenshot: [`/tmp/onlyyours-tablet-round1.png`](/tmp/onlyyours-tablet-round1.png)
  - Post-polish phone screenshot: [`/tmp/onlyyours-phone-after-select.png`](/tmp/onlyyours-phone-after-select.png)
  - Post-polish tablet screenshot: [`/tmp/onlyyours-tablet-after-continue.png`](/tmp/onlyyours-tablet-after-continue.png)
- What we saw:
  - The Round 1 screen is functionally solid, but in the current runtime it still reads as a pale blush/light-mode surface rather than the intended dark-plum, cinematic Velvet Midnight target.
  - This is especially noticeable on gameplay, which was meant to be one of the strongest “focused” dark-luxe moments in the redesign.
  - A follow-up tablet dark-mode check showed that the dark shell is much closer to the intended brand direction, which narrows the problem: the main mismatch is the light/system presentation, not the entire gameplay visual system.
  - A focused polish pass improved the hierarchy in code: the focused atmosphere is richer, hero/footer surfaces are stronger, and selected option states are much clearer on phone and tablet. The issue is no longer “gameplay looks wrong everywhere”; it is now specifically that light/system mode still feels softer than the approved hero direction.
  - A later shared-foundation polish pass also deepened the browse/auth light-mode palette, turned atmospheric browse backgrounds on by default, and strengthened light-mode shell surfaces. Real-device regression after that pass shows the phone auth shell now feels more intentionally branded than before, while the tablet browse and category-selection surfaces remain strong. The remaining gap is not “light mode is broken”; it is that light mode is still softer than the dark hero mode and may still need one more contrast pass if we want an even more dramatic evening feel in `system` / `light`.
- Why it matters:
  - This does not block play, but it weakens the visual identity of the overhaul and creates mismatch against the approved Stitch 2 direction.
- Recommended next action:
  - Run the dedicated light/dark/system polish pass and decide whether gameplay should default more aggressively into the dark-luxe treatment or receive stronger contrast/glow treatment in light mode. The main remaining question is now visual preference and brand intensity, not flow correctness.

---

## Fixed Product Bugs

### VM-FIXED-001
- Title: Replay Onboarding from Settings failed with navigator error
- Status: `Fixed`
- Severity: `P1`
- Area: onboarding / settings navigation
- Symptom:
  - Tapping `Replay Onboarding` from Settings produced:
    - `The action 'REPLACE' with payload {"name":"Onboarding"} was not handled by any navigator`
- Root cause:
  - `SettingsScreen` tried to navigate directly to `Onboarding` before that route existed in the currently mounted logged-in stack.
- Fix:
  - [`AppNavigator.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/navigation/AppNavigator.js) now resets into `Onboarding` at the app-shell level when auth/onboarding state requires it.
  - [`SettingsScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/SettingsScreen.js) no longer issues a direct `navigation.replace('Onboarding')`.
- Validation:
  - Jest:
    - [`SettingsScreenFlow.test.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/state/__tests__/SettingsScreenFlow.test.js)
    - [`OnboardingScreenFlow.test.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/state/__tests__/OnboardingScreenFlow.test.js)
  - Hardware:
    - tablet runtime now lands on `STEP 1 OF 3` successfully

### VM-FIXED-002
- Title: Signed-out auth flow displayed a misleading global `No connection` banner
- Status: `Fixed`
- Severity: `P2`
- Area: auth shell / realtime status UX
- Symptom:
  - The sign-in screen showed a top-level `No connection` banner even though the user was signed out and no authenticated WebSocket session should exist yet.
- Root cause:
  - [`App.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/App.js) rendered `ReconnectionBanner` globally regardless of auth state.
- Fix:
  - `ReconnectionBanner` is now rendered only when `isLoggedIn` is true.
- Validation:
  - Phone and tablet sign-in surfaces were rechecked and no longer show the misleading banner while signed out.

### VM-FIXED-003
- Title: Dashboard active-session recovery did not have trustworthy runtime proof
- Status: `Fixed` for the tested branch
- Severity: `P2`
- Area: dashboard / active session handoff
- Symptom:
  - Earlier runtime observations suggested a user might land on browse/transactional surfaces instead of the active session after leaving gameplay.
- What testing proved after follow-up:
  - With a real backend session in `INVITED`, the phone cold-launched back to the `ACTIVE SESSION` dashboard hero.
  - `Continue Game` routed into `Invitation Pending`.
  - After moving into Round 1 and force-stopping the phone mid-question, the app cold-launched back to the active-session hero labeled `ROUND1 • QUESTION 1/8`.
  - `Continue Game` returned to the same live question screen.
- Important note:
  - The earlier branch-specific uncertainty is now fully closed for in-progress sessions. The remaining recovery concern moved forward into post-completion results continuity and was later closed as `VM-FIXED-007`.

### VM-FIXED-006
- Title: Later-phase active-session recovery lacked real-device proof
- Status: `Fixed`
- Severity: `P2`
- Area: Round 2 / waiting-state continuation
- Symptom:
  - Earlier runtime review had only proven early-session recovery branches, leaving open questions around Round 2 and waiting-state leave-and-return behavior.
- What follow-up testing proved:
  - The real two-device session advanced into Round 2 on both devices.
  - A force-stop and reconnect on phone during Round 2 returned the user to the `ACTIVE SESSION` dashboard hero at `ROUND2 • QUESTION 6/8`.
  - Tapping `Continue Game` returned the phone to the correct live Round 2 question.
  - After the faster phone finished Round 2, it entered the dedicated waiting state with the submitted-guess review list intact.
  - A force-stop and reconnect from that waiting state returned the phone to the dashboard active-session hero at `ROUND2 • QUESTION 8/8`, and `Continue Game` restored the dedicated waiting screen correctly.
  - When the slower tablet finished the last Round 2 guess, the waiting phone transitioned into the results screen automatically.
- Validation:
  - Round 2 relaunch screenshot: [`/tmp/onlyyours-phone-reconnected-app-3.png`](/tmp/onlyyours-phone-reconnected-app-3.png)
  - Round 2 `Continue Game` screenshot: [`/tmp/onlyyours-phone-round2-continue-2.png`](/tmp/onlyyours-phone-round2-continue-2.png)
  - Waiting-state screenshot: [`/tmp/onlyyours-phone-after-finish-attempt.png`](/tmp/onlyyours-phone-after-finish-attempt.png)
  - Waiting-state relaunch dashboard hero: [`/tmp/onlyyours-phone-waiting-relaunch.png`](/tmp/onlyyours-phone-waiting-relaunch.png)
  - Waiting-state restore via `Continue Game`: [`/tmp/onlyyours-phone-waiting-continue.png`](/tmp/onlyyours-phone-waiting-continue.png)

### VM-FIXED-007
- Title: Hard relaunch after results no longer drops all completion context
- Status: `Fixed`
- Severity: `P2`
- Area: post-completion recovery / results continuity
- Original symptom:
  - After a session completed, a hard relaunch returned the user to the normal linked dashboard `Ready to Begin` hero with no way back into the just-finished reveal.
- Fix:
  - [`GameContext.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/state/GameContext.js) now persists a short-lived `latest_completed_session_v1` snapshot whenever `GAME_RESULTS` arrives.
  - [`useDashboardGameFlow.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/useDashboardGameFlow.js) now exposes that persisted recovery context.
  - [`DashboardScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/DashboardScreen.js) now renders a dedicated `results_ready` hero with a `View Latest Results` recovery path instead of treating the user like they are starting cold.
- Validation:
  - Jest now covers the recovery path in:
    - [`DashboardScreen.test.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/__tests__/DashboardScreen.test.js)
    - [`useDashboardGameFlow.test.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/state/__tests__/useDashboardGameFlow.test.js)
  - A seeded AsyncStorage runtime pass on phone rendered the new recovery hero successfully with real completed-session data and the corrected `Results ready` badge.
- Important note:
  - We validated the recovery hero itself on-device using a seeded persisted payload rather than replaying the full game flow a second time immediately. The actual `Results` navigation contract from that hero remains covered by automated screen tests.

### VM-FIXED-008
- Title: Results screen was still using pre-overhaul presentation and native-stack chrome
- Status: `Fixed`
- Severity: `P3`
- Area: results / final-screen polish
- Original symptom:
  - `ResultsScreen` had stronger backend handling than before, but it had not yet been fully brought into the Velvet Midnight visual system and still depended on the native stack header.
- Fix:
  - [`ResultsScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/ResultsScreen.js) now uses Velvet Midnight hero, section, stat, button, and top-bar primitives for the happy path and recovery states.
  - [`AppNavigator.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/navigation/AppNavigator.js) now hides the native stack header for `Results` so the screen owns its own chrome consistently.
  - `Play Again` and `Back to Dashboard` now also clear the temporary latest-results recovery context on intentional exit.
- Validation:
  - [`ResultsScreen.test.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/__tests__/ResultsScreen.test.js) stayed green across happy path, share action, exit actions, and `409` recovery behavior.

### VM-FIXED-009
- Title: Latest-results recovery hero showed the wrong badge and buried the primary CTA on phone
- Status: `Fixed`
- Severity: `P3`
- Area: dashboard / recovery UX polish
- Original symptom:
  - The new dashboard recovery hero initially rendered the badge as `LINK REQUIRED` because the `results_ready` branch fell through the old label logic.
  - On phone, the real `View Latest Results` CTA sat too low in the hero, so the recovery action was less immediate than intended.
- Fix:
  - [`DashboardScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/DashboardScreen.js) now gives `results_ready` its own explicit `Results ready` badge label.
  - The results-recovery action row now renders above the metadata block so the resume action appears earlier in the card on smaller screens.
  - The dashboard loading state was also moved onto `VelvetScreen` + `VelvetHeroCard`, which makes the temporary loading shell feel aligned with the browse system instead of like a plain utility view.
- Validation:
  - Seeded phone screenshot after the fix: [`/tmp/onlyyours-phone-posttap-settled.png`](/tmp/onlyyours-phone-posttap-settled.png)
  - Dashboard screen tests remained green after the layout change.

### VM-FIXED-010
- Title: Settings screen kept a bright native header that broke the Velvet Midnight shell
- Status: `Fixed`
- Severity: `P3`
- Area: settings / shell polish
- Original symptom:
  - On tablet hardware, the `Settings` content rendered with the dark Velvet Midnight surface stack, but the native stack header remained bright white.
  - That created a visual seam at the top of the screen and made `Settings` feel like a partially migrated route.
- Fix:
  - [`SettingsScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/SettingsScreen.js) now themes the native header via `navigation.setOptions(...)` using the active Velvet Midnight tokens.
  - The header title, back arrow tint, and background now follow the current theme instead of using the platform default.
- Validation:
  - Jest:
    - [`SettingsScreenFlow.test.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/state/__tests__/SettingsScreenFlow.test.js)
    - [`ThemeProvider.test.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/theme/__tests__/ThemeProvider.test.js)
  - Hardware:
    - themed settings screenshot: [`/tmp/onlyyours-tablet-settings-headerfix.png`](/tmp/onlyyours-tablet-settings-headerfix.png)

### VM-FIXED-011
- Title: Five-tab bottom nav clipped the `Profile` tab on phone
- Status: `Fixed`
- Severity: `P2`
- Area: browse shell / bottom navigation responsiveness
- Original symptom:
  - After expanding the browse footer to `Home`, `History`, `Custom`, `Stats`, `Profile`, the rightmost `Profile` tab was partially pushed off-screen on phone.
- Fix:
  - [`VelvetBottomNav.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/components/velvet/VelvetBottomNav.js) now uses full-width safe-area/container sizing plus equal-flex nav items instead of a four-tab-biased fixed-width layout.
  - Phone spacing was tightened further with lower horizontal padding, label centering, and explicit width handling so all five tabs fit consistently.
- Validation:
  - Phone footer screenshot after the fix: [`/tmp/onlyyours-phone-nav-check-5.png`](/tmp/onlyyours-phone-nav-check-5.png)
  - Tablet footer remained coherent: [`/tmp/onlyyours-tablet-nav-check-2.png`](/tmp/onlyyours-tablet-nav-check-2.png)
  - Phone runtime also successfully continued through `Profile` and into `Settings` after the fix:
    - [`/tmp/onlyyours-phone-profile.png`](/tmp/onlyyours-phone-profile.png)
    - [`/tmp/onlyyours-phone-settings-flow-2.png`](/tmp/onlyyours-phone-settings-flow-2.png)

### VM-FIXED-012
- Title: `Stats` tab rendered malformed on phone runtime after the five-tab IA split
- Status: `Fixed`
- Severity: `P2`
- Area: stats tab / browse-surface runtime rendering
- Original symptom:
  - After the new `Home`, `History`, `Custom`, `Stats`, `Profile` footer landed, the phone could navigate into `Stats`, but the live surface looked nearly empty instead of showing progression, celebrations, metrics, and achievements.
  - The footer correctly highlighted `Stats`, which made this especially confusing: the route itself was active, but the body did not resemble the intended screen.
- What we learned:
  - Focused Jest coverage for [`StatsScreenFlow.test.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/state/__tests__/StatsScreenFlow.test.js) was already green, which narrowed the problem to runtime rendering rather than the basic screen contract.
  - A clean Expo restart and direct runtime logging showed that real data was present on-device; the more brittle part was the prior nested screen composition plus stale dev-runtime state.
- Fix:
  - The Metro/dev-client bundle was refreshed with a clean cache so the phone was running the current code.
  - [`StatsScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/StatsScreen.js) was simplified to use direct Velvet primitives instead of the earlier more layered composition:
    - `VelvetBrowseLayout`
    - `VelvetSectionCard`
    - `VelvetStatCard`
    - `VelvetSecondaryButton`
  - The screen now renders progression, recent celebrations, game stats, and achievements directly from `useDashboardGameFlow(...)` in a flatter, more predictable browse layout.
- Validation:
  - Focused Jest regression still passed after the simplification:
    - [`StatsScreenFlow.test.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/state/__tests__/StatsScreenFlow.test.js)
    - [`ProfileScreenFlow.test.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/state/__tests__/ProfileScreenFlow.test.js)
    - [`DashboardScreen.test.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/__tests__/DashboardScreen.test.js)
  - Phone runtime now shows the intended simplified stats surface:
    - [`/tmp/onlyyours-phone-stats-simplified.png`](/tmp/onlyyours-phone-stats-simplified.png)

### VM-FIXED-004
- Title: Settings unlink control was not truthful enough while an active game existed
- Status: `Fixed`
- Severity: `P2`
- Area: settings / relationship controls
- Symptom:
  - The unlink path previously leaned too heavily on backend rejection instead of clearly telling the user up front that unlinking was unavailable during an active session.
- Fix:
  - [`SettingsScreen.js`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/src/screens/SettingsScreen.js) now loads `/game/active`, disables the unlink affordance when a live game blocks it, and surfaces the guidance before the user taps.
- Validation:
  - Hardware review confirmed the guarded unlink state renders correctly and no longer depends on a post-tap failure to explain itself.

### VM-FIXED-005
- Title: Earlier STOMP/dev-runtime transport failures could escalate into redbox-level breakage
- Status: `Fixed`
- Severity: `P2`
- Area: realtime transport / gameplay resilience
- Symptom:
  - During earlier gameplay/device testing, recoverable realtime failures were surfacing too harshly in development.
- Fix:
  - The mobile transport path was hardened so recoverable STOMP/send failures move the app into reconnecting state and warn in logs instead of blowing up the dev runtime.
- Validation:
  - The reproduced phone flow no longer redboxes under the same class of reconnect scenario.

---

## Testing Blockers And Environment Issues

### VM-BLOCKER-001
- Title: adb text entry is unreliable for auth certification on the connected devices
- Status: `Testing blocker`
- Severity: `P2`
- Area: automation reliability
- What we saw:
  - On phone, `%40` was inserted literally instead of `@`
  - follow-up text sometimes appended into the wrong field because the soft keyboard changed the scroll geometry between taps
- Why it matters:
  - This makes blind `adb shell input text ...` unreliable for email/password sign-in validation
- Current practice:
  - Use manual typing for auth certification, or seed auth state when testing later navigation/runtime flows

### VM-BLOCKER-002
- Title: Local device API host was misconfigured during runtime QA
- Status: `Testing blocker`
- Severity: `P2`
- Area: local environment
- What we saw:
  - `OnlyYoursExpo/.env` and `.env.local` pointed at `192.168.1.100:8080`, which was the phone IP, not the laptop/backend host.
  - The backend was also not running on `8080` at one point.
- Why it matters:
  - This produced misleading `No connection` and server-unreachable states during testing.
- Fix applied:
  - Both env files now point to the correct laptop LAN IP `192.168.1.102:8080`
  - backend was restarted and verified healthy via `/actuator/health`

### VM-BLOCKER-003
- Title: Dev-client hard relaunch testing includes Expo reattachment noise
- Status: `Testing blocker`
- Severity: `P3`
- Area: local runtime harness
- What we saw:
  - After a force-stop, the physical phone can briefly land in the Expo dev-client launcher or a blank reconnect surface before the running Metro bundle is reattached via the `exp+only-yours://expo-development-client/...` deep link.
- Why it matters:
  - This can masquerade as an app recovery issue if we do not distinguish “dev client reconnecting to Metro” from “Only Yours resumed into the wrong product screen.”
- Current practice:
  - Treat the dev-client launcher/blank reconnect surface as testing harness noise.
  - Evaluate recovery only after the JavaScript bundle is reattached and the app shell is back on-screen.

### VM-BLOCKER-004
- Title: Full AsyncStorage database swaps can perturb dev-session auth state during forced theme QA
- Status: `Testing blocker`
- Severity: `P3`
- Area: theme validation harness
- What we saw:
  - Replacing the entire `RKStorage` database is effective for forcing `theme_preference_v1` and proving theme hydration paths, but it can also disturb unrelated local session context on the debug build.
  - During the forced tablet light-mode pass, the app relaunched into the auth shell rather than returning cleanly to the previously authenticated dashboard route.
- Why it matters:
  - This can look like a product auth regression even though it is a side effect of blunt local-storage manipulation during debug-only QA.
- Current practice:
  - Use full-database swaps only for targeted theme validation.
  - Restore the original database afterward and do not treat resulting auth-shell changes as ordinary user-path behavior unless they can be reproduced without storage injection.

---

## Investigated And Closed As Not Product Bugs

### VM-NOTBUG-001
- Title: Round 1 question-number mismatch across devices
- Status: `Not a product bug`
- Severity: `Closed investigation`
- What we saw:
  - One device could show Question 3 while the other still showed Question 2.
- Investigation result:
  - This matches the product model. Round 1 is intentionally asynchronous per user.
  - Each player advances through their own next unanswered question independently.
- Conclusion:
  - Keep documented as expected behavior, not a sync defect.

### VM-NOTBUG-002
- Title: Earlier `alphatwo` sign-in re-entry failure
- Status: `Not a product bug`
- Severity: `Closed investigation`
- What we saw:
  - Old remembered credentials for the `alphatwo` throwaway account failed on re-entry.
- Investigation result:
  - Backend returned a real `401 Invalid credentials`; this was stale test-data drift, not a frontend regression.
- Conclusion:
  - Do not treat this as an auth UI bug.

### VM-NOTBUG-003
- Title: Temporary launcher/app-switch state on phone during invite testing
- Status: `Not a product bug`
- Severity: `Closed investigation`
- What we saw:
  - During one invite-check snapshot, the phone was sitting in the launcher app drawer instead of the app.
- Investigation result:
  - Bringing `com.onlyyoursapp/.MainActivity` to the front restored the correct app state, and the subsequent runtime checks behaved normally.
- Conclusion:
  - Treat as device/foreground-state noise, not an Only Yours UI defect.

---

## Current Priority Order

1. `VM-OPEN-001` Gameplay/system-mode visual polish against the Velvet Midnight target
2. Re-run one clean phone/tablet visual pass once the next polish slice lands so the refreshed results/dashboard/settings surfaces are reviewed without seeded-state shortcuts
3. Keep using manual entry for auth certification when needed until `VM-BLOCKER-001` has a better automation workaround
