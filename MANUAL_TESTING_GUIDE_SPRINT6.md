# Manual Testing Guide (2 Android Devices + Laptop)

**Status:** Draft v3 (Auth Migration Updated)  
**Goal:** Give you a zero-confusion, step-by-step way to verify current implemented features before GCP deployment, including the new email/password auth system.  
**Scope:** Current features only (email/password auth, linking, gameplay rounds, results, error/reconnect behavior).

---

## 1) Testing Philosophy (Why this workflow)

Manual testing for a real-time mobile app is different from plain API testing:

- You must validate **end-user behavior**, not just HTTP status codes.
- You must validate **synchronization behavior across two users/devices**.
- You must validate **resilience**: network drops, app backgrounding, reconnects.

So this guide uses 3 layers:

1. **Smoke** — app boots and critical path works
2. **Core flow** — full two-player journey
3. **Resilience** — interruptions and recovery

Release criteria: **all test cases pass, zero critical/major bugs open**.

---

## 2) What You Need Before Starting

### Hardware

- 2 physical Android devices (Android 13+ preferred)
- 1 development laptop (your current machine)
- USB cables for both phones (optional, not mandatory)

### Accounts

Use dedicated test users (email/password) instead of Google accounts:

- Device A user:
  - Username: `manual_user_a`
  - Email: `manual_user_a@test.local`
  - Password: `Password123!`
- Device B user:
  - Username: `manual_user_b`
  - Email: `manual_user_b@test.local`
  - Password: `Password123!`

Why fixed identities:

- Makes reruns repeatable
- Helps compare pass/fail behavior between sessions
- Simplifies bug reports and DB inspection

### Running services on laptop

- PostgreSQL (local or Docker)
- Spring Boot backend at port `8080`
- Metro bundler at port `8081`

---

## 2.1) Beginner Setup: Local Environment (Step-by-Step)

This section is the "from zero to running app" checklist for a beginner.
Follow it once in order, then use the rest of this guide for test execution.

## Step 1 - Verify toolchain versions

From terminal, run:

```bash
java -version
node -v
npm -v
adb version
```

Expected:

- Java 17
- Node 18+ (or 20+)
- npm available
- adb available

If `adb` is missing, install Android Studio and SDK Platform Tools first (Step 2).

## Step 2 - Android Studio + SDK setup (beginner path)

This is the most important beginner section. Follow exactly.

Your OS is macOS, so these instructions use mac menus/paths.

### 2.0 - Install Android Studio

1. Go to: `https://developer.android.com/studio`
2. Download latest stable Android Studio.
3. Install it like a normal mac app (drag to Applications).
4. Launch Android Studio.

On first launch you will usually see a Setup Wizard.

- Choose **Standard** install (recommended for beginners).
- Keep default SDK location unless you have a specific reason.
- Let it download required components.

When wizard finishes, open the Android Studio welcome screen.

### 2.1 - Open SDK Manager (where to click)

You can open SDK Manager in either of these ways:

- From Welcome screen: **More Actions -> SDK Manager**
- From inside a project: **Android Studio menu -> Settings -> Languages & Frameworks -> Android SDK**

Use whichever you see.

### 2.2 - Install SDK Platforms (exact checklist)

In SDK Manager, open **SDK Platforms** tab.

1. Enable:
   - **Android 14.0 (API 34)** (minimum required for this guide)
2. Optional but useful:
   - **Android 15 (API 35)** (for extra compatibility checks)

Now click **Apply** -> **OK**.

Wait for downloads to complete.

### 2.3 - Install SDK Tools (exact checklist)

In SDK Manager, open **SDK Tools** tab.

Make sure these are checked:

- Android SDK Build-Tools
- Android SDK Platform-Tools
- Android SDK Command-line Tools (latest)
- Android Emulator

Then click **Apply** -> **OK**.

Important:

- If you see a licenses dialog, click **Accept** for all.
- Do not close Android Studio until installation says completed.

