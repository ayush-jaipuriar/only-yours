# P1 Decision Memo (Options, Costs, Pros/Cons, Recommendations)

## Context

This memo evaluates the P1 clarification questions raised for launch planning (features, UX, security, quality, and DevOps).  
Current codebase context used:

- Frontend is Expo (`OnlyYoursExpo`) with no push pipeline configured yet.
- Backend is Spring Boot with password reset token generation already implemented, but currently logs a raw reset token in `AuthService`.
- Password reset UX is currently token copy/paste (`ResetPasswordScreen` has manual token input).
- No GitHub Actions workflows currently exist.
- `OnlyYoursExpo/app.json` has empty EAS project ID.
- `docker-compose.yml` still hard-requires `GOOGLE_CLIENT_ID`.

---

## 1) Email Delivery for Password Reset (PRODUCT-2)

### 1A. Provider Choice

#### Option A: SendGrid

- **Infra cost:** Free tier for low volume, paid plans start around entry SaaS pricing (~$20/mo class).
- **Implementation effort:** Medium (0.5-1 day), mature Java SDK and SMTP/API support.
- **Pros:** Mature deliverability tooling, templates, webhooks, broad docs/community.
- **Cons:** Dashboard complexity can be high for MVP; costs can rise with scale/features.

#### Option B: AWS SES

- **Infra cost:** Very low variable pricing (official baseline around $0.10 per 1,000 outgoing emails) + optional extras.
- **Implementation effort:** Medium-high (0.75-1.25 days) due to AWS setup, domain verification, IAM policies.
- **Pros:** Cheapest at scale, production-grade, strong fit if already on AWS.
- **Cons:** More setup complexity than developer-first providers; more moving parts for small teams.

#### Option C: Mailgun

- **Infra cost:** Free low-volume tier + paid plans (entry around ~$15/mo).
- **Implementation effort:** Medium (0.5-1 day).
- **Pros:** Good email API ergonomics, routing/webhooks, known provider.
- **Cons:** Value can be weaker than SES at scale; some features gated to higher plans.

#### Option D: Resend

- **Infra cost:** Free tier for low volume (100/day class), paid commonly starts around startup-friendly pricing.
- **Implementation effort:** Low-medium (0.5 day), modern API and clean DX.
- **Pros:** Fastest integration and cleanest developer experience for transactional email.
- **Cons:** Fewer legacy enterprise controls than very mature incumbents.

#### Option E: JavaMailSender + Gmail SMTP relay

- **Infra cost:** Included with Google Workspace account (no per-email billing model for small usage).
- **Implementation effort:** Lowest initial (2-4 hours).
- **Pros:** Very fast proof-of-concept; minimal new dependencies.
- **Cons:** Not ideal for production transactional email (limits, reputation, governance, account-risk concerns).

### 1B. Email Format (HTML vs Plain Text)

#### Plain text only

- **Cost/effort:** Lowest (1-2 hours).
- **Pros:** Fast, robust, low rendering risk.
- **Cons:** Lower trust/brand quality, weaker click conversion.

#### Branded HTML + text fallback (multipart)

- **Cost/effort:** Medium (4-8 hours for MVP template + testing).
- **Pros:** Better UX/trust, supports consistent branding, better production readiness.
- **Cons:** Slightly more implementation/testing effort.

### 1C. Reset Flow UX (Link vs code)

#### Manual code copy/paste (current model)

- **Cost/effort:** Lowest (no major UX refactor).
- **Pros:** Works with current backend token design.
- **Cons:** Friction-heavy, error-prone, weaker consumer UX.

#### Clickable URL (recommended baseline)

- **Cost/effort:** Medium (0.5-1 day).
- **Pros:** Better completion rates and user trust; standard modern pattern.
- **Cons:** Requires app routing/deep-link or fallback web flow decisions.

#### Deep link into app + fallback web

- **Cost/effort:** Medium-high (1-2 days depending on deep-link readiness).
- **Pros:** Best UX, especially mobile-first.
- **Cons:** More test matrix (iOS/Android/install state).

### Recommendation

- **Provider:** Start with **Resend** for speed + maintainability in MVP.
- **Template:** Use **simple branded HTML + text fallback** (not plain-only).
- **Flow:** Move to **clickable reset URL now**, then add full deep-link fallback once push/eas infra is stable.
- **Why:** Maximizes launch UX while keeping implementation complexity controlled.

---

## 2) Push Notifications (PRODUCT-1)

### 2A. Delivery Stack Choice

#### Option A: Expo Push Notifications

- **Infra cost:** Expo push service itself has no send fee.
- **Implementation effort:** Low-medium (1.5-3 days including token registration, backend send path, QA).
- **Pros:** Best for managed Expo app, fastest path, minimal platform divergence.
- **Cons:** Additional vendor layer; eventual migration may be needed for advanced routing.

