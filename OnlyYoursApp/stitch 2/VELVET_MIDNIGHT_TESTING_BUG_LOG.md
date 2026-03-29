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
- Why it matters:
  - This does not block play, but it weakens the visual identity of the overhaul and creates mismatch against the approved Stitch 2 direction.
- Recommended next action:
  - Run the dedicated light/dark/system polish pass and decide whether gameplay should default more aggressively into the dark-luxe treatment or receive stronger contrast/glow treatment in light mode.

### VM-OPEN-002
- Title: Hard relaunch after results loses the just-finished results context
- Status: `Open`
- Severity: `P2`
- Area: post-completion recovery / results continuity
- Evidence:
  - Waiting state before relaunch: [`/tmp/onlyyours-phone-waiting-check.png`](/tmp/onlyyours-phone-waiting-check.png)
  - Results arriving live after the partner finished: [`/tmp/onlyyours-phone-after-tablet-submit.png`](/tmp/onlyyours-phone-after-tablet-submit.png)
  - Post-results relaunch landing state: [`/tmp/onlyyours-phone-results-relaunch.png`](/tmp/onlyyours-phone-results-relaunch.png)
- What we saw:
  - The broader in-progress recovery matrix is now materially proven:
    - `INVITED` recovery
    - Round 1 recovery
    - Round 2 recovery
    - waiting-state recovery through the dashboard hero plus `Continue Game`
    - live transition from waiting into shared results when the slower partner finishes
  - The remaining rough edge is specifically after the session is fully complete. When the phone is hard-relaunched from the results state, it reconnects into the normal linked dashboard `Ready to Begin` hero instead of recovering the just-finished results context.
- Why it matters:
  - If a user leaves or crashes out immediately after a completed game, the emotional payoff is no longer preserved on reopen unless they already saw the results or returned via a results-specific route/notification.
- Recommended next action:
  - Decide whether the app should persist the latest completed `sessionId` long enough to recover directly into `Results`, or at least surface a prominent “View latest results” CTA on the dashboard after completion.

### VM-OPEN-003
- Title: Results screen is still not fully restyled to the Velvet Midnight spec
- Status: `Open`
- Severity: `P3`
- Area: results / final-screen polish
- Evidence:
  - Already called out in [`VELVET_MIDNIGHT_EXECUTION_TRACKER.md`](/Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursApp/stitch%202/VELVET_MIDNIGHT_EXECUTION_TRACKER.md)
- What we saw:
  - Results behavior is functionally closed, but the broader visual redesign of `ResultsScreen` has not yet reached the same polish level as the newer dashboard/gameplay surfaces.
- Why it matters:
  - Results is a flagship emotional moment and should match the premium “keepsake” direction of the redesign.
- Recommended next action:
  - Include `ResultsScreen` in the next visual polish slice after gameplay/system-mode review.

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
  - The earlier branch-specific uncertainty is now fully closed for in-progress sessions. The remaining recovery concern moved forward into post-completion results continuity and is tracked separately as `VM-OPEN-002`.

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
2. `VM-OPEN-002` Decide and implement post-results recovery behavior
3. `VM-OPEN-003` Finish Results screen visual overhaul
4. Keep using manual entry for auth certification when needed until `VM-BLOCKER-001` has a better automation workaround