### 2.4 - Verify installs (how to ensure, not guess)

First, verify from Android Studio:

- SDK Manager should show installed checkmarks for items above.
- At top of SDK Manager, note **Android SDK Location** (example: `~/Library/Android/sdk`).

Then verify from terminal:

```bash
ls ~/Library/Android/sdk/platform-tools/adb
ls ~/Library/Android/sdk/emulator/emulator
```

Expected:

- Both commands print existing file paths.
- If either says "No such file", SDK tools not installed correctly.

### 2.5 - Make adb available in terminal PATH (one-time)

If `adb version` fails, add platform-tools to PATH:

```bash
echo 'export ANDROID_HOME="$HOME/Library/Android/sdk"' >> ~/.zshrc
echo 'export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"' >> ~/.zshrc
source ~/.zshrc
adb version
```

Expected:

- `adb version` prints version (not command not found).

### 2.6 - Create emulator A (OnlyYours-A)

1. Open Android Studio -> **More Actions -> Virtual Device Manager** (or **Device Manager**).
2. Click **Create Device**.
3. Choose device:
   - Recommended: Pixel 6 or Pixel 7
4. Click **Next**.
5. System Image screen:
   - Choose an image that has **Google Play** badge/icon.
   - API 34 recommended.

Architecture note:

- Apple Silicon Macs: prefer `arm64-v8a` images.
- Intel Macs: prefer `x86_64` images.

6. Click **Next**.
7. Set AVD Name: `OnlyYours-A`.
8. Advanced settings:
   - Startup orientation: Portrait
   - Graphics: Automatic/Hardware
   - Keep default RAM unless your laptop is very constrained
9. Click **Finish**.

### 2.7 - Create emulator B (OnlyYours-B)

Repeat same process:

- Same device family (or a different one if you want variation)
- Google Play image required
- API 34 recommended
- Name: `OnlyYours-B`

### 2.8 - Boot both emulators and verify they are usable

In Device Manager:

1. Click Play on `OnlyYours-A`
2. Wait until Android home screen fully loads
3. Click Play on `OnlyYours-B`
4. Wait until home screen fully loads

Now verify from terminal:

```bash
adb devices
```

Expected:

- Two entries like:
  - `emulator-5554 device`
  - `emulator-5556 device`

If one shows `offline`, wait 20-30 sec and run again.

### 2.9 - First-time emulator hygiene (avoid future auth/network pain)

Do this once on each emulator:

1. Verify date/time is correct (wrong clock can break token expiry checks).
2. Confirm network is stable (Wi-Fi icon active in emulator).
3. Reboot emulator once after first setup.

Why this matters:

- Access/refresh token behavior depends on correct device time.
- Unstable network produces false negatives during auth/manual tests.

### 2.10 - Common beginner mistakes (avoid these)

- Using inconsistent emulator images across A/B can hide device-specific bugs.
- Using `localhost` instead of `10.0.2.2` for backend host in emulator mode.
- Not waiting for emulator to fully boot before running app install command.
- Closing Metro terminal during app run.
- Skipping license acceptance in SDK tools install.

### 2.11 - Success criteria for Step 2

Step 2 is complete only when all are true:

- [ ] SDK Platform API 34 installed
- [ ] Platform-Tools + Emulator installed
- [ ] `adb version` works in terminal
- [ ] Two emulators created (`OnlyYours-A`, `OnlyYours-B`)
- [ ] `adb devices` shows both emulators as `device`

## Step 3 - Confirm project Android SDK path

Check file:

- `OnlyYoursApp/android/local.properties`

It should contain a valid SDK path, e.g.:

```properties
sdk.dir=/Users/<your-username>/Library/Android/sdk
```

If missing, create/update it.

## Step 4 - Set up local database (PostgreSQL)

Choose one option.

### Option A (recommended): PostgreSQL in Docker

```bash
docker run --name onlyyours-pg \
  -e POSTGRES_PASSWORD=root \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=onlyyours \
  -p 5432:5432 \
  -d postgres:15
```

