# GCP Deployment Plan (Production-First, Cost-Aware)

**Status:** Draft v2 (updated with your answers)  
**Scope:** Backend production deployment on GCP + CI/CD from GitHub Actions  
**Owner:** You (final approver), with AI-assisted rollout

---

## 1) Key Decisions Already Locked

- **Cloud provider:** GCP only
- **Secrets:** Google Cloud Secret Manager
- **CI/CD:** GitHub Actions
- **Environment model:** Production-first (no long-lived staging, with CI-only staging gates)
- **Release gate:** Fully automatic after required tests pass
- **Auto deploy trigger:** Release tags only
- **Manual testing scope before deployment:** Current implemented features only
- **Domain strategy:** Use default Cloud Run `run.app` URL initially (custom domain later)
- **Manual test evidence policy:** Evidence only for failures + critical-path pass proof
- **Cloud Run minimum instances:** `1` (lowest stable config for your use case)

---

## 2) Cheapest Suitable Architecture for This Product

For your product (Spring Boot backend + WebSocket gameplay), the best MVP balance is:

1. **Cloud Run** for backend container
2. **Cloud SQL (PostgreSQL)** for managed DB
3. **Artifact Registry** for container images
4. **Secret Manager** for runtime secrets
5. **GitHub Actions + Workload Identity Federation** for passwordless deploy

### Why this is the best fit

- **Managed operations:** No server patching, autoscaling built-in
- **Fastest to production:** Works directly with your Dockerfile
- **Cost-effective for MVP traffic:** Pay mostly for usage (except Cloud SQL baseline)
- **Supports WebSockets:** Cloud Run supports long-lived HTTP connections/WebSockets

### Cost theory (important)

- **Cloud Run** itself can be very cheap at low traffic.
- **Cloud SQL** is usually the baseline monthly cost driver.
- So "cheapest serious production setup on GCP" still means Cloud SQL cost floor.

If you wanted absolute-minimum cost, a single VM running app+db can be cheaper, but it's less reliable and more ops-heavy. For production quality, Cloud Run + Cloud SQL is the right choice.

### Reality check for your current budget target (₹50/month)

Your target is excellent for early learning, but for this architecture and GCP managed services:

- `₹50/month` is **not realistic** for always-on production.
- The largest fixed cost is Cloud SQL (managed PostgreSQL).
- Even with tiny usage, a managed production setup will typically exceed this budget.

#### Recommended budget strategy for your PMF phase

1. Keep doing local/manual testing first (near-zero cloud cost)
2. Deploy to GCP only when you are ready for public beta/play-store testing
3. Start with lowest practical paid setup and scale with users

This aligns with your PMF goal while avoiding avoidable spend before launch.

---

## 2.1) Region Recommendation for Hyderabad Users

### Recommendation: `asia-south1` (Mumbai)

Why:

- Lowest latency for your location (Hyderabad) and likely first user base (India)
- Better real-time experience for WebSocket gameplay
- Operational simplicity (single-region close to team/users)

Could another region be marginally cheaper? Sometimes yes, but for this product, latency and UX consistency matter more than tiny regional savings.

---

## 3) Domain Name — Do You Need One?

**Short answer: No, not required initially.**

You can deploy with the default Cloud Run URL:

- `https://<service>-<hash>-<region>.run.app`

This already has TLS (HTTPS) managed by Google.

### When a custom domain helps

- Better brand trust
- Cleaner API URL for mobile clients
- Easier long-term migration and DNS control

### Recommendation

- Start with `run.app` URL now
- Add custom domain after first stable production release

---

## 4) Production-First Release Model (No Permanent Staging)

Since you chose production-first, we will use **pipeline-level gates** instead of a permanent staging environment:

1. Backend tests (`./gradlew test`)
2. Frontend tests (`yarn test`)
3. Optional smoke checks in CI
4. Build image
5. Deploy to production
6. Post-deploy health verification

This gives speed with safety, without maintaining another full environment.

### Why this is the best choice for PMF + fast deployment

You asked whether this is best practice vs speed tradeoff.  
For your current stage, this is the best compromise:

- Faster than maintaining full staging infra
- Safer than direct deploy without pre-deploy checks
- Lower operational burden and cost

#### Final recommendation

- **No long-lived staging environment** right now
- **Strict CI quality gates** + **post-deploy smoke checks** on production
- Revisit staging only when team size/release frequency grows

---

## 4.1) What “Release Gate” Means (Simple)

A **release gate** is a pass/fail checkpoint before production traffic gets a new build.

For your setup, the gate is automated:

1. Run tests (backend + frontend)
2. Build image
3. Deploy candidate revision
4. Run smoke checks on that candidate
5. Only if all checks pass, let it become live

If checks fail, deployment is blocked or rolled back automatically.

