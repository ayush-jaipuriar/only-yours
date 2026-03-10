# Only Yours - P2 Implementation Plan (Detailed)

Date: Feb 22, 2026  
Status: Drafted from finalized user clarifications; ready for implementation

---

## 1) Planning Principles (Locked)

- Quality-first delivery; no fixed timeline pressure.
- Local-first validation for mobile before any cloud-heavy path.
- Parallel tracks allowed, but only one active game session per couple at a time.
- Feature delivery is phased by **screen priority**, then expanded to full end-to-end coverage.
- CI/CD release automation runs only on release branch.
- GCP Secret Manager integration is required from day one of this phase.
- Execution workflow is mandatory for each phase:
  1. Create in-depth phase/sprint planning `.md` with implementation checklists.
  2. Wait for explicit user approval before implementation.
  3. After implementation, run comprehensive automated tests (unit + integration + regression).
  4. Report completion only after tests pass and implementation confidence is high.

---

## 2) Finalized Product Decisions (Source of Truth)

### Gameplay / Session Lifecycle

- Keep both play modes (real-time + async continuation model).
- Allow only one active game session at a time per couple.
- Keep the current sequential game flow: show only the current question; after submit, unlock and show the next question.
- Round 2 unlock condition: only after **both players complete all Round 1 answers**.
- Results reveal condition: when **both users complete Round 2**.
- If one player resumes later, the other receives a **Continue Game** CTA card.
- Inactive session auto-expiry: **7 days**.

### Notifications / Reminders

- One reminder per user, scheduled in that user's local timezone.
- Quiet hours at night are required.
- Reminder time is user-configurable.
- Push-related P2 testing is gated on completed Android Firebase setup.

### Couple / Relationship Management

- Unlink flow uses 2-step confirmation + **24-hour cooldown**.
- Unlink is recoverable from settings.
- Couple timeline remains merged.

### Stats / History / Gamification

- Game history includes pagination + sort (recent/oldest) + win filters.
- Dashboard metrics include: games played, average score, streak, acceptance rate, response time.
- Initial gamification scope through `Phase D`: badges only, with generated gradient backgrounds.
- Post-`Phase D` expansion adds levels + XP + expanded badges, centered on consistency and completion over pure competition.

### UX / Design System

- Onboarding appears during signup and is reopenable in settings.
- Design direction: richer illustrated storytelling flow.
- Theme direction: light + dark token system, romantic red gradient language, smooth/cute/bubbly animation style.
- Dark mode post-`Phase D` direction: premium romantic evening feel, not just token parity.
- Responsive support target: landscape on all screens including game (tablet-friendly).
- Haptics post-`Phase D`: subtle semantic cues, enabled by default with in-app opt-out.
- Accessibility post-`Phase D`: screen-reader baseline across all primary flows.

### Content / Sharing

- Custom questions are planned as a couple-private shared library.
- Custom question format stays aligned with the current gameplay engine: question text + four answer options.
- Custom questions are played through a dedicated custom deck/category, not mixed into standard categories by default.
- Social sharing scope is external/native-share-sheet only for first release.
- Shared output defaults to privacy-safe summary cards; no raw answers or sensitive question text.

### Reliability / Reconnection Behavior

- Prompt reconnect when disconnected.
- If a user exits mid-game, partner is informed.
- Async continuation is supported: answer/guess/result progression remains recoverable across app sessions.
- Completion notifications should deep-link users back into relevant game/result surfaces.

### Security / DevOps

- Keep link code length at 8 characters.
- Release pipeline restricted to release branch.
- GCP Secret Manager integration from start of implementation.
- Explicit rollback strategy required (app rollback + migration rollback policy).

---

## 3) Hotfixes Already Completed Before P2 Buildout

- [x] Keyboard overlap fix on auth screens (`SignIn`, `SignUp`, `ForgotPassword`, `ResetPassword`).
- [x] Input text contrast fix for dark-mode system settings.
- [x] Baseline orientation/tablet responsiveness updates (`app.json` + `GameScreen` responsive layout behavior).

Reference updates:
- `DEVELOPMENT_PLAN.md` (Post-Sprint stabilization section)
- `MANUAL_TESTING_GUIDE_SPRINT6.md` (UI hotfix verification section)

---

## 4) Execution Strategy (Screen-Priority Phasing)

This plan intentionally ships by user-facing surface priority, then stitches complete end-to-end behavior.

Tracking rule:
- Mark each checklist item `[x]` only when code + tests + docs are complete.
- If code is done but validation is pending, keep item unchecked.

Priority and effort legend:
- `Critical`: blocks core gameplay correctness or data integrity.
- `High`: required for phase completion and user-facing value.
- `Medium`: important but can follow core path once blockers are done.
- Effort is best-effort estimate for focused implementation time (excluding waiting/coordination).

### 4.1 Cross-Phase Dependency Map

Primary critical path:
1. `Phase A (A1 -> A2 -> A3/A4 -> A5 -> A6)`
2. `Phase B (B1 + B3 -> B2 + B4 -> B5 -> B6)`
3. `Phase C (C2 -> C1 -> C3 -> C4)`
4. `Phase D (D1 + D2 -> D3 -> D4)`
5. `Phase E (E1 -> E2 -> E3 -> E4)`
6. `Phase F (F1 -> F2 -> F3)`
7. `Phase G (G1 -> G2 -> G3)`
8. `Phase H (H1 -> H2 -> H3 -> H4 -> H5)`
9. `Phase I (I1 -> I2 -> I3 -> I4)`
10. `Phase J (J1 -> J2 -> J3 -> J4 -> J5)`
11. `Phase K (K1 -> K2 -> K3 -> K4)`