If container already exists and is stopped:

```bash
docker start onlyyours-pg
```

### Option B: Local PostgreSQL service

- Ensure Postgres is running on `localhost:5432`
- Create DB `onlyyours`
- Create user/password matching backend config

## Step 5 - Backend configuration sanity check

File:

- `backend/src/main/resources/application.properties`

Current defaults (already present):

- DB URL: `jdbc:postgresql://localhost:5432/onlyyours`
- DB user: `postgres`
- DB password: `root`
- JWT secret has a default (override for realistic security testing)
- Google client ID may still exist as a legacy config but is not required for current email/password flows

For local testing, you can start with defaults.

If you use custom values, export env vars before backend run:

```bash
export DATABASE_URL="jdbc:postgresql://localhost:5432/onlyyours"
export DATABASE_USERNAME="postgres"
export DATABASE_PASSWORD="root"
export JWT_SECRET="your_long_random_secret_here"
```

## Step 6 - Start backend

```bash
cd backend
./gradlew bootRun
```

Wait for startup logs to complete.

Health checks from another terminal:

```bash
curl -s http://localhost:8080/actuator/health
curl -i http://localhost:8080/api/user/me
```

Expected:

- health returns UP JSON
- `/api/user/me` without token returns 401/403 (this is good; security is active)

## Step 7 - Configure frontend host for emulator testing

Because you are using Android emulators, set emulator host mapping.

Update these files:

- `OnlyYoursApp/src/services/api.js`
  - `API_URL = 'http://10.0.2.2:8080/api'`
- `OnlyYoursApp/src/state/AuthContext.js`
  - `API_BASE = 'http://10.0.2.2:8080'`

Why:

- In Android emulator, `10.0.2.2` points to your laptop localhost.
- Plain `localhost` inside emulator points to emulator itself.

## Step 8 - Install frontend dependencies and start Metro

```bash
cd OnlyYoursApp
npm install
npm start -- --reset-cache
```

Keep this terminal running.

## Step 9 - Start two emulators

From Android Studio Device Manager:

1. Start `OnlyYours-A`
2. Start `OnlyYours-B`

Verify devices in terminal:

```bash
adb devices
```

Expected entries like:

- `emulator-5554 device`
- `emulator-5556 device`

## Step 10 - Run app on both emulators

From `OnlyYoursApp` directory:

```bash
npx react-native run-android --deviceId emulator-5554
npx react-native run-android --deviceId emulator-5556
```

First run can be slow (Gradle + app install).

## Step 11 - First-time smoke verification

On both emulators:

1. App opens
2. Sign-in screen visible
3. No crash on launch

If this passes, continue to test cases in Section 6.

## Step 12 - Repeatable daily startup routine

For each new testing session:

1. Start DB
2. Start backend
3. Start Metro
4. Start both emulators
5. Run app on both emulators
6. Execute manual test cases

---

## 2.2) Beginner Troubleshooting (Setup Phase)

### Problem: emulator cannot reach backend

Check:

- `API_URL` is `http://10.0.2.2:8080/api` (not localhost)
- `API_BASE` is `http://10.0.2.2:8080`
- backend actually running on port 8080

### Problem: Sign-up/Login fails for all users

Check:

- Backend is reachable from device (`/api/auth/register` and `/api/auth/login` should respond)
- App host config is correct:
  - `OnlyYoursApp/src/services/api.js` -> `API_URL`
  - `OnlyYoursApp/src/state/AuthContext.js` -> `API_BASE`
- DB migration `V5__Email_Auth_Foundation.sql` applied
  - `users` table includes `username`, `password_hash`, `auth_provider`
- Password entered is at least 8 characters (minimum policy)
- Email format is valid

Quick sanity API checks from laptop:

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"probe_user","email":"probe_user@test.local","password":"Password123!"}'

curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"probe_user@test.local","password":"Password123!"}'
```

If both fail, issue is backend/config, not UI.

### Problem: Forgot Password works but reset cannot be completed

Check:

- Backend log contains the dev token line:
  - `DEV ONLY - Password reset token for email <email>: <token>`
- Token copy is exact (no leading/trailing spaces)
- Token is still within expiry window (1 hour)
- Token has not already been used once

### Problem: backend fails at startup with DB errors

Check:

- Postgres running on `5432`
- DB `onlyyours` exists
- username/password match config

For Docker DB:

```bash
docker ps | grep onlyyours-pg
```

### Problem: app build fails on first run

Try clean rebuild:

```bash
cd OnlyYoursApp/android
./gradlew clean
cd ..
npx react-native run-android --deviceId emulator-5554
```

### Problem: Metro stuck or bundle errors

```bash
cd OnlyYoursApp
npm start -- --reset-cache
```

---

## 3) Networking Setup (Most Important)

Your app currently uses backend host defaults like `localhost`.

For physical phones, `localhost` means “the phone itself,” not your laptop.

### Option A (No USB, easiest): Two Android emulators

This is the easiest no-cable setup.

Use backend host:

- API host for emulator: `http://10.0.2.2:8080/api`
- WebSocket base for emulator: `http://10.0.2.2:8080`

Where to update:

- `OnlyYoursApp/src/services/api.js` -> `API_URL`
- `OnlyYoursApp/src/state/AuthContext.js` -> `API_BASE`

Pros:

- No cables
- Stable and repeatable for regression

Cons:

- Less realistic than physical devices for network and hardware behavior

### Option B (No USB): Physical devices over same Wi-Fi

Use laptop LAN IP in app config:

- API base: `http://<LAPTOP_LAN_IP>:8080/api`
- WebSocket base: `http://<LAPTOP_LAN_IP>:8080`

Where to update:

- `OnlyYoursApp/src/services/api.js` -> `API_URL`
- `OnlyYoursApp/src/state/AuthContext.js` -> `API_BASE`

Requirements:

- Both phones and laptop on same Wi-Fi
- Firewall allows inbound `8080` and `8081`

### Option C (If cables available): USB + adb reverse (most reliable physical setup)

This tunnels phone `localhost` traffic to laptop `localhost`.

1. Connect both phones via USB
2. Verify devices:
   - `adb devices`
3. For each device serial:
   - `adb -s <SERIAL_1> reverse tcp:8080 tcp:8080`
   - `adb -s <SERIAL_1> reverse tcp:8081 tcp:8081`
   - `adb -s <SERIAL_2> reverse tcp:8080 tcp:8080`
   - `adb -s <SERIAL_2> reverse tcp:8081 tcp:8081`

Why reverse both ports:

- `8080` for backend API + WebSocket
- `8081` for Metro bundler (debug JS delivery)

---

## 4) Boot Sequence (Exact order)

Follow this exact order each test session:

1. **Start DB**
2. **Start backend**
   - `cd backend && ./gradlew bootRun`
3. **Start Metro**
   - `cd OnlyYoursApp && npm start -- --reset-cache`
4. **Choose test target**
   - Option A: start emulator A + emulator B
   - Option B: use 2 physical devices on same Wi-Fi
5. **If using USB physical devices, run adb reverse**
6. **Install/run app on test target A**
   - `cd OnlyYoursApp && npx react-native run-android --deviceId <SERIAL_1>`
7. **Install/run app on test target B**
   - `cd OnlyYoursApp && npx react-native run-android --deviceId <SERIAL_2>`

Why this order:

- Backend first avoids false “network error” noise in app
- Metro first avoids bundler fetch failures
- Correct host config before launch avoids false network failures

---

## 4.1) Can We Use Expo Go Instead?

Short answer: **Not recommended for this project right now**.

Why:

- This app is a React Native CLI app with native modules and custom runtime assumptions.
- Expo Go can only run apps with Expo Go-supported native module set.
- Migrating this project to full Expo workflow just for testing would add complexity/risk.

