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
- Initial gamification scope: badges only, with generated gradient backgrounds.

### UX / Design System

- Onboarding appears during signup and is reopenable in settings.
- Design direction: richer illustrated storytelling flow.
- Theme direction: light + dark token system, romantic red gradient language, smooth/cute/bubbly animation style.
- Responsive support target: landscape on all screens including game (tablet-friendly).

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

Cross-phase dependencies:
- `B3/B4` (stats) depend on `A2` stabilized round/state transitions.
- `B5` (badges) depends on `B3` metrics and `B1` history events.
- `C3` responsive rollout should start after token foundation in `C2`.
- `D3` deep-link notifications depend on `A3` event contract.
- `E3` rollback runbook depends on schema/event changes from `A` and `B`.

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

- [ ] Add `expiresAt` to active game session data model (7-day TTL from session creation or last activity, as finalized in implementation).
- [ ] Add session lifecycle metadata needed for async resume (for example: `lastActivityAt`, round completion counters/flags).
- [ ] Add migration script(s) for new fields with safe defaults for existing rows.
- [ ] Add repository query helpers for:
  - active session by couple
  - resumable session by user
  - expired-but-not-finalized sessions
- [ ] Add expiry transition handling to move stale active sessions into terminal-expired state.

#### A2) Backend game-state enforcement checklist

- [ ] Enforce one active session per couple at invitation/session creation.
- [ ] Keep sequential question progression contract:
  - return only the current pending question
  - unlock next question only after current question is answered by both required participants in that round logic
- [ ] Implement Round 2 unlock guard: only when both users complete all Round 1 answers.
- [ ] Implement final result unlock guard: only when both users complete Round 2.
- [ ] Add idempotency guards for repeated accept/answer/guess submissions.
- [ ] Add explicit server errors/messages for invalid transitions (for example, guessing before Round 2).

#### A3) Realtime event contract checklist

- [ ] Define/normalize server event payloads for:
  - active session resumed
  - partner left / partner returned
  - continue-game available
  - session expired
- [ ] Ensure each event includes stable identifiers (`sessionId`, `eventType`, `timestamp`).
- [ ] Ensure WebSocket + REST fallbacks produce consistent state for both users.

#### A4) Frontend experience checklist

- [ ] Add "Continue Game" CTA card on dashboard/home when a resumable session exists.
- [ ] Keep GameScreen in current sequential mode (single active question visible at a time).
- [ ] Add resume navigation logic from CTA to current game state.
- [ ] Add UX prompt when partner leaves mid-session.
- [ ] Add reconnect prompt and retry CTA if realtime drops.
- [ ] Handle session-expired terminal state with actionable UI.

#### A5) Testing and validation checklist

- [ ] Backend unit tests for state machine transitions (invite/accept/answer/guess/complete/expire).
- [ ] Backend integration tests for two-user async continuation scenarios.
- [ ] Frontend tests for resume CTA rendering and navigation.
- [ ] Manual 2-device Android test matrix:
  - user A answers and leaves; user B continues later
  - both complete Round 1 before Round 2 unlocks
  - both complete Round 2 before results appear
  - expired session after 7 days handling

#### A6) Documentation checklist

- [ ] Update `MANUAL_TESTING_GUIDE_SPRINT6.md` with async continuation test steps.
- [ ] Update API contract docs for new/changed resume and expiry responses/events.
- [ ] Add troubleshooting notes for invalid transition and expiry edge cases.

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

- [ ] Add history query endpoint(s) with pagination.
- [ ] Add sorting support: recent-first / oldest-first.
- [ ] Add winner filter support (won-by-self / won-by-partner / all).
- [ ] Add DB indexes required for performant pagination/filtering.

#### B2) Historical Games frontend checklist

- [ ] Create history list screen and route wiring.
- [ ] Add pagination controls / infinite loading behavior.
- [ ] Add sort selector and winner filter controls.
- [ ] Add empty/loading/error UI states.

#### B3) Dashboard stats backend checklist

- [ ] Add aggregation logic for:
  - games played
  - average score
  - streak
  - invitation acceptance rate
  - response time
- [ ] Add endpoint for dashboard stats snapshot.
- [ ] Add guardrails for null/no-history users (safe defaults).

#### B4) Dashboard stats frontend checklist