Cross-phase dependencies:
- `B3/B4` (stats) depend on `A2` stabilized round/state transitions.
- `B5` (badges) depends on `B3` metrics and `B1` history events.
- `C3` responsive rollout should start after token foundation in `C2`.
- `D3` deep-link notifications depend on `A3` event contract.
- `E1/E2` dark-mode completion depends on `C2` theme token foundation being stable.
- `F1/F2` accessibility pass depends on `E` screen/system parity to avoid duplicate audits.
- `G1` haptic mapping depends on `D3` notification/game event surfaces and `F` accessibility rules for non-visual alternatives.
- `H2/H3` custom questions depend on `A2` session integrity and `D1` couple lifecycle guardrails.
- `I2` sharing cards depends on `E` visual system and `J` milestone metadata for milestone-sharing surfaces.
- `J2/J3` progression model depends on `B3/B5` existing stats and badge foundations.
- `K3` rollback runbook depends on schema/API/event changes introduced across `A` through `J`.

### Phase A - Game Continuation Core (Highest Product Risk)

#### Phase A priority + estimate + dependency board

| Item | Priority | Estimate | Depends on |
|---|---|---|---|
| A1 Data model and lifecycle hardening | Critical | 1.5-2 days | none |
| A2 Backend game-state enforcement | Critical | 2-2.5 days | A1 |
| A3 Realtime event contract | High | 1-1.5 days | A2 |
| A4 Frontend experience | High | 1.5-2 days | A2, A3 |
| A5 Testing and validation | Critical | 1-1.5 days | A2, A3, A4 |
| A6 Documentation | High | 0.5-1 day | A5 |

#### A1) Data model and lifecycle hardening checklist

- [x] Add `expiresAt` to active game session data model (7-day TTL from session creation or last activity, as finalized in implementation).
- [x] Add session lifecycle metadata needed for async resume (for example: `lastActivityAt`, round completion counters/flags).
- [x] Add migration script(s) for new fields with safe defaults for existing rows.
- [x] Add repository query helpers for:
  - active session by couple
  - resumable session by user
  - expired-but-not-finalized sessions
- [x] Add expiry transition handling to move stale active sessions into terminal-expired state.

#### A2) Backend game-state enforcement checklist

- [x] Enforce one active session per couple at invitation/session creation.
- [x] Keep sequential question progression contract:
  - return only the current pending question
  - unlock next question only after current question is answered by both required participants in that round logic
- [x] Implement Round 2 unlock guard: only when both users complete all Round 1 answers.
- [x] Implement final result unlock guard: only when both users complete Round 2.
- [x] Add idempotency guards for repeated accept/answer/guess submissions.
- [x] Add explicit server errors/messages for invalid transitions (for example, guessing before Round 2).

#### A3) Realtime event contract checklist

- [x] Define/normalize server event payloads for:
  - active session resumed
  - partner left / partner returned
  - continue-game available
  - session expired
- [x] Ensure each event includes stable identifiers (`sessionId`, `eventType`, `timestamp`).
- [x] Ensure WebSocket + REST fallbacks produce consistent state for both users.

#### A4) Frontend experience checklist

- [x] Add "Continue Game" CTA card on dashboard/home when a resumable session exists.
- [x] Keep GameScreen in current sequential mode (single active question visible at a time).
- [x] Add resume navigation logic from CTA to current game state.
- [x] Add UX prompt when partner leaves mid-session.
- [x] Add reconnect prompt and retry CTA if realtime drops.
- [x] Handle session-expired terminal state with actionable UI.

#### A5) Testing and validation checklist

- [x] Backend unit tests for state machine transitions (invite/accept/answer/guess/complete/expire).
- [x] Backend integration tests for two-user async continuation scenarios.
- [x] Frontend tests for resume CTA rendering and navigation.
- [ ] Manual 2-device Android test matrix:
  - user A answers and leaves; user B continues later
  - both complete Round 1 before Round 2 unlocks
  - both complete Round 2 before results appear
  - expired session after 7 days handling

#### A6) Documentation checklist

- [x] Update `MANUAL_TESTING_GUIDE_SPRINT6.md` with async continuation test steps.
- [x] Update API contract docs for new/changed resume and expiry responses/events.
- [x] Add troubleshooting notes for invalid transition and expiry edge cases.

Definition of done:
- Two users can complete game either synchronously or asynchronously with no dead-end states.
- Session never duplicates; both devices agree on canonical state.
- UI stays one-question-at-a-time throughout gameplay.

### Phase B - History, Metrics, and Engagement Surfaces

#### Phase B priority + estimate + dependency board

| Item | Priority | Estimate | Depends on |
|---|---|---|---|
| B1 Historical Games backend | High | 1-1.5 days | A2 |
| B2 Historical Games frontend | High | 1-1.5 days | B1 |
| B3 Dashboard stats backend | High | 1-1.5 days | A2 |
| B4 Dashboard stats frontend | High | 0.5-1 day | B3 |
| B5 Badge MVP | Medium | 1-1.5 days | B1, B3 |
| B6 Testing and docs | High | 1 day | B2, B4, B5 |

#### B1) Historical Games backend checklist

- [x] Add history query endpoint(s) with pagination.
- [x] Add sorting support: recent-first / oldest-first.
- [x] Add winner filter support (won-by-self / won-by-partner / all).
- [x] Add DB indexes required for performant pagination/filtering.

#### B2) Historical Games frontend checklist

- [x] Create history list screen and route wiring.
- [x] Add pagination controls / infinite loading behavior.
- [x] Add sort selector and winner filter controls.
- [x] Add empty/loading/error UI states.

#### B3) Dashboard stats backend checklist

- [x] Add aggregation logic for:
  - games played
  - average score
  - streak
  - invitation acceptance rate
  - response time
- [x] Add endpoint for dashboard stats snapshot.
- [x] Add guardrails for null/no-history users (safe defaults).

#### B4) Dashboard stats frontend checklist

- [x] Add dashboard metric cards.
- [x] Add loading skeleton/placeholder behavior.
- [x] Add fallback display for unavailable metrics.

#### B5) Badge MVP checklist

- [x] Define initial badge rules and trigger conditions.
- [x] Implement badge computation logic.
- [x] Create badge UI with generated gradient backgrounds.
- [x] Add badge visibility surface (profile/dashboard).