Better path:

- Use Android emulators + physical devices for manual testing
- Add Maestro for automated UI smoke checks

---

## 4.2) What “Release Gate” Means in Testing Context

A release gate is the final quality checkpoint before production deploy.

For your project:

1. Automated tests pass
2. Manual critical-path checks pass
3. No critical/major bugs open

Only then release is allowed.

---

## 5) Test Data Strategy (Repeatable runs)

Use fixed test identities each run:

- Device A:
  - Username: `manual_user_a`
  - Email: `manual_user_a@test.local`
  - Password: `Password123!`
- Device B:
  - Username: `manual_user_b`
  - Email: `manual_user_b@test.local`
  - Password: `Password123!`

Reset policy between runs:

- If linking/game state conflicts occur, either:
  - clear app data on both devices, and/or
  - reset DB locally (`DROP/CREATE` only in local env), and rerun migrations
- If auth conflicts occur (stale refresh/reset tokens):
  - clear app data on both devices
  - optionally remove rows from `refresh_tokens` and `password_reset_tokens` for test users

Keep a small “run log”:

- Date/time
- App build hash/branch
- Device models + Android versions
- pass/fail by case ID

---

## 6) Test Cases (Step-by-Step)

Before executing any case below:

1. Follow Section 4 boot sequence exactly.
2. Start backend with logs visible (needed for reset-token verification).
3. Ensure both devices point to correct host config.

## A) Auth Smoke + Happy Path (must pass first)

### M-001 App launch baseline

Steps:

1. Open app on both devices.

Expected:

- App opens without crash.
- `Sign In` screen is visible.
- No infinite loading spinner on first screen.

### M-002 Register Device A user

Steps:

1. Device A -> `Sign Up`.
2. Enter:
   - Username: `manual_user_a`
   - Email: `manual_user_a@test.local`
   - Password: `Password123!`
   - Confirm Password: `Password123!`
3. Tap `Create Account`.

Expected:

- Registration succeeds.
- Device A is auto-logged-in and lands on dashboard.
- No duplicate/validation crash.

### M-003 Register Device B user

Steps:

1. Repeat M-002 on Device B using:
   - Username: `manual_user_b`
   - Email: `manual_user_b@test.local`
   - Password: `Password123!`

Expected:

- Registration succeeds and auto-login works.
- Device B lands on dashboard.

### M-004 Explicit login check after sign-out

Steps:

1. On Device A, open Profile -> `Sign Out`.
2. Confirm `Sign In` screen appears.
3. Sign in using:
   - Email: `manual_user_a@test.local`
   - Password: `Password123!`

Expected:

- Login succeeds.
- Dashboard loads.
- User can access protected screens.

### M-005 Logout behavior

Steps:

1. On Device B, Profile -> `Sign Out`.

Expected:

- User returns to `Sign In`.
- Protected actions unavailable until re-authentication.
- App does not auto-return to dashboard immediately.

### M-006 Session restore on app relaunch

Steps:

1. Keep Device A logged in.
2. Fully close app.
3. Reopen app.

Expected:

- Session is restored (silent refresh/bootstrap).
- App opens directly into logged-in state.
- No manual re-login prompt.

### M-007 Forgot Password request (existing email)

Steps:

1. On Device B (logged out), open `Forgot Password`.
2. Enter `manual_user_b@test.local`.
3. Tap `Send Reset Link`.

Expected:

- Success message appears:
  - "If an account with that email exists, a password reset link has been sent."
- UI behavior does not reveal extra account details.

### M-008 Reset Password completion (happy path)

Steps:

1. In backend logs, locate line:
   - `DEV ONLY - Password reset token for email manual_user_b@test.local: <TOKEN>`
2. Device B -> `Reset Password`.
3. Paste `<TOKEN>`.
4. Set new password: `Password456!` and confirm.
5. Submit reset.
6. Try login with:
   - old password `Password123!` (should fail)
   - new password `Password456!` (should succeed)