- [ ] Add dashboard metric cards.
- [ ] Add loading skeleton/placeholder behavior.
- [ ] Add fallback display for unavailable metrics.

#### B5) Badge MVP checklist

- [ ] Define initial badge rules and trigger conditions.
- [ ] Implement badge computation logic.
- [ ] Create badge UI with generated gradient backgrounds.
- [ ] Add badge visibility surface (profile/dashboard).

#### B6) Testing and docs checklist

- [ ] Add backend tests for pagination/sorting/filtering correctness.
- [ ] Add backend tests for metric aggregation correctness.
- [ ] Add frontend tests for filter/sort interactions.
- [ ] Update manual guide with history + metrics verification steps.

Definition of done:
- Users can review outcomes and progress over time without performance degradation.

### Phase C - Onboarding + Theme + Responsive Expansion

#### Phase C priority + estimate + dependency board

| Item | Priority | Estimate | Depends on |
|---|---|---|---|
| C1 Onboarding flow | High | 1-1.5 days | C2 (token primitives) |
| C2 Theme token system | High | 1.5-2 days | none |
| C3 Responsive rollout | High | 2-3 days | C2 |
| C4 Validation and docs | High | 0.5-1 day | C1, C3 |

#### C1) Onboarding flow checklist

- [ ] Add first-time onboarding trigger during signup completion.
- [ ] Persist onboarding completion state.
- [ ] Add "reopen onboarding" entry point in settings.
- [ ] Build illustrated storytelling onboarding screens.

#### C2) Theme token system checklist

- [ ] Define foundational light/dark design tokens (color, spacing, typography, radius, shadow).
- [ ] Define romantic-red gradient token set and usage rules.
- [ ] Add shared animation tokens/presets for motion consistency.
- [ ] Refactor priority screens to consume tokens instead of hardcoded values.

#### C3) Responsive rollout checklist (phase-by-screen)

- [ ] Auth screens: tablet + landscape polishing.
- [ ] Dashboard + PartnerLink + CategorySelection responsive pass.
- [ ] Game + Results responsive pass (including compact landscape heights).
- [ ] Profile + Settings responsive pass.
- [ ] Final cross-screen consistency sweep.

#### C4) Validation and docs checklist

- [ ] Manual responsive checks on phone + tablet (portrait + landscape).
- [ ] Dark mode + light mode visual QA for token compliance.
- [ ] Update manual guide with responsive acceptance checklist.

Definition of done:
- The same account flow is usable and visually coherent across phone/tablet portrait+landscape.

### Phase D - Settings, Couple Controls, and Reliability Finishing

#### Phase D priority + estimate + dependency board

| Item | Priority | Estimate | Depends on |
|---|---|---|---|
| D1 Unlink flow | High | 1-1.5 days | A2 |
| D2 Profile/settings | High | 1-1.5 days | C2 |
| D3 Notification behavior | High | 1 day | A3, D2 |
| D4 Testing and docs | High | 0.5-1 day | D1, D2, D3 |

#### D1) Unlink flow checklist

- [ ] Implement 2-step unlink confirmation UX.
- [ ] Implement 24-hour unlink cooldown rules.
- [ ] Implement recoverable relink/recovery entry point in settings.
- [ ] Add backend guardrails and clear API error semantics.

#### D2) Profile/settings checklist

- [ ] Add editable username + bio.
- [ ] Add stylized initials avatar fallback.
- [ ] Add reminder-time configuration UI.
- [ ] Add quiet-hours configuration UI.

#### D3) Notification behavior checklist

- [ ] Add deep-link handling for continue-game notification.
- [ ] Add deep-link handling for partner-completed-answering notification.
- [ ] Add deep-link handling for results-ready notification.
- [ ] Ensure no duplicate notification fan-out per user/event.

#### D4) Testing and docs checklist

- [ ] Add backend tests for cooldown and recoverability rules.
- [ ] Add frontend tests for unlink flow and settings toggles.
- [ ] Manual 2-device test for all deep-link notification paths.
- [ ] Update user-facing settings/recovery guidance docs.

Definition of done:
- Relationship controls are safe, reversible, and clearly communicated in-app.

### Phase E - DevOps, Secrets, Rollback, and Release Safety

#### Phase E priority + estimate + dependency board