#### Option B: Direct FCM + APNs

- **Infra cost:** FCM and APNs messaging are generally no-cost services; operational cost is engineering time.
- **Implementation effort:** Medium-high (3-6 days).
- **Pros:** Full control, less vendor abstraction, long-term flexibility.
- **Cons:** Much higher setup/ops complexity for current team stage.

### 2B. Trigger Events

#### Minimal transactional set (recommended for P1)

- Invitation received
- Invitation accepted/declined
- Partner linked

#### Expanded engagement set

- Daily reminder
- Inactive nudges
- Milestone prompts

### 2C. Account/credential setup costs

- **Apple Developer Program:** ~$99/year.
- **Google Play Console:** $25 one-time (store publishing account).
- **Firebase project setup:** no direct messaging fee; setup time required.
- **Engineering setup time:** 0.5-1 day if accounts are not ready.

### 2D. Sprint placement

#### Keep inside P1

- **Pros:** Major engagement unlock before launch.
- **Cons:** Dominates sprint bandwidth and risk.

#### Move to separate sprint

- **Pros:** De-risks P1 quick wins.
- **Cons:** Launches with weaker retention loop.

### Recommendation

- Use **Expo push** first.
- Ship **only transactional triggers** in initial version.
- Keep it in P1 but as the **last P1 execution block** after security/UX quick wins.

---

## 3) Style PartnerLinkScreen (UX-1)

### Option A: Match existing purple gradient auth theme

- **Effort:** 2-4 hours.
- **Pros:** Visual consistency, faster delivery, lower design risk.
- **Cons:** Less opportunity for new visual identity.

### Option B: New visual direction

- **Effort:** 1-2 days.
- **Pros:** Could improve perceived polish if design work is strong.
- **Cons:** Scope creep and inconsistency risk.

### Enhancements to consider

- Keep share CTA (already functionally present), improve layout hierarchy.
- Add copy-code CTA and inline validation feedback.
- Optional lightweight micro-animations only (avoid heavy Lottie for now).

### Recommendation

- **Match current theme** and polish hierarchy + CTA states.
- Keep implementation intentionally lean for P1.

---

## 4) App Loading/Splash Screen (UX-3)

### Option A: Static splash only (current)

- **Effort:** none/minimal.
- **Pros:** No extra logic.
- **Cons:** Potential auth-state flash and rough startup feel.

### Option B: In-app loading screen after splash

- **Effort:** 2-4 hours.
- **Pros:** Better state control.
- **Cons:** Can still show transition flicker if native splash hides too early.

### Option C: Keep native splash until silent auth completes (recommended)

- **Effort:** 3-6 hours.
- **Pros:** Smoothest startup; no SignIn flash before authenticated redirect.
- **Cons:** Slightly more bootstrapping coordination.

### Recommendation

- Use **expo-splash-screen with auth-bootstrap gating** so splash persists until token refresh check resolves.

---

## 5) Rate Limiting on Auth Endpoints (SEC-2)

### Option A: In-memory limiter (Bucket4j/Caffeine)

- **Infra cost:** $0 additional.
- **Effort:** 3-6 hours.
- **Pros:** Fastest to ship, simple operations.
- **Cons:** Resets on restart and per-instance only.

### Option B: Redis-backed limiter

- **Infra cost:** managed Redis monthly spend (small tier often ~$10-30/mo+).
- **Effort:** 1-2 days.
- **Pros:** Shared limits across instances; better production scaling.
- **Cons:** Added infra and ops complexity.

### Suggested thresholds

- Login: **5 attempts/minute per IP**
- Forgot password: **3/hour per email** + **10/hour per IP**
- Optional: progressive backoff and lock duration on repeated abuse

### Recommendation

- Start with **in-memory limiter** for immediate protection in P1, but abstract policy so Redis swap-in is easy when scaling.

---

## 6) Remove Password Reset Token from Logs (SEC-4)

### Option A: Remove the log entirely

- **Effort:** 15 minutes.
- **Pros:** Eliminates leakage risk at source.
- **Cons:** Less observability for support/debug.

### Option B: Keep sanitized event log (recommended)

- **Effort:** 15-30 minutes.
- **Pros:** Retains auditability and debugging without secret leakage.
- **Cons:** Need discipline to avoid reintroducing sensitive fields.

### Recommendation

- Keep a **sanitized log line** (no token, no raw secrets), ideally with request correlation metadata.

---

## 7) Backend Input Validation with `@Valid` (BE-1)

### Option A: Add annotations only

- **Effort:** 1-2 hours (already mostly present in current DTOs/controllers).
- **Pros:** Quick, low-risk.
- **Cons:** Error payloads may remain inconsistent/default.

### Option B: Add global `@ControllerAdvice` for clean 400 responses (recommended)