#### B6) Testing and docs checklist

- [x] Add backend tests for pagination/sorting/filtering correctness.
- [x] Add backend tests for metric aggregation correctness.
- [x] Add frontend tests for filter/sort interactions.
- [x] Update manual guide with history + metrics verification steps.
- [x] Re-run in-depth confidence validation before Part C planning:
  - backend focused high-risk suites (`GameService`, `RestController`, websocket suites)
  - backend clean full regression
  - frontend expanded focused suites (hooks + contexts + websocket service)
  - frontend full regression

Definition of done:
- Users can review outcomes and progress over time without performance degradation.

Phase B completion notes (implementation references):
- Backend:
  - Added `GET /api/game/history`, `GET /api/game/stats`, `GET /api/game/badges` in `backend/src/main/java/com/onlyyours/controller/GameQueryController.java`.
  - Added analytics/badge logic in `backend/src/main/java/com/onlyyours/service/GameService.java`.
  - Added DTOs: `GameHistoryItemDto`, `GameHistoryPageDto`, `DashboardStatsDto`, `BadgeDto`.
  - Added migration `backend/src/main/resources/db/migration/V8__PhaseB_History_Stats_Indexes.sql`.
- Frontend:
  - Added `OnlyYoursExpo/src/screens/GameHistoryScreen.js` and `OnlyYoursExpo/src/screens/useGameHistoryFlow.js`.
  - Added dashboard stats + badge rendering in `OnlyYoursExpo/src/screens/DashboardScreen.js`.
  - Added profile badge rendering in `OnlyYoursExpo/src/screens/ProfileScreen.js`.
  - Added route registration in `OnlyYoursExpo/src/navigation/AppNavigator.js`.
- Tests:
  - Backend: `GameServiceTest`, `RestControllerTest` extended.
  - Frontend: `useDashboardGameFlow.test.js` extended, `useGameHistoryFlow.test.js` added.

### Phase C - Onboarding + Theme + Responsive Expansion

Detailed sprint planning artifact:
- `P2_PHASE_C_SPRINT_PLAN.md` (implemented; execution journal + validation updated)

#### Phase C priority + estimate + dependency board

| Item | Priority | Estimate | Depends on |
|---|---|---|---|
| C1 Onboarding flow | High | 1-1.5 days | C2 (token primitives) |
| C2 Theme token system | High | 1.5-2 days | none |
| C3 Responsive rollout | High | 2-3 days | C2 |
| C4 Validation and docs | High | 0.5-1 day | C1, C3 |

#### C1) Onboarding flow checklist

- [x] Add first-time onboarding trigger during signup completion.
- [x] Persist onboarding completion state.
- [x] Add "reopen onboarding" entry point in settings.
- [x] Build illustrated storytelling onboarding screens.

#### C2) Theme token system checklist

- [x] Define foundational light/dark design tokens (color, spacing, typography, radius, shadow).
- [x] Define romantic-red gradient token set and usage rules.
- [x] Add shared animation tokens/presets for motion consistency.
- [x] Refactor priority screens to consume tokens instead of hardcoded values.

#### C3) Responsive rollout checklist (phase-by-screen)

- [x] Auth screens: tablet + landscape polishing.
- [x] Dashboard + PartnerLink + CategorySelection responsive pass.
- [x] Game + Results responsive pass (including compact landscape heights).
- [x] Profile + Settings responsive pass.
- [x] Final cross-screen consistency sweep.

#### C4) Validation and docs checklist

- [x] Focused + full automated validation completed for Phase C logic paths.
- [ ] Manual responsive checks on phone + tablet (portrait + landscape). (deferred by user)
- [ ] Dark mode + light mode visual QA for token compliance. (deferred by user)
- [x] Update manual guide with responsive acceptance checklist.

Definition of done:
- The same account flow is usable and visually coherent across phone/tablet portrait+landscape.

Phase C completion notes (implementation references):
- Theme foundation:
  - Added `OnlyYoursExpo/src/theme/tokens.js`, `OnlyYoursExpo/src/theme/gradients.js`, `OnlyYoursExpo/src/theme/motion.js`, `OnlyYoursExpo/src/theme/ThemeProvider.js`, `OnlyYoursExpo/src/theme/useTheme.js`.
  - Wrapped app tree with `ThemeProvider` in `OnlyYoursExpo/App.js`.
- Onboarding + settings:
  - Added `OnlyYoursExpo/src/state/onboardingStorage.js` and integrated onboarding status into `OnlyYoursExpo/src/state/AuthContext.js`.
  - Added `OnlyYoursExpo/src/screens/OnboardingScreen.js` and `OnlyYoursExpo/src/screens/SettingsScreen.js`.
  - Added onboarding gate + settings route in `OnlyYoursExpo/src/navigation/AppNavigator.js`.
  - Added settings entry in `OnlyYoursExpo/src/screens/ProfileScreen.js`.
- Screen/system migration:
  - Tokenized/refined shared components (`AuthFormScreenLayout`, `LoadingSpinner`, `EmptyState`, `BadgeChip`) and priority screen surfaces (`SignIn`, `SignUp`, `ForgotPassword`, `ResetPassword`, `Dashboard`, `GameHistory`, `CategorySelection`, `PartnerLink`, `GameScreen`, `ResultsScreen`, `Profile`, `Onboarding`, `Settings`).
- Tests:
  - Added `OnlyYoursExpo/src/state/__tests__/onboardingStorage.test.js`.
  - Added `OnlyYoursExpo/src/theme/__tests__/ThemeProvider.test.js`.
  - Added onboarding/settings flow tests in `OnlyYoursExpo/src/state/__tests__/OnboardingScreenFlow.test.js` and `OnlyYoursExpo/src/state/__tests__/SettingsScreenFlow.test.js`.
  - Ran focused frontend validation, full frontend suite, and backend full-suite safety regression.

### Phase D - Settings, Couple Controls, and Reliability Finishing

Detailed sprint planning artifact:
- `P2_PHASE_D_SPRINT_PLAN.md` (implemented; execution journal completed in section 13)