| Item | Priority | Estimate | Depends on |
|---|---|---|---|
| E1 Secret management | Critical | 1 day | none |
| E2 Release workflow | High | 0.5-1 day | E1 |
| E3 Rollback strategy | Critical | 1-1.5 days | A, B schema/event deltas + E2 |
| E4 Validation | Critical | 0.5-1 day | E1, E2, E3 |

#### E1) Secret management checklist

- [ ] Integrate backend runtime secrets with GCP Secret Manager.
- [ ] Add environment mapping for dev/staging/release values.
- [ ] Ensure local `.env` flow remains documented and isolated from release.

#### E2) Release workflow checklist

- [ ] Restrict deploy workflow to release branch only.
- [ ] Add required quality gates before release deploy trigger.
- [ ] Add branch protection assumptions/checks to documentation.

#### E3) Rollback strategy checklist

- [ ] Define mobile artifact rollback process (previous signed build restore path).
- [ ] Define backend rollback decision tree:
  - safe reversible migration path (where possible)
  - forward-fix-first policy for non-reversible migrations
- [ ] Add incident runbook with trigger conditions, owners, and execution steps.
- [ ] Run at least one rollback drill and capture findings.

#### E4) Validation checklist

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

### Frontend (Expected major work)

- New/updated surfaces:
  - Continue Game CTA on dashboard/home
  - sequential session resume view (current question only)
  - historical games screen
  - enhanced dashboard metrics cards
  - settings controls (reminders, unlink recovery, onboarding reopen)
- Centralized design tokens + dark/light theme plumbing.
- Progressive responsive refactors by screen priority.

### Push and reminders

- Block P2 push validation until Firebase Android config prerequisite is complete.
- Reminder scheduling respects user local timezone + quiet hours.

---

## 6) Test Strategy (Local-First, Quality Gate)

- Unit tests:
  - session state transitions
  - lock/unlock rules for rounds/results
  - cooldown/expiry logic
  - stats aggregation correctness
- Integration tests:
  - multi-step async resume flows across two users
  - notification event trigger correctness
- Manual tests (Android physical devices first):
  - interruption/recovery flows
  - cross-device consistency after app kill/background
  - landscape/tablet usability on priority screens, then full-surface pass
- Release gate:
  - functional pass for active/resume/result flow
  - no blocking regressions in auth/game/linking
  - rollback drill validated

---

## 7) Risks and Mitigations

- **Risk:** async game state divergence between devices.  
  **Mitigation:** single canonical server session state + strict transition guards + idempotent client handlers.

- **Risk:** reminder delivery inconsistency across timezones.  
  **Mitigation:** store user timezone + local schedule conversion server-side + quiet-hour suppression.

- **Risk:** UI quality drift during responsive expansion.  
  **Mitigation:** phased rollout by screen priority + explicit per-screen acceptance checklist.

- **Risk:** release rollback complexity with schema changes.  
  **Mitigation:** migration safety policy + forward-fix defaults + documented emergency rollback steps.

---

## 8) Immediate Next Implementation Slice

- [ ] Start `A1 + A2` core path: server-side single-active-session enforcement + 7-day expiry model.  
  `Priority: Critical | Estimate: 2.5-3.5 days | Depends on: none`
- [ ] Add active-session fetch endpoint consumed by dashboard for Continue Game CTA.  
  `Priority: High | Estimate: 4-6 hours | Depends on: A2`
- [ ] Add round unlock/result unlock guards to eliminate ambiguous states.  
  `Priority: Critical | Estimate: 6-8 hours | Depends on: A2`
- [ ] Add current-question progression contract (one-question-at-a-time resume-safe flow).  
  `Priority: Critical | Estimate: 4-6 hours | Depends on: A2`

Once this slice is merged and manually validated on two phones, move to Phase B history/metrics.

---

## 9) Weekly Execution Schedule (Guided, Quality-First)

This schedule is a recommended cadence for sequencing work and validation.
It is **checkpoint-driven**, not deadline-driven. If a gate is not satisfied, do not move forward.

### Week 0 - Planning and Readiness Gate

Focus:
- Lock scope, dependencies, and test strategy for first implementation slice.