- **Effort:** +1-2 hours.
- **Pros:** Uniform API contract, easier frontend error handling, cleaner logs.
- **Cons:** Slight extra implementation and tests.

### Recommendation

- Do both: keep `@Valid` and add **global validation exception mapping**.

---

## 8) CI/CD Pipeline (DEVOPS-1)

### 8A. Scope: CI-only vs CI+CD

#### CI-only now (recommended)

- **Effort:** 1 day.
- **Pros:** Immediate code quality guardrails with low deployment risk.
- **Cons:** Still manual deploy.

#### CI + staging deploy

- **Effort:** 2-3 days.
- **Pros:** Faster release cadence, repeatable staging.
- **Cons:** Requires cloud/service accounts and secrets setup.

### 8B. Workflow shape

#### Single monorepo workflow with path-filtered jobs (recommended)

- **Effort:** Low-medium.
- **Pros:** One control plane, explicit backend/frontend jobs, easy visibility.
- **Cons:** YAML can get larger over time.

#### Separate workflow files

- **Effort:** Similar.
- **Pros:** Cleaner separation of concerns.
- **Cons:** Duplication in common setup patterns.

### 8C. Provider choice

- **GitHub Actions:** Recommended default for this repo host.

### Recommendation

- Start with **CI-only GitHub Actions**, one workflow file, two jobs:
  - backend: Gradle build + tests
  - frontend: npm install + jest tests (+ optional Expo doctor sanity step)
- Add CD to staging after 1-2 green weeks.

---

## 9) Fill EAS Project ID (DEVOPS-6)

### Option A: Fill now via `eas build:configure` (recommended)

- **Effort:** ~15 minutes.
- **Cost:** Expo account required; build usage depends on plan.
- **Pros:** Unblocks real device builds, push credentials, and release readiness.
- **Cons:** Requires account login and one-time project linkage.

### Option B: Defer

- **Pros:** Zero immediate effort.
- **Cons:** Blocks push/deeplink production validation and build automation.

### Recommendation

- Fill now. It is a hard dependency for realistic mobile release workflows.

---

## 10) Remove `GOOGLE_CLIENT_ID` Requirement (DEVOPS-3)

### Option A: Make env optional but keep disabled code

- **Effort:** 30-60 minutes.
- **Pros:** Fast unblock for local setup; minimal risk.
- **Cons:** Keeps dead code and cognitive overhead.

### Option B: Remove Google auth placeholder code entirely

- **Effort:** 0.5-1 day including cleanup + tests.
- **Pros:** Reduces attack surface and maintenance burden.
- **Cons:** Potential compatibility impact if old clients still call endpoint.

### Recommendation

- **Two-step approach:**
  1. P1: make `GOOGLE_CLIENT_ID` optional to remove setup friction immediately.
  2. Next cleanup: remove disabled Google endpoint + deps once compatibility risk is confirmed low.

---

## Overall Prioritization Recommendation

### Recommended split

### Sprint A (2-3 days, quick wins + safety)

- SEC-4, DEVOPS-6, DEVOPS-3, UX-1, UX-3, BE-1 (+ ControllerAdvice), SEC-2

### Sprint B (2 days, password reset completeness)

- PRODUCT-2 (provider integration + template + clickable URL flow)
- DEVOPS-1 (CI-only)

### Sprint C (3-4 days, engagement)

- PRODUCT-1 push notifications (Expo push, transactional triggers only)

### Why this split

- Delivers immediate security and UX improvements fast.
- Unblocks release hygiene before adding the largest feature.
- Isolates push risk so one complex area does not stall all launch-critical work.

---

## Estimated Ongoing Monthly Infra Cost Impact (MVP-level)

- **Email provider:** $0 to ~$20/month initially (depending on volume/provider).
- **Push messaging infra:** $0 message cost for Expo/FCM/APNs stack; account fees still apply.
- **Apple dev account:** ~$99/year.
- **Redis (if chosen later):** commonly ~$10-30+/month for small managed tiers.
- **GitHub Actions:** may be free/limited depending on repo plan and minutes.

---

## Practical Final Picks (If speed-to-launch is priority)

1. Email: **Resend**
2. Email format: **basic HTML + text fallback**
3. Reset flow: **clickable URL now**, deeper deep-link hardening next
4. Push: **Expo push** + transactional triggers only
5. PartnerLink UI: **match current purple visual language**
6. Splash: **hold splash until silent auth resolves**
7. Rate limiting: **in-memory now**, Redis-ready abstraction
8. Logging: **sanitized log, no token**
9. Validation: `**@Valid` + global `@ControllerAdvice`**
10. CI/CD: **GitHub Actions CI-first**, CD later
11. EAS project ID: **fill now**
12. Google env requirement: **optional now, full removal next cleanup cycle**