#### Phase D priority + estimate + dependency board

| Item | Priority | Estimate | Depends on |
|---|---|---|---|
| D1 Unlink flow | High | 1-1.5 days | A2 |
| D2 Profile/settings | High | 1-1.5 days | C2 |
| D3 Notification behavior | High | 1 day | A3, D2 |
| D4 Testing and docs | High | 0.5-1 day | D1, D2, D3 |

#### D1) Unlink flow checklist

- [x] Implement 2-step unlink confirmation UX.
- [x] Implement 24-hour unlink cooldown rules.
- [x] Implement recoverable relink/recovery entry point in settings.
- [x] Add backend guardrails and clear API error semantics.

#### D2) Profile/settings checklist

- [x] Add editable username + bio.
- [x] Add stylized initials avatar fallback.
- [x] Add reminder-time configuration UI.
- [x] Add quiet-hours configuration UI.

#### D3) Notification behavior checklist

- [x] Add deep-link handling for continue-game notification.
- [x] Add deep-link handling for partner-completed-answering notification.
- [x] Add deep-link handling for results-ready notification.
- [x] Ensure no duplicate notification fan-out per user/event.

#### D4) Testing and docs checklist

- [x] Add backend tests for cooldown and recoverability rules.
- [x] Add frontend tests for unlink flow and settings toggles.
- [ ] Manual 2-device test for all deep-link notification paths.
- [x] Update user-facing settings/recovery guidance docs.

Definition of done:
- Relationship controls are safe, reversible, and clearly communicated in-app.

Phase D completion notes (implementation references):
- Backend lifecycle + contracts:
  - Added migrations `V9__PhaseD_Couple_Unlink_Cooldown.sql`, `V10__PhaseD_User_Profile_Fields.sql`, and `V11__PhaseD_User_Notification_Preferences.sql`.
  - Added couple status/unlink/recover APIs and structured error semantics in `CoupleService`, `CoupleController`, and `GlobalExceptionHandler`.
  - Added user profile/preferences contracts in `UserController` and related DTO/model updates.
- Frontend flows:
  - Added unlink/recovery + cooldown UX and preferences controls in `OnlyYoursExpo/src/screens/SettingsScreen.js`.
  - Added profile edit UX for username/bio in `OnlyYoursExpo/src/screens/ProfileScreen.js`.
  - Added push-intent mapping + cold-start/auth-safe replay in `OnlyYoursExpo/src/services/NotificationService.js` and `OnlyYoursExpo/src/state/AuthContext.js`.
  - Added deep-link session/result hydration paths in `OnlyYoursExpo/src/screens/GameScreen.js` and `OnlyYoursExpo/src/screens/ResultsScreen.js`.
- Validation:
  - Added/updated backend and frontend tests for cooldown/recovery/profile/preferences/deep-link/dedupe paths.
  - Focused + full backend/frontend automated suites passed; manual Phase D device validation remains pending by deferral.

### Phase E - Dark Mode Redesign Completion

#### Phase E priority + estimate + dependency board

| Item | Priority | Estimate | Depends on |
|---|---|---|---|
| E1 Dark token expansion | High | 1-1.5 days | C2 |
| E2 Screen-level redesign pass | High | 2-3 days | E1 |
| E3 Visual QA and regression hardening | High | 1-1.5 days | E2 |
| E4 Documentation and acceptance closure | Medium | 0.5-1 day | E3 |

#### E1) Dark token expansion checklist

- [ ] Expand the theme token system beyond baseline parity into premium dark-mode semantic tokens.
- [ ] Define dark-specific treatment for:
  - cards
  - overlays
  - banners
  - gradients
  - celebratory states
  - form surfaces
- [ ] Audit and remove remaining hardcoded light-biased colors from shared components and critical screens.
- [ ] Preserve `system` / `light` / `dark` preference support as a stable contract.

#### E2) Screen-level redesign pass checklist

- [ ] Redesign dark mode for all primary screens:
  - auth
  - onboarding
  - dashboard
  - partner link
  - category selection
  - game
  - results
  - history
  - profile
  - settings
- [ ] Ensure dark-mode treatments remain consistent with the romantic premium direction.
- [ ] Refine badges, empty states, loading states, reconnect banners, and modal surfaces for dark mode.

#### E3) Visual QA and regression hardening checklist

- [ ] Add focused rendering/regression coverage for theme mode switching on priority screens.
- [ ] Execute manual visual QA for `system`, `light`, and `dark` modes on phone and tablet form factors.
- [ ] Verify no unreadable contrast, clipped text, or light-only visual artifacts remain.

#### E4) Documentation and acceptance closure checklist

- [ ] Update the manual guide with dark-mode acceptance criteria and evidence capture guidance.
- [ ] Document any intentionally deferred dark-only polish items.
- [ ] Record final screen parity checklist before moving to accessibility phase.

Definition of done:
- Dark mode feels intentional and premium across all primary flows.
- Theme switching is stable and persistent.
- No major visual regressions remain between light and dark surfaces.

### Phase F - Accessibility Baseline Across Primary Flows

#### Phase F priority + estimate + dependency board

| Item | Priority | Estimate | Depends on |
|---|---|---|---|
| F1 Shared accessibility contract | High | 1 day | E2 |
| F2 Screen-reader baseline pass | High | 2-2.5 days | F1 |
| F3 Validation and docs | High | 1 day | F2 |

#### F1) Shared accessibility contract checklist

- [ ] Define baseline accessibility rules for interactive components:
  - labels
  - roles
  - hints
  - state/value announcements
- [ ] Add shared component guidance for icon-only, decorative, loading, error, and modal patterns.
- [ ] Define which dynamic state changes require accessibility announcements.

#### F2) Screen-reader baseline pass checklist

- [ ] Apply accessibility labels and hints across all primary flows:
  - auth
  - onboarding
  - dashboard
  - linking
  - gameplay
  - results
  - history
  - profile
  - settings