Checklist:
- [ ] Create `P2_PHASE_A_SPRINT_PLAN.md` (in-depth, task-by-task, backend/frontend/testing/docs sections).
- [ ] Confirm acceptance criteria for `A1` + `A2` in writing.
- [ ] Confirm test matrix to be run after each implementation slice.
- [ ] Confirm rollback impact notes for new schema/events introduced in Phase A.

Gate to exit Week 0:
- [ ] User approves phase plan document explicitly.

### Week 1 - Phase A Core State Integrity (A1 + A2)

Focus:
- Build the core correctness layer for single active session, expiry, and round/result unlock guards.

Checklist:
- [ ] Complete `A1` data model + migration + repository work.
- [ ] Complete `A2` state machine guard enforcement and idempotency safeguards.
- [ ] Add/update backend unit tests for transition validity and invalid transition rejection.
- [ ] Run backend integration tests for multi-user continuation and lock/unlock correctness.
- [ ] Update docs for new/changed contracts and failure semantics.

Gate to exit Week 1:
- [ ] No state divergence in integration tests.
- [ ] Round/result unlock rules verified in automated tests.
- [ ] One-question-at-a-time progression contract preserved.

### Week 2 - Phase A Experience + Stability (A3 + A4 + A5 + A6)

Focus:
- Complete realtime contract, frontend resume UX, and full validation closure.

Checklist:
- [ ] Complete `A3` normalized realtime event payloads.
- [ ] Complete `A4` Continue Game CTA + resume/reconnect/expired-state UX.
- [ ] Execute `A5` full test suite (backend + frontend + multi-device manual matrix).
- [ ] Complete `A6` documentation updates (manual testing guide + troubleshooting + API notes).

Gate to exit Week 2:
- [ ] Two-device continuation flow passes end-to-end.
- [ ] No duplicate active sessions or dead-end game states.
- [ ] User sign-off on Phase A outcomes.

### Week 3 - Phase B Insights and Retention Surfaces

Focus:
- Deliver history, stats, and badge MVP foundations.

Checklist:
- [ ] Complete `B1` + `B2` history API + UI with pagination/sort/filter.
- [ ] Complete `B3` + `B4` dashboard metrics backend + frontend cards.
- [ ] Complete `B5` badge MVP (rules + gradients + surface).
- [ ] Complete `B6` test/docs coverage.

Gate to exit Week 3:
- [ ] History queries perform correctly and predictably under pagination.
- [ ] Dashboard metrics validated for empty + non-empty datasets.
- [ ] User sign-off on history/stats usability.

### Week 4 - Phase C Visual System and Responsive Expansion

Focus:
- Establish tokenized design system and complete responsive rollout by screen priority.

Checklist:
- [ ] Complete `C2` theme token foundation first (light/dark + gradients + motion tokens).
- [ ] Complete `C1` onboarding flow on top of tokenized primitives.
- [ ] Complete `C3` responsive pass across all target screens.
- [ ] Complete `C4` visual QA + responsive QA + docs.

Gate to exit Week 4:
- [ ] Phone/tablet portrait + landscape pass on prioritized screens.
- [ ] Theming consistency verified in both light and dark modes.
- [ ] User sign-off on visual direction fidelity.

### Week 5 - Phase D + Phase E Safety Closure

Focus:
- Finalize settings/control flows and release safety infrastructure.

Checklist:
- [ ] Complete `D1` unlink + cooldown + recoverability.
- [ ] Complete `D2` profile/settings edits and reminder controls.
- [ ] Complete `D3` notification deep-link paths and fan-out correctness.
- [ ] Complete `D4` validation + docs.
- [ ] Complete `E1` secret manager integration.
- [ ] Complete `E2` release-branch deploy gating.
- [ ] Complete `E3` rollback strategy runbook + rollback drill.
- [ ] Complete `E4` release-safety validation.

Gate to exit Week 5:
- [ ] Critical flows pass full automated + manual validation suite.
- [ ] Rollback drill executed with documented outcome.
- [ ] User sign-off for P2 closure readiness.

### Ongoing Weekly Health Checklist (Run Every Week)

- [ ] Open defects triaged by severity (P0/P1/P2).
- [ ] Regression test suite run before marking weekly checkpoint complete.
- [ ] Docs updated alongside code changes (no deferred documentation debt).
- [ ] Phase checklists in this file and phase-specific sprint file kept current.