Expected:

- Reset request succeeds.
- Old password rejected.
- New password accepted.
- Device B can access dashboard after successful login.

---

## B) Auth Security-Negative + Token Lifecycle

### M-020 Invalid login credential handling

Steps:

1. Try login with valid email + wrong password.
2. Try login with non-existent email + any password.

Expected:

- Both attempts fail.
- User-facing error is generic (`Invalid credentials`) without account enumeration clues.

### M-021 Duplicate registration handling

Steps:

1. Try registering a new user with existing email (`manual_user_a@test.local`).
2. Try registering a new user with existing username (`manual_user_a`) and different email.

Expected:

- Both attempts fail.
- Generic registration failure shown.
- App remains stable.

### M-022 Forgot Password non-existent email (enumeration prevention)

Steps:

1. Open `Forgot Password`.
2. Enter `not_exists@test.local`.
3. Submit request.

Expected:

- Same generic success message as existing-email flow.
- No visible signal about account existence.

### M-023 Reset token one-time use enforcement

Steps:

1. Generate a reset token for Device A account.
2. Use it once successfully.
3. Try using same token again.

Expected:

- First use succeeds.
- Second use fails with invalid/expired message.
- No crash.

### M-024 Reset token expiry enforcement

Steps:

1. Generate a reset token.
2. Wait until token is expired (or force expiry by DB edit in local test env).
3. Attempt reset with expired token.

Expected:

- Reset is rejected.
- Error is clear and non-crashing.

### M-025 Access-token refresh behavior (silent)

Purpose:

- Validate 15-minute access token expiry + refresh-token-based auto-recovery.

Steps:

1. Login on Device A.
2. Keep app open for >=16 minutes without logging out.
3. Trigger protected API action (open Profile or Category list).

Expected:

- User remains logged in.
- Protected request succeeds after silent refresh.
- No manual sign-in interruption.

### M-026 Refresh token revocation on logout

Steps:

1. Login on Device A.
2. Log out via Profile.
3. Fully close app and reopen.

Expected:

- App stays logged out.
- No silent restore with revoked token.

---

## C) Couple Linking Flow

### M-100 Generate code (Device A)

Steps:

1. Device A -> PartnerLink -> Generate code.

Expected:

- 6-character code shown.
- Share button available.

### M-101 Redeem code (Device B)

Steps:

1. Device B enters code -> Connect.

Expected:

- Success alert.
- Dashboard shows linked partner.

### M-102 Negative: self-redeem blocked

Steps:

1. Device A attempts to redeem own code.

Expected:

- Friendly error shown.
- No crash.

### M-103 Negative: reused code blocked

Steps:

1. Attempt redeeming already-used code.

Expected:

- Error shown.
- No duplicate linking.

---

## D) Full Game Flow (Core MVP)

### M-200 Invite flow

Steps:

1. Device A selects category -> invitation sent.
2. Device B waits for invitation modal.

Expected:

- Invitation appears on Device B.
- Accept/Decline controls visible.

### M-201 Decline path

Steps:

1. Device B declines invitation.

Expected:

- Device A receives declined status.
- No stuck loading state.

### M-202 Accept + Round 1

Steps:

1. Device B accepts new invite.
2. Both users answer all Round 1 questions.

Expected:

- Question index advances correctly.
- Waiting indicator appears until partner submits.

### M-203 Round transition

Steps:

1. Complete Round 1.

Expected:

- Transition UI appears.
- Round 2 prompt changes to partner-guessing context.

### M-204 Round 2 feedback

Steps:

1. Submit guesses on both devices.

Expected:

- Feedback overlay appears per guess.
- Correct count updates accurately.

### M-205 Results

Steps:

1. Complete full game.

Expected:

- Results screen appears.
- Scores are plausible and consistent.
- `Play Again` and `Back to Dashboard` both work.

---

## E) Resilience and Interruption Tests

### M-300 Network loss during game