- [ ] Fix focus order and focus traps for dialogs, banners, forms, and navigation transitions.
- [ ] Add announcements for critical gameplay and reliability events:
  - invite received
  - reconnect/disconnect
  - round transition
  - guess outcome
  - session expired
  - results ready
  - unlink/recover confirmations

#### F3) Validation and docs checklist

- [ ] Add component/screen coverage for baseline accessibility props where practical.
- [ ] Run manual screen-reader walkthroughs across all primary flows.
- [ ] Update the manual guide with accessibility acceptance criteria and known limitations.

Definition of done:
- All primary flows are screen-reader usable at a baseline level.
- Critical dynamic state changes are announced clearly.
- Unlabeled controls and common focus-order issues are removed.

### Phase G - Haptic Feedback System

#### Phase G priority + estimate + dependency board

| Item | Priority | Estimate | Depends on |
|---|---|---|---|
| G1 Haptic design map and preferences | High | 0.5-1 day | F2 |
| G2 Runtime integration | High | 1-1.5 days | G1 |
| G3 Validation and docs | Medium | 0.5-1 day | G2 |

#### G1) Haptic design map and preferences checklist

- [ ] Define a centralized semantic haptic map for key app moments.
- [ ] Add in-app preference support for enabling/disabling haptics.
- [ ] Keep first-release haptics intentionally subtle and sparse.

#### G2) Runtime integration checklist

- [ ] Implement haptic cues for major interaction moments:
  - important submit/confirm
  - invite sent/accepted
  - answer submitted
  - correct guess
  - incorrect guess
  - round unlocked
  - game completed
  - invalid action/error
  - unlink confirmation/recovery
- [ ] Centralize dispatch through a reusable service/helper rather than per-screen ad hoc calls.
- [ ] Ensure graceful no-op behavior on unsupported devices/platform conditions.

#### G3) Validation and docs checklist

- [ ] Add unit coverage for event-to-haptic mapping.
- [ ] Run manual device validation for enabled, disabled, and unsupported-device behavior.
- [ ] Update the settings and manual guide documentation for haptic preferences.

Definition of done:
- Haptics feel consistent and intentional across key flows.
- Users can disable haptics without side effects.
- Unsupported-device paths degrade safely.

### Phase H - Custom Questions (Couple-Private Deck)

#### Phase H priority + estimate + dependency board

| Item | Priority | Estimate | Depends on |
|---|---|---|---|
| H1 Data model and backend contracts | Critical | 1.5-2 days | A2, D1 |
| H2 Library management API and validation | High | 1.5-2 days | H1 |
| H3 Frontend custom library surfaces | High | 2-2.5 days | H2 |
| H4 Dedicated custom-deck gameplay integration | Critical | 1.5-2 days | H1, H3 |
| H5 Validation and docs | High | 1-1.5 days | H2, H3, H4 |

#### H1) Data model and backend contracts checklist

- [ ] Add backend model(s) for couple-private custom questions with:
  - couple ownership
  - authorship tracking
  - active/archived lifecycle state
- [ ] Keep custom question format aligned with current gameplay:
  - question text
  - four answer options
- [ ] Define API contracts for create/read/update/archive operations.
- [ ] Define minimum playable-deck rules for starting a custom-question session.

#### H2) Library management API and validation checklist

- [ ] Implement CRUD endpoints for the couple-private question library.
- [ ] Enforce that only linked partners within the same couple can access or manage the shared library.
- [ ] Add validation for:
  - required fields
  - reasonable length limits
  - empty/duplicate options
  - duplicate-question protection rules
  - basic safety placeholder checks

#### H3) Frontend custom library surfaces checklist

- [ ] Create custom-question management UI for listing, creating, editing, and archiving questions.
- [ ] Make both partners equally able to manage the shared library.
- [ ] Add empty/loading/error states and clear guidance when the deck is not yet playable.

#### H4) Dedicated custom-deck gameplay integration checklist

- [ ] Add a dedicated custom deck/category entry point instead of blending custom questions into standard categories by default.
- [ ] Extend game-start flow so users can explicitly launch a session from the custom deck.
- [ ] Ensure custom sessions reuse the existing game engine without breaking standard category sessions.
- [ ] Decide and document how history/results distinguish custom-deck sessions, if needed for UX clarity.

#### H5) Validation and docs checklist

- [ ] Add backend tests for CRUD, validation, and couple-isolation behavior.
- [ ] Add integration coverage for starting and completing a game from a custom deck.
- [ ] Add frontend tests for library management and custom-deck entry flow.
- [ ] Update manual testing documentation for custom-question lifecycle and gameplay scenarios.

Definition of done:
- A linked couple can manage a shared private question library.
- Users can explicitly start and complete a game from the custom deck.
- Standard category gameplay remains unaffected.

### Phase I - Social Sharing (Results + Milestones)

#### Phase I priority + estimate + dependency board

| Item | Priority | Estimate | Depends on |
|---|---|---|---|
| I1 Shareable content contract | High | 0.5-1 day | E2, J2 |
| I2 Share-card rendering and UX | High | 1.5-2 days | I1 |
| I3 Native share flow integration | High | 1 day | I2 |
| I4 Validation and docs | Medium | 0.5-1 day | I3 |

#### I1) Shareable content contract checklist

- [ ] Define first-release share moments:
  - result cards
  - progression milestone cards
- [ ] Lock privacy-safe share-card rules:
  - no raw answers
  - no sensitive question text
  - no detailed per-question breakdown by default
- [ ] Define minimal content payload needed for share-card generation.

#### I2) Share-card rendering and UX checklist

- [ ] Create branded share-card designs for results and milestones.
- [ ] Ensure cards match the established Only Yours visual system in both light and dark contexts.
- [ ] Add resilient fallback behavior if share-card preparation fails.

#### I3) Native share flow integration checklist

- [ ] Add native share-sheet launch from the results screen.
- [ ] Add share actions for milestone moments on dashboard/profile or milestone reveal surfaces.
- [ ] Ensure share entry points never expose more detail than the approved safe-summary contract.