In short: gate = “quality lock” before users see a release.

---

## 4.2) How Release Tags Deployments Work

Since you selected “release tags only,” deployment happens only when you explicitly create a tag.

Typical flow:

1. You merge code to `main` (no auto deploy yet)
2. When ready to release, create tag (example: `v0.1.0`)
3. Push tag to GitHub
4. GitHub Actions workflow triggers on `tags: ['v*']`
5. Workflow runs gates (tests + build + deploy + smoke checks)
6. If all pass, release goes live

### Why this is good for PMF phase

- You control exactly when production changes happen
- Safer than deploying every merge
- Still fully automated once tag is pushed

---

## 5) Step-by-Step GCP Setup Guide (What You’ll Do)

## Phase A — One-time GCP Bootstrap

1. **Select region:** `asia-south1` (Mumbai)
2. **Enable APIs:**
   - Cloud Run Admin API
   - Artifact Registry API
   - Cloud SQL Admin API
   - Secret Manager API
   - IAM Credentials API
   - Service Usage API
3. **Create Artifact Registry repo** (Docker format).
4. **Create Cloud SQL PostgreSQL instance** (smallest production-suitable tier).
5. **Create Cloud SQL database + user** for the app.
6. **Create Secret Manager secrets:**
   - `DATABASE_URL`
   - `DATABASE_USERNAME`
   - `DATABASE_PASSWORD`
   - `JWT_SECRET`
   - `GOOGLE_CLIENT_ID`
7. **Create service account** for runtime (Cloud Run service account).
8. **Grant least-privilege IAM** to runtime SA:
   - Secret Manager Secret Accessor
   - Cloud SQL Client
9. **Create Workload Identity Federation** for GitHub Actions deploy.

## Phase B — Backend Deployment Setup

1. Build and push image to Artifact Registry
2. Deploy to Cloud Run with:
   - Runtime service account
   - Secret env var bindings from Secret Manager
   - Cloud SQL connection binding
   - Min instances = 1 (your chosen setting)
3. Verify:
   - `/actuator/health` returns UP
   - DB connectivity works
   - auth + basic API endpoints work

## Phase C — CI/CD Automation (GitHub Actions)

Pipeline:

1. Trigger only on release tags (pattern: `v*`)
2. Run backend and frontend tests
3. Build/push Docker image
4. Deploy to Cloud Run
5. Run post-deploy smoke checks against prod URL
6. Mark release success/failure

---

## 6) WebSocket Considerations on Cloud Run

Your app has real-time gameplay over WebSockets. Cloud Run supports this, but design implications:

- Keep timeouts and reconnect behavior in app robust
- Use autoscaling settings carefully to avoid abrupt scale-down during active sessions
- Start with modest concurrency and monitor latency

Initial safe defaults (to tune later):

- `min-instances: 1` (your choice; avoids full cold starts)
- `max-instances: 2`
- `concurrency: 20`
- `cpu: 1`, `memory: 512Mi` (lowest starting point; monitor OOM and increase to 1Gi if needed)

### Cost note for `min-instances: 1`

Keeping one warm instance improves latency but adds fixed baseline cost.
This is a speed vs cost tradeoff you intentionally chose.

---

## 7) Rollback and Downtime Strategy

You requested “standard industry downtime.”

For this app, target:

- **RTO (rollback time):** 5–15 minutes
- **Deployment downtime:** near-zero for healthy revisions

Rollback plan:

1. Keep previous Cloud Run revision
2. If post-deploy health fails:
   - route traffic back to previous revision immediately
3. Validate health and critical APIs
4. open incident note with root cause and follow-up

---

## 8) Deployment Readiness Checklist (Must Pass)

- [ ] Manual test runbook completed on 2 physical Android devices
- [ ] Backend tests pass
- [ ] Frontend tests pass
- [ ] Secrets created in Secret Manager
- [ ] Cloud SQL connected and verified
- [ ] Cloud Run service healthy
- [ ] Smoke tests pass post-deploy
- [ ] No open critical/major bugs

---

## 9) Open Items (Need Your Final Clarification)

- [x] Preferred GCP region: `asia-south1` (Mumbai)
- [x] Monthly budget preference: ultra-low pre-launch spend (target ₹50, noted as below managed prod floor)
- [x] Start with Cloud Run default domain (`run.app`) approved
- [x] Production minimum instances: `1` (lowest viable config initially)
- [x] CI deploy trigger: release tags only

---

## 10) What We’ll Do Next

1. Finalize manual testing guide execution on your local setup (phone + laptop)
2. Use test outcomes to fix any discovered issues
3. Run GCP bootstrap with exact click-by-click + command-by-command instructions
4. Set up GitHub Actions deployment workflow
5. Do first production deployment + verification runbook