Steps:

1. Disable network on Device B mid-round for ~20 seconds.
2. Re-enable network.

Expected:

- Reconnection banner appears while disconnected.
- App recovers without hard crash.
- Session becomes usable after reconnect.

### M-301 App background/foreground

Steps:

1. Background app on one device during active game for ~30 seconds.
2. Foreground app again.

Expected:

- App resumes gracefully.
- No duplicate submission or broken state.

### M-302 Backend restart during session (local)

Steps:

1. Restart backend while both apps stay open.

Expected:

- Reconnect behavior visible.
- After backend is back, basic operations resume.

---

## F) UX/Polish Verification

### M-400 Loading states

Steps:

1. Navigate profile/category/link/auth flows.

Expected:

- Loading spinner appears during fetches/submits.
- No blank white screens.

### M-401 Empty/error states

Steps:

1. Temporarily stop backend and attempt API-driven screen loads.

Expected:

- User-friendly error/empty state appears.
- Retry action available.
- No raw stack trace visible.

### M-402 Error boundary fallback

Steps:

1. If any fatal UI error occurs, verify fallback screen appears.

Expected:

- App does not freeze permanently.
- Recoverable UX shown.

---

## 7) Evidence Rules (Final Policy)

As finalized by you:

- **Mandatory evidence for failures:** screenshot/video + logs + steps
- **Mandatory evidence for critical-path success (once per release):**
  - sign-up success
  - sign-in success
  - forgot/reset password success
  - linking success
  - full game completion
  - network interruption recovery

This keeps overhead low while preserving release confidence.

---

## 8) Bug Reporting Template

For each failed case, log:

1. Case ID (e.g., `M-300`)
2. Device + Android version
3. Exact steps performed
4. Expected vs actual
5. Screenshot/video
6. Relevant backend log timestamp
7. Severity:
   - Critical (release blocker)
   - Major (core flow broken)
   - Minor (non-blocking UX issue)

---

## 9) Release Decision Gate

Release to production only if:

- [ ] All manual cases pass
- [ ] Auth matrix passes (signup/login/logout/forgot/reset/refresh/revocation)
- [ ] No open critical bugs
- [ ] No open major bugs
- [ ] Backend tests pass
- [ ] Frontend tests pass

---

## 10) What Can Be Automated (and What Can’t, Yet)

### Already automated

- Backend: 113 tests
- Frontend unit/component: 28 tests

### Can be automated next (recommended)

- **Maestro mobile smoke flows** on Android emulator:
  - app launch
  - simple navigation
  - post-login basic checks

### What Maestro is (plain explanation)

Maestro is a mobile UI test automation tool that runs scripted user flows on Android/iOS using simple YAML files.

Think of it as:

- "Robot QA tester" for repeatable UI checks
- Faster than manual for smoke/regression checks
- Easy to run in CI on emulator

Example use:

- Open app
- Enter test email/password and tap `Sign In`
- Assert Dashboard text exists
- Navigate to Profile
- Assert logout button exists

### How Maestro helps your project

1. Catches accidental UI/navigation breakage before you test manually
2. Reduces repetitive checks on every change
3. Gives confidence for automatic deployments

### What Maestro will NOT replace here

- Two real-user synchronized gameplay tests on two physical devices
- Human validation of reset-token handling and auth edge-case UX
- Human UX judgment (copy quality, feel, responsiveness)

### Hard to automate without test hooks

- Full forgot/reset flow with externally delivered tokens
- Two-device synchronized gameplay E2E with real-time edge cases

### Practical automation strategy

1. Keep current backend + frontend automated suite as baseline
2. Add one-device UI smoke automation (Maestro)
3. Keep two-device synchronized gameplay as manual release gate

---

## 11) Open Clarifications for Final Version

- [x] Pass evidence policy finalized: failures + critical-path pass proof
- [x] Emulator in release gate: optional
- [ ] Do you want a printable checklist sheet format (Yes/No boxes) for each run?