#### I4) Validation and docs checklist

- [ ] Add coverage for share payload/card-state generation.
- [ ] Run manual device validation for result and milestone share flows.
- [ ] Update the manual guide with privacy checks and share-flow acceptance criteria.

Definition of done:
- Users can share privacy-safe result and milestone cards externally.
- Shared output is visually polished and brand-consistent.
- No sensitive gameplay data leaks through default sharing behavior.

### Phase J - Gamification Expansion (Levels, XP, Expanded Badges)

#### Phase J priority + estimate + dependency board

| Item | Priority | Estimate | Depends on |
|---|---|---|---|
| J1 Progression model design | High | 1 day | B3, B5 |
| J2 Backend progression computation | High | 1.5-2 days | J1 |
| J3 API and data-contract expansion | High | 1 day | J2 |
| J4 Frontend progression surfaces | High | 1.5-2 days | J3 |
| J5 Validation and docs | High | 1 day | J2, J4 |

#### J1) Progression model design checklist

- [ ] Define first-release progression mechanics:
  - XP
  - levels
  - expanded badge catalog
- [ ] Keep reward logic centered on:
  - consistency
  - completion
  - streak maintenance
  - shared couple participation
- [ ] Keep competitive/high-score-only mechanics secondary in this release.

#### J2) Backend progression computation checklist

- [ ] Implement deterministic XP and level computation rules.
- [ ] Expand badge logic beyond the current MVP set.
- [ ] Define unlock triggers and data needed for milestone celebration surfaces.
- [ ] Preserve compatibility with existing stats and badge endpoints where possible, or version/extend contracts safely.

#### J3) API and data-contract expansion checklist

- [ ] Add/extend API payloads for progression snapshot data:
  - current XP
  - current level
  - progress to next level
  - expanded badges
  - recent unlock metadata if needed
- [ ] Ensure null/no-history users still receive safe defaults and understandable progression state.

#### J4) Frontend progression surfaces checklist

- [ ] Add progression display primarily to dashboard and profile.
- [ ] Add celebratory UX for level-ups and badge unlocks.
- [ ] Keep progression information understandable at a glance without cluttering core gameplay.

#### J5) Validation and docs checklist

- [ ] Add backend tests for XP/level/badge calculations.
- [ ] Add regression coverage to preserve current stats/badges behavior where unchanged.
- [ ] Add frontend tests for dashboard/profile rendering and milestone states.
- [ ] Update manual testing documentation for progression and unlock verification.

Definition of done:
- Users can understand their progression quickly on dashboard and profile.
- XP/level/badge logic is deterministic and testable.
- Milestone surfaces are ready to support privacy-safe sharing.

### Phase K - DevOps, Secrets, Rollback, and Release Safety

#### Phase K priority + estimate + dependency board

| Item | Priority | Estimate | Depends on |
|---|---|---|---|
| K1 Secret management | Critical | 1 day | none |
| K2 Release workflow | High | 0.5-1 day | K1 |
| K3 Rollback strategy | Critical | 1-1.5 days | A-J schema/API/event deltas + K2 |
| K4 Validation | Critical | 0.5-1 day | K1, K2, K3 |

#### K1) Secret management checklist

- [ ] Integrate backend runtime secrets with GCP Secret Manager.
- [ ] Add environment mapping for dev/staging/release values.
- [ ] Ensure local `.env` flow remains documented and isolated from release.

#### K2) Release workflow checklist

- [ ] Restrict deploy workflow to release branch only.
- [ ] Add required quality gates before release deploy trigger.
- [ ] Add branch protection assumptions/checks to documentation.

#### K3) Rollback strategy checklist

- [ ] Define mobile artifact rollback process (previous signed build restore path).
- [ ] Define backend rollback decision tree:
  - safe reversible migration path (where possible)
  - forward-fix-first policy for non-reversible migrations
- [ ] Add incident runbook with trigger conditions, owners, and execution steps.
- [ ] Run at least one rollback drill and capture findings.

#### K4) Validation checklist

- [ ] Verify secret resolution in release-like environment.
- [ ] Verify release-branch-only deploy gating behavior.
- [ ] Verify rollback drill outcomes and remediation actions documented.

Definition of done:
- A failed release can be reverted safely without data ambiguity.

---

## 5) Technical Implementation Notes

### Backend (Expected major work)

- Expand `GameSession` lifecycle fields (`expiresAt`, resume metadata, completion markers).
- Add query endpoints for:
  - active/resumable session state
  - current question/progression state (sequential flow only)
  - historical sessions with filters/sort/pagination
  - dashboard stats aggregation
- Add scheduled/triggered expiration handling.
- Extend eventing for continue/resume/partner-left states and notification triggers.
- Add private custom-question domain models and CRUD endpoints for couple-scoped content.
- Extend dashboard/profile contracts to support progression metadata (`XP`, levels, expanded badge/unlock payloads).

### Frontend (Expected major work)

- New/updated surfaces:
  - Continue Game CTA on dashboard/home
  - sequential session resume view (current question only)
  - historical games screen
  - enhanced dashboard metrics cards
  - settings controls (reminders, unlink recovery, onboarding reopen)
- dark-mode redesign completion across all primary flows
- accessibility improvements across all primary flows
- haptic feedback preference and semantic event mapping
- couple-private custom-question library and dedicated custom-deck entry flow
- result/milestone share-card actions
- progression surfaces on dashboard/profile
- Centralized design tokens + dark/light theme plumbing.
- Progressive responsive refactors by screen priority.

### Push and reminders

- Block P2 push validation until Firebase Android config prerequisite is complete.
- Reminder scheduling respects user local timezone + quiet hours.

### Design system / experience expansion

- Treat current theme infrastructure as a foundation; post-`Phase D` work focuses on premium dark-mode completion rather than first introduction.
- Shared components must carry baseline accessibility semantics by default where practical.
- Haptics are first-release local device feedback only; sound effects are intentionally deferred.
- Share cards must remain privacy-safe by default and align with the same visual language as in-app milestone surfaces.

---

## 6) Test Strategy (Local-First, Quality Gate)

- Unit tests:
  - session state transitions
  - lock/unlock rules for rounds/results
  - cooldown/expiry logic
  - stats aggregation correctness
  - theme and progression computation correctness
  - haptic event mapping
  - custom-question validation rules
- Integration tests:
  - multi-step async resume flows across two users
  - notification event trigger correctness
  - custom-question gameplay flow
  - progression data compatibility with existing stats/badges surfaces
- Manual tests (Android physical devices first):
  - interruption/recovery flows
  - cross-device consistency after app kill/background
  - landscape/tablet usability on priority screens, then full-surface pass
  - light/dark/system theme visual QA
  - screen-reader walkthroughs across all major flows
  - device haptic verification (enabled/disabled/unsupported)
  - custom-question lifecycle management + gameplay
  - result/milestone share flows with privacy checks
- Release gate:
  - functional pass for active/resume/result flow
  - no blocking regressions in auth/game/linking
  - progression, custom-question, and sharing flows validated
  - rollback drill validated

---

## 7) Risks and Mitigations

- **Risk:** async game state divergence between devices.  
  **Mitigation:** single canonical server session state + strict transition guards + idempotent client handlers.

- **Risk:** reminder delivery inconsistency across timezones.  
  **Mitigation:** store user timezone + local schedule conversion server-side + quiet-hour suppression.

- **Risk:** UI quality drift during responsive expansion.  
  **Mitigation:** phased rollout by screen priority + explicit per-screen acceptance checklist.

- **Risk:** dark-mode redesign introduces inconsistent screen parity or unreadable contrast.  
  **Mitigation:** semantic token expansion + explicit screen-by-screen visual QA in `system`, `light`, and `dark`.

- **Risk:** accessibility improvements regress during ongoing feature work.  
  **Mitigation:** shared component accessibility rules + manual screen-reader validation in each major phase.

- **Risk:** custom-question content creates quality or privacy issues.  
  **Mitigation:** couple-scoped access control + basic validation + dedicated custom-deck separation from standard categories.

- **Risk:** progression system becomes confusing or inflated.  
  **Mitigation:** start with `XP + levels + expanded badges` only, reward consistency/completion, and keep dashboard/profile surfaces understandable at a glance.

- **Risk:** social sharing leaks sensitive gameplay context.  
  **Mitigation:** safe-summary-only share contract with no raw answers or sensitive question text by default.

- **Risk:** release rollback complexity with schema changes.  
  **Mitigation:** migration safety policy + forward-fix defaults + documented emergency rollback steps.

---

## 8) Immediate Next Implementation Slice

- [x] Start `A1 + A2` core path: server-side single-active-session enforcement + 7-day expiry model.  
  `Priority: Critical | Estimate: 2.5-3.5 days | Depends on: none`
- [x] Add active-session fetch endpoint consumed by dashboard for Continue Game CTA.  
  `Priority: High | Estimate: 4-6 hours | Depends on: A2`
- [x] Add round unlock/result unlock guards to eliminate ambiguous states.  
  `Priority: Critical | Estimate: 6-8 hours | Depends on: A2`
- [x] Add current-question progression contract (one-question-at-a-time resume-safe flow).  
  `Priority: Critical | Estimate: 4-6 hours | Depends on: A2`

This slice is complete and automatedly validated; Phase B history/metrics implementation is now complete and waiting on manual validation/sign-off.

---

## 9) Weekly Execution Schedule (Guided, Quality-First)

This schedule is a recommended cadence for sequencing work and validation.
It is **checkpoint-driven**, not deadline-driven. If a gate is not satisfied, do not move forward.

### Week 0 - Planning and Readiness Gate

Focus:
- Lock scope, dependencies, and test strategy for first implementation slice.

Checklist:
- [x] Create `P2_PHASE_A_SPRINT_PLAN.md` (in-depth, task-by-task, backend/frontend/testing/docs sections).  
  Completed on Feb 22, 2026.
- [x] Confirm acceptance criteria for `A1` + `A2` in writing.
- [x] Confirm test matrix to be run after each implementation slice.
- [x] Confirm rollback impact notes for new schema/events introduced in Phase A.

Gate to exit Week 0:
- [x] User approves phase plan document explicitly.

### Week 1 - Phase A Core State Integrity (A1 + A2)

Focus:
- Build the core correctness layer for single active session, expiry, and round/result unlock guards.

Checklist:
- [x] Complete `A1` data model + migration + repository work.
- [x] Complete `A2` state machine guard enforcement and idempotency safeguards.
- [x] Add/update backend unit tests for transition validity and invalid transition rejection.
- [x] Run backend integration tests for multi-user continuation and lock/unlock correctness.
- [x] Update docs for new/changed contracts and failure semantics.

Gate to exit Week 1:
- [x] No state divergence in integration tests.
- [x] Round/result unlock rules verified in automated tests.
- [x] One-question-at-a-time progression contract preserved.

### Week 2 - Phase A Experience + Stability (A3 + A4 + A5 + A6)

Focus:
- Complete realtime contract, frontend resume UX, and full validation closure.

Checklist:
- [x] Complete `A3` normalized realtime event payloads.
- [x] Complete `A4` Continue Game CTA + resume/reconnect/expired-state UX.
- [ ] Execute `A5` full test suite (backend + frontend + multi-device manual matrix).
- [x] Complete `A6` documentation updates (manual testing guide + troubleshooting + API notes).

Gate to exit Week 2:
- [ ] Two-device continuation flow passes end-to-end.
- [x] No duplicate active sessions or dead-end game states.
- [ ] User sign-off on Phase A outcomes.

### Week 3 - Phase B Insights and Retention Surfaces

Focus:
- Deliver history, stats, and badge MVP foundations.

Checklist:
- [x] Create and review detailed Phase B sprint plan document (`P2_PHASE_B_SPRINT_PLAN.md`) before coding starts.
- [x] Complete `B1` + `B2` history API + UI with pagination/sort/filter.
- [x] Complete `B3` + `B4` dashboard metrics backend + frontend cards.
- [x] Complete `B5` badge MVP (rules + gradients + surface).
- [x] Complete `B6` test/docs coverage.

Gate to exit Week 3:
- [x] History queries perform correctly and predictably under pagination.
- [x] Dashboard metrics validated for empty + non-empty datasets.
- [ ] User sign-off on history/stats usability.

### Week 4 - Phase C Visual System and Responsive Expansion

Focus:
- Establish tokenized design system and complete responsive rollout by screen priority.

Checklist:
- [x] Create and review detailed Phase C sprint plan document (`P2_PHASE_C_SPRINT_PLAN.md`) before coding starts.
- [x] Complete `C2` theme token foundation first (light/dark + gradients + motion tokens).
- [x] Complete `C1` onboarding flow on top of tokenized primitives.
- [x] Complete `C3` responsive pass across all target screens.
- [x] Complete `C4` automated validation + docs (`visual/responsive manual QA` remains tracked in Week 4 gate).

Gate to exit Week 4:
- [ ] Phone/tablet portrait + landscape pass on prioritized screens.
- [ ] Theming consistency verified in both light and dark modes.
- [ ] User sign-off on visual direction fidelity.

### Week 5 - Phase D Completion + Phase E Dark Mode Redesign

Focus:
- Close relationship/settings reliability work, then complete premium dark-mode parity across primary flows.

Checklist:
- [x] Create and review detailed Phase D sprint plan document (`P2_PHASE_D_SPRINT_PLAN.md`) before coding starts.
- [x] Complete `D1` unlink + cooldown + recoverability.
- [x] Complete `D2` profile/settings edits and reminder controls.
- [x] Complete `D3` notification deep-link paths and fan-out correctness.
- [x] Complete `D4` validation + docs.
- [ ] Create and review detailed Phase E sprint plan document before coding starts.
- [ ] Complete `E1` dark token expansion.
- [ ] Complete `E2` screen-level dark redesign pass.
- [ ] Complete `E3` visual QA and regression hardening.
- [ ] Complete `E4` dark-mode docs and acceptance closure.

Gate to exit Week 5:
- [ ] Manual Phase D device validation completed or explicitly deferred with rationale.
- [ ] Dark mode visually coherent across all primary flows.
- [ ] User sign-off on dark-mode direction fidelity.

### Week 6 - Phase F Accessibility + Phase G Haptics

Focus:
- Establish accessibility baseline across primary flows, then layer subtle haptics on top of stable UX states.

Checklist:
- [ ] Create and review detailed Phase F sprint plan document before coding starts.
- [ ] Complete `F1` shared accessibility contract.
- [ ] Complete `F2` screen-reader baseline pass.
- [ ] Complete `F3` validation + docs.
- [ ] Create and review detailed Phase G sprint plan document before coding starts.
- [ ] Complete `G1` haptic design map + preferences.
- [ ] Complete `G2` runtime integration.
- [ ] Complete `G3` validation + docs.

Gate to exit Week 6:
- [ ] Primary flows are usable with screen-reader baseline support.
- [ ] Haptics feel intentional and can be disabled cleanly.
- [ ] User sign-off on accessibility + feedback behavior.

### Week 7 - Phase H Custom Questions

Focus:
- Deliver the couple-private question library and dedicated custom-deck gameplay path.

Checklist:
- [ ] Create and review detailed Phase H sprint plan document before coding starts.
- [ ] Complete `H1` data model + backend contracts.
- [ ] Complete `H2` library management API + validation.
- [ ] Complete `H3` frontend custom library surfaces.
- [ ] Complete `H4` dedicated custom-deck gameplay integration.
- [ ] Complete `H5` validation + docs.

Gate to exit Week 7:
- [ ] Linked couples can manage and play from a private custom deck.
- [ ] Standard category gameplay remains regression-free.
- [ ] User sign-off on custom-question UX and scope boundaries.

### Week 8 - Phase J Gamification Expansion + Phase I Sharing

Focus:
- Expand progression foundations first, then add privacy-safe sharing for results and milestones.

Checklist:
- [ ] Create and review detailed Phase J sprint plan document before coding starts.
- [ ] Complete `J1` progression model design.
- [ ] Complete `J2` backend progression computation.
- [ ] Complete `J3` API/data-contract expansion.
- [ ] Complete `J4` frontend progression surfaces.
- [ ] Complete `J5` validation + docs.
- [ ] Create and review detailed Phase I sprint plan document before coding starts.
- [ ] Complete `I1` shareable content contract.
- [ ] Complete `I2` share-card rendering + UX.
- [ ] Complete `I3` native share flow integration.
- [ ] Complete `I4` validation + docs.

Gate to exit Week 8:
- [ ] Progression model is stable, understandable, and validated.
- [ ] Result and milestone sharing works with privacy-safe defaults.
- [ ] User sign-off on gamification and sharing behavior.

### Week 9 - Phase K Release Safety Closure

Focus:
- Finalize secret management, release gating, rollback readiness, and expanded-scope release safety.

Checklist:
- [ ] Create and review detailed Phase K sprint plan document before coding starts.
- [ ] Complete `K1` secret manager integration.
- [ ] Complete `K2` release-branch deploy gating.
- [ ] Complete `K3` rollback strategy runbook + rollback drill.
- [ ] Complete `K4` release-safety validation.

Gate to exit Week 9:
- [ ] Critical flows across `A` through `J` pass full automated + manual validation suite.
- [ ] Rollback drill executed with documented outcome.
- [ ] User sign-off for expanded P2 closure readiness.

### Ongoing Weekly Health Checklist (Run Every Week)

- [ ] Open defects triaged by severity (P0/P1/P2).
- [ ] Regression test suite run before marking weekly checkpoint complete.
- [ ] Docs updated alongside code changes (no deferred documentation debt).
- [ ] Phase checklists in this file and phase-specific sprint file kept current.
