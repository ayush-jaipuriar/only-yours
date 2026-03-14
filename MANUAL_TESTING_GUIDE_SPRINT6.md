# Manual Testing Guide (2 Android Devices + Laptop)

**Status:** Draft v4 (Phase 2 Expo Migration Added)
**Goal:** Give you a zero-confusion, step-by-step way to verify current implemented features before GCP deployment, including the new email/password auth system.
**Scope:** Current features only (email/password auth, linking, gameplay rounds, results, error/reconnect behavior).

> **Frontend is now Expo (`OnlyYoursExpo/`).** All mobile dev commands below use `OnlyYoursExpo/` and `npx expo`. This guide prioritizes **local builds on your machine**; use EAS cloud only as fallback.

---

## Quick Start (Copy-Paste Runbook)

Use this when you want to start a full local manual test session quickly.

### Terminal A — Backend

```bash
cd /Users/ayushjaipuriar/Documents/GitHub/only-yours/backend
./gradlew bootRun
```

Wait until backend is fully started, then verify:

```bash
curl -s http://localhost:8080/actuator/health
```

Expected: `{"status":"UP"}`

### Terminal B — Frontend Build + Metro

```bash
cd /Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo
source "$HOME/.nvm/nvm.sh"
nvm use 24
npm install
npm run android:local-build

LAN_IP=$(ipconfig getifaddr en0 || ipconfig getifaddr en1)
sed -i '' "s|^EXPO_PUBLIC_API_URL=.*|EXPO_PUBLIC_API_URL=http://$LAN_IP:8080|" .env
REACT_NATIVE_PACKAGER_HOSTNAME="$LAN_IP" npx expo start --dev-client -c
```

### Terminal C — APK install (if needed)

```bash
cd /Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo
adb devices
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

### Terminal D — ADB over Wi-Fi (cable-free installs)

Use this to install APKs wirelessly on both phones.

#### Method 1 (recommended, Android 11+): Wireless debugging pairing

On each phone:

1. Enable **Developer options**
2. Enable **Wireless debugging**
3. Tap **Pair device with pairing code**
4. Note:
  - Pairing endpoint: `<PHONE_IP>:<PAIRING_PORT>`
  - Debug endpoint: `<PHONE_IP>:<DEBUG_PORT>`
  - Pairing code

From laptop:

```bash
# Pair (enter the 6-digit pairing code when prompted)
adb pair <PHONE_IP>:<PAIRING_PORT>

# Connect for normal adb commands
adb connect <PHONE_IP>:<DEBUG_PORT>

# Verify
adb devices
```

Install APK over Wi-Fi:

```bash
adb -s <PHONE_IP>:<DEBUG_PORT> install -r android/app/build/outputs/apk/debug/app-debug.apk
```

Repeat connect/install for Device A and Device B.

#### Method 2 (older fallback): one-time USB then tcpip

```bash
adb devices
adb -s <USB_SERIAL> tcpip 5555
adb connect <PHONE_IP>:5555
adb -s <PHONE_IP>:5555 install -r android/app/build/outputs/apk/debug/app-debug.apk
```

Useful cleanup:

```bash
adb disconnect <PHONE_IP>:<PORT>
adb disconnect   # disconnect all wifi adb sessions
```

### One-time/occasional checks

```bash
LAN_IP=$(ipconfig getifaddr en0 || ipconfig getifaddr en1)

# confirm phone-accessible backend endpoint for current Wi-Fi
curl -s "http://$LAN_IP:8080/actuator/health"

# confirm frontend env is set for phone-on-Wi-Fi
grep "^EXPO_PUBLIC_API_URL" /Users/ayushjaipuriar/Documents/GitHub/only-yours/OnlyYoursExpo/.env
```

### If you see common failures

- **WebSocket timeout:** restart backend + Metro using LAN host override (`REACT_NATIVE_PACKAGER_HOSTNAME`)
- **Failed to connect to `127.0.0.1:8081`:** restart Metro with `LAN_IP=$(ipconfig getifaddr en0 || ipconfig getifaddr en1)` and `REACT_NATIVE_PACKAGER_HOSTNAME="$LAN_IP" npx expo start --dev-client -c`
- **Resend key missing in logs:** verify root `.env` has `RESEND_API_KEY`, then restart backend
- **Node API errors (`toReversed`)**: run `nvm use 24` before Expo commands

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
- Node 24.x (required for this Expo SDK 54 setup)
- npm available
- adb available

If `adb` is missing, install Android Studio and SDK Platform Tools first (Step 2).

## Step 2 - Device setup for Expo testing (beginner path)

This guide uses two **physical Android devices** with Expo Go.

### 2.0 - Install Expo Go on both devices

1. Open Google Play Store on Device A and Device B.
2. Install **Expo Go** (by Expo Inc.).

### 2.1 - Put devices on same Wi-Fi

- Ensure both phones and your laptop are on the same Wi-Fi network.
- Disable VPN temporarily if phone cannot reach local backend.

### 2.2 - Optional: install Android platform tools (for APK sideload / adb reverse)

Only needed if you want `adb install` or USB reverse mode.

```bash
adb version
```

If missing, install Android SDK Platform-Tools and add to PATH.

### 2.3 - Device hygiene checks

Do this once per device:

1. Correct date/time
2. Stable internet
3. Sufficient free storage for APK installs

### 2.4 - Success criteria for Step 2

- Android test devices are ready (Expo Go optional, dev client preferred)
- Both devices share the same Wi-Fi as laptop
- (Optional) `adb version` works if USB/APK flow is needed

---

## Step 2 (Preferred): Local Android Build + Dev Client Workflow

> Primary workflow: build Android locally on laptop, install on device, run via dev client.

### Why local builds first

- Faster and deterministic once local toolchain is configured.
- No cloud queue wait or monthly build quota concerns.
- Better for native debugging and environment parity with your machine.
- Required for push-notification validation (Expo Go cannot fully cover this path).

### Prerequisites

- Node 24 in `OnlyYoursExpo/` terminal (`.nvmrc` is `24`)
- Java 17 available
- Android SDK + platform-tools installed (`adb` must work)
- Physical Android device on same Wi-Fi as laptop

### Step A — Switch to Node 24

```bash
source "$HOME/.nvm/nvm.sh"
nvm use 24
node -v
npm -v
```

### Step B — Run local build script (recommended)

```bash
cd OnlyYoursExpo
npm run android:local-build
```

What this script does:

1. Ensures Node 24+
2. Sets Java 17
3. Sets Android SDK env vars
4. Runs `expo prebuild` for Android
5. Runs `./gradlew assembleDebug`

Expected artifact:

```text
OnlyYoursExpo/android/app/build/outputs/apk/debug/app-debug.apk
```

### Step C — Install APK on phone

```bash
adb devices
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

### Step D — Start Metro for dev client

```bash
cd OnlyYoursExpo
source "$HOME/.nvm/nvm.sh"
nvm use 24
LAN_IP=$(ipconfig getifaddr en0 || ipconfig getifaddr en1)
REACT_NATIVE_PACKAGER_HOSTNAME="$LAN_IP" npx expo start --dev-client -c
```

This prevents the dev client from trying `127.0.0.1:8081` on phone.

Open the installed dev client app on phone and attach to Metro.

### Step E — Cloud fallback only

Use EAS cloud only if local build path is blocked:

```bash
eas build --platform android --profile development
```

### Step F — Troubleshooting local-build path

**`configs.toReversed is not a function`**

- Cause: Node too old.
- Fix:

```bash
source "$HOME/.nvm/nvm.sh"
nvm use 24
```

**`npm ERESOLVE` during Expo/native module install**

- Project fix is applied via `OnlyYoursExpo/.npmrc` (`legacy-peer-deps=true`).
- Retry:

```bash
cd OnlyYoursExpo
npm install
```

**`WebSocket connection timed out` in app logs**

- Ensure backend includes `/ws-native` in security permit list (already fixed).
- Restart backend and app:

```bash
cd backend && ./gradlew bootRun
cd ../OnlyYoursExpo && npx expo start --dev-client -c
```

**App cannot reach backend**

- Check `OnlyYoursExpo/.env`:
  - `EXPO_PUBLIC_API_URL=http://<LAPTOP_LAN_IP>:8080`
- Verify backend health from laptop:

```bash
curl http://<LAPTOP_LAN_IP>:8080/actuator/health
```

### Success criteria for local setup

- Node 24 active in terminal
- `npm run android:local-build` completes
- APK exists at debug output path
- APK installs on device
- `npx expo start --dev-client -c` starts cleanly
- App launches and calls backend over LAN

---

## Step 3 - Confirm Expo project/tooling sanity

Run:

```bash
cd OnlyYoursExpo
nvm use 24
node -v
npx expo --version
```

Expected:

- Node v24.x.x
- Expo CLI responds without errors
- You can run `npx expo start` successfully

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
- Resend sender defaults to `onboarding@resend.dev` unless overridden

Backend now imports env files automatically via:

- `spring.config.import=optional:file:.env[.properties],optional:file:../.env[.properties]`

This means running `./gradlew bootRun` inside `backend/` can still pick up secrets from root `../.env`.

For local testing, you can start with defaults.

If you use custom values, export env vars before backend run:

```bash
export DATABASE_URL="jdbc:postgresql://localhost:5432/onlyyours"
export DATABASE_USERNAME="postgres"
export DATABASE_PASSWORD="root"
export JWT_SECRET="your_long_random_secret_here"
export RESEND_API_KEY="re_your_resend_api_key_here"
export RESEND_FROM_EMAIL="onboarding@resend.dev"
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

## Step 7 - Configure frontend host for Expo phone testing

Because the app now runs on your physical phone (Expo Go / EAS APK), the backend URL must be reachable from your phone.

### Option A (recommended): Same Wi-Fi LAN

Update this file:

- `OnlyYoursExpo/.env`
  - `EXPO_PUBLIC_API_URL=http://<your-laptop-lan-ip>:8080`

Example:

```text
EXPO_PUBLIC_API_URL=http://192.168.1.23:8080
```

Quick verify (must match your current LAN IP):

```bash
grep "^EXPO_PUBLIC_API_URL" OnlyYoursExpo/.env
```

Find your laptop LAN IP on macOS:

```bash
ipconfig getifaddr en0
```

Why this is required:

- `localhost` on your phone means the phone itself, not your laptop.
- `10.0.2.2` works only for Android emulators, not real phones.

### Option B: Tunnel mode (different networks or strict Wi-Fi)

If phone and laptop cannot be on the same LAN, expose backend via a secure tunnel (for testing only), then point `EXPO_PUBLIC_API_URL` to that HTTPS URL.

Example tools:

- Cloudflare Tunnel
- ngrok

Important:

- Use tunnels only for local testing.
- Keep JWT secret strong and do not expose admin endpoints.

## Step 8 - Install frontend dependencies, build local APK, then start Expo

```bash
cd OnlyYoursExpo
source "$HOME/.nvm/nvm.sh"
nvm use 24
npm install
npm run android:local-build

LAN_IP=$(ipconfig getifaddr en0 || ipconfig getifaddr en1)
sed -i '' "s|^EXPO_PUBLIC_API_URL=.*|EXPO_PUBLIC_API_URL=http://$LAN_IP:8080|" .env
REACT_NATIVE_PACKAGER_HOSTNAME="$LAN_IP" npx expo start --dev-client -c
```

Important:

- Use `npx expo ...` commands.
- `npm expo start` is invalid and will fail with "Unknown command: expo".
- For day-to-day testing, dev client is primary (`--dev-client`).

Keep this terminal running.

If phone cannot discover LAN server, use:

```bash
npx expo start --tunnel
```

Important package-manager note:

- Root repo (`only-yours`) is Yarn-managed for the legacy RN CLI app.
- `OnlyYoursExpo/` is npm-managed (`package-lock.json`) and should use npm commands.
- Use commands in the matching project directory to avoid lockfile drift:
- `OnlyYoursExpo` -> `npm install`, `npm run android:local-build`, `npx expo start --dev-client -c`

If npm reports transient dependency issues in `OnlyYoursExpo`, retry with:

```bash
npm install --legacy-peer-deps
```

and then retry normal npm workflow.

## Step 9 - Prepare two physical Android devices

1. Ensure local dev client APK is installed on Device A and Device B.
2. Ensure both phones are on the same Wi-Fi as your laptop.
3. Confirm `OnlyYoursExpo/.env` uses laptop LAN IP (from Step 7).

Optional validation:

```bash
curl http://<your-laptop-lan-ip>:8080/actuator/health
```

## Step 10 - Open app on both devices

From `OnlyYoursExpo` directory:

```bash
npx expo start --dev-client -c
```

Then:

1. Open installed dev client on Device A and connect to Metro.
2. Open installed dev client on Device B and connect to Metro.
3. Wait for bundle load on both devices.

## Step 11 - First-time smoke verification

On both devices:

1. App opens
2. Sign-in screen visible
3. No crash on launch
4. Auth API calls succeed (no `Network Error`)

If this passes, continue to test cases in Section 6.

## Step 12 - Repeatable daily startup routine

For each new testing session:

1. Start DB
2. Start backend
3. Start Expo (`npx expo start --dev-client -c`)
4. Open app on both phones via installed dev client
5. Execute manual test cases

---

## 2.2) Beginner Troubleshooting (Setup Phase)

### Problem: phone cannot reach backend

Check:

- `EXPO_PUBLIC_API_URL` in `OnlyYoursExpo/.env` is `http://<your-laptop-lan-ip>:8080` (not localhost)
- backend actually running on port 8080
- phone and laptop are on same Wi-Fi network
- no VPN/firewall is blocking LAN traffic

### Problem: Sign-up/Login fails for all users

Check:

- Backend is reachable from device (`/api/auth/register` and `/api/auth/login` should respond)
- App host config is correct:
  - `OnlyYoursExpo/.env` -> `EXPO_PUBLIC_API_URL`
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

Special case: if backend logs show `io.jsonwebtoken.io.DecodingException: Illegal base64 character: '_'` during register/login:

- Cause: JWT signing used a Base64-decoding path for `jwt.secret`; secrets with `_` fail decode.
- Fix applied in this repo: `JwtService` now signs/parses with an HMAC key built from UTF-8 bytes (`Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8))`) instead of string/Base64 overloads.
- Action: restart backend after pulling latest changes.

### Problem: Forgot Password works but reset cannot be completed

Check:

- Backend log contains the dev token line:
  - `DEV ONLY — reset code for <email>: <token>`
- Token copy is exact (no leading/trailing spaces)
- Token is still within expiry window (1 hour)
- Token has not already been used once

### Problem: backend logs show `RESEND_API_KEY not configured`

This is backend configuration, not frontend/mobile configuration.

Check:

1. Root `.env` contains:
  - `RESEND_API_KEY=<your_resend_key>`
  - `RESEND_FROM_EMAIL=onboarding@resend.dev` (or your verified sender)
2. Backend loads `.env` through Spring config import (already configured)
3. Backend process restarted after env changes:

```bash
cd backend
./gradlew bootRun
```

Important concept:

- `EXPO_PUBLIC_*` affects the mobile app only.
- `RESEND_API_KEY` must be visible to backend process.

### Problem: backend fails at startup with DB errors

Check:

- Postgres running on `5432`
- DB `onlyyours` exists
- username/password match config

For Docker DB:

```bash
docker ps | grep onlyyours-pg
```

### Problem: app fails to load in dev client / Expo Go

Try clean restart:

```bash
cd OnlyYoursExpo
source "$HOME/.nvm/nvm.sh"
nvm use 24
LAN_IP=$(ipconfig getifaddr en0 || ipconfig getifaddr en1)
REACT_NATIVE_PACKAGER_HOSTNAME="$LAN_IP" npx expo start --dev-client -c
```

If you see `configs.toReversed is not a function`:

- Cause: Node version too old.
- Fix:

```bash
cd OnlyYoursExpo
source "$HOME/.nvm/nvm.sh"
nvm use 24
LAN_IP=$(ipconfig getifaddr en0 || ipconfig getifaddr en1)
REACT_NATIVE_PACKAGER_HOSTNAME="$LAN_IP" npx expo start --dev-client -c
```

If dev client shows `failed to connect to 127.0.0.1:8081`:

- Cause: Metro advertised loopback host (`127.0.0.1`) instead of laptop LAN IP.
- Fix:

```bash
cd OnlyYoursExpo
LAN_IP=$(ipconfig getifaddr en0 || ipconfig getifaddr en1)
REACT_NATIVE_PACKAGER_HOSTNAME="$LAN_IP" npx expo start --dev-client -c
```

If you see `Network Error` after app loads:

- Verify LAN IP in `OnlyYoursExpo/.env` (`EXPO_PUBLIC_API_URL`)
- Verify backend health from laptop:

```bash
curl http://localhost:8080/actuator/health
```

- If still blocked by network, use tunnel mode:

```bash
cd OnlyYoursExpo
npx expo start --tunnel
```

If dev client/Expo Go only shows infinite loader and Metro looks idle:

- Confirm Node runtime and modern JS APIs are available:

```bash
cd OnlyYoursExpo
nvm use 24
node -v
node -e "console.log(typeof [].toReversed)"   # must print: function
```

- Confirm Metro can build both platform bundles locally:

```bash
curl -I "http://localhost:8081/index.bundle?platform=ios&dev=true&minify=false"
curl -I "http://localhost:8081/index.bundle?platform=android&dev=true&minify=false"
```

- Expected: both return HTTP 200. If 200 locally but phone still spins, it is almost always LAN/VPN/firewall/QR-session mismatch, so use `--tunnel` and rescan.

### Problem: `[AuthContext] WebSocket connection error: WebSocket connection timed out`

Most common causes and fixes:

1. Backend security not permitting native endpoint path
  - Ensure `/ws-native` and `/ws-native/**` are permitted in `SecurityConfig` (already fixed in latest code).
2. Backend restarted is stale / old process still running
  - Restart backend with latest code:

```bash
cd backend
./gradlew bootRun
```

3. Frontend still running stale bundle
  - Restart Metro and reload dev client:

```bash
cd OnlyYoursExpo
source "$HOME/.nvm/nvm.sh"
nvm use 24
LAN_IP=$(ipconfig getifaddr en0 || ipconfig getifaddr en1)
REACT_NATIVE_PACKAGER_HOSTNAME="$LAN_IP" npx expo start --dev-client -c
```

### Problem: both phones are stuck on **"Loading question..."**

Symptoms:

- Session opens on both devices, but no question payload appears.
- Backend logs show `Game session created ... status=INVITED`, but no `Game started` acceptance log.

Root cause:

- The session is still in `INVITED` state (acceptance event was not processed yet), so `/game/{sessionId}/current-question` cannot return a question.

Recovery flow (new default):

1. Open the stuck game session on either device.
2. Tap **Accept Invitation** on the in-app pending-invitation panel.
3. On both devices, tap **Refresh Session** once if the first question does not appear immediately.
4. Verify backend now logs `Game started: session=...`.

Hard fallback if still blocked:

```bash
cd OnlyYoursExpo
source "$HOME/.nvm/nvm.sh"
nvm use 24
LAN_IP=$(ipconfig getifaddr en0 || ipconfig getifaddr en1)
REACT_NATIVE_PACKAGER_HOSTNAME="$LAN_IP" npx expo start --dev-client -c
```

### Problem: both phones are stuck on **"Waiting for partner..."** on question 1

Symptoms:

- Both players submit an answer on the first question almost simultaneously.
- Backend logs show both `Answer recorded` events for the same question, but no `Both players answered ... Advancing...` log for that question.
- Both phones remain in waiting state even though both users already answered.

Root cause:

- This was a Round 1 concurrency race in older backend code: two parallel answer submissions could each count only one visible answer before the peer transaction committed.
- Result: both requests took the "waiting" branch, and the session did not advance.

Fix status:

- Latest backend includes session-level locking + recovery logic in `GameService.submitAnswer`.
- If you still see this issue, ensure backend is restarted on latest code before testing.

Recovery for an already-stuck session created before backend restart:

1. Restart backend on latest code.
2. Re-open the active game session on both devices (or use in-app refresh).
3. If session still does not advance, start a fresh invitation (old stale session may already be in a dead-end state from older backend behavior).

Verification steps (post-fix):

1. Start a fresh invitation/game session.
2. On question 1, tap answers on both phones nearly at the same time.
3. Confirm backend logs now include exactly one advancement path:
   - one request may still log `Waiting for partner...`
   - the paired request must log `Both players answered question ... Advancing...`
4. Confirm both clients move to question 2 without manual restart.

### Problem: Expo requests fail with `401/403` and Profile shows "Couldn't Load Profile"

Most common cause in this codebase:

- Access token is missing/expired/invalid, and backend returns `403` for unauthenticated request.
- Some screen calls accidentally used `/api/...` while `API_URL` already ends with `/api`, producing wrong routes like `/api/api/user/me`.

What is already fixed:

- `OnlyYoursExpo/src/services/api.js` now treats both `401` and `403` as auth-expiry signals and triggers refresh-and-retry.
- Backend security now sends `401 Unauthorized` for unauthenticated requests where possible.
- Endpoint paths normalized in screens:
  - `ProfileScreen`: `/user/me`
  - `DashboardScreen`: `/couple`
  - `CategorySelectionScreen`: `/content/categories`

What to do now:

```bash
# Restart backend with latest code
cd backend
./gradlew bootRun

# Restart Expo with clean cache + LAN host override
cd ../OnlyYoursExpo
source "$HOME/.nvm/nvm.sh"
nvm use 24
LAN_IP=$(ipconfig getifaddr en0 || ipconfig getifaddr en1)
REACT_NATIVE_PACKAGER_HOSTNAME="$LAN_IP" npx expo start --dev-client -c
```

If issue persists:

- Fully sign out from app and sign in again (to regenerate tokens).
- Verify JWT secret is stable between backend restarts.
- Check backend logs for JWT parse/sign exceptions.
- If Expo says port `8081` is already used by another project, start Expo on offered port (`8082` etc.) and scan the new QR code.

---

## 3) Networking Setup (Most Important)

Your app currently uses backend host defaults like `localhost`.

For physical phones, `localhost` means “the phone itself,” not your laptop.

### Option A (Recommended): Physical devices over same Wi-Fi LAN

Use laptop LAN IP in app config and Metro host advertisement:

- Frontend env base: `http://<LAPTOP_LAN_IP>:8080`
- Metro host override: `REACT_NATIVE_PACKAGER_HOSTNAME=<LAPTOP_LAN_IP>`

Where to update:

- `OnlyYoursExpo/.env` -> `EXPO_PUBLIC_API_URL`

Requirements:

- Both phones and laptop on same Wi-Fi
- Firewall allows inbound `8080`

### Option B (Fallback): USB + adb reverse

This tunnels phone `localhost` traffic to laptop `localhost`.

1. Connect both phones via USB
2. Verify devices:
  - `adb devices`
3. For each device serial:
  - `adb -s <SERIAL_1> reverse tcp:8080 tcp:8080`
  - `adb -s <SERIAL_2> reverse tcp:8080 tcp:8080`

Why reverse port `8080`:

- API + WebSocket traffic to backend

---

## 4) Boot Sequence (Exact order)

Follow this exact order each test session:

1. **Start DB**
2. **Start backend**
  - `cd backend && ./gradlew bootRun`
3. **Start Expo**
  - `cd OnlyYoursExpo && source "$HOME/.nvm/nvm.sh" && nvm use 24 && LAN_IP=$(ipconfig getifaddr en0 || ipconfig getifaddr en1) && REACT_NATIVE_PACKAGER_HOSTNAME="$LAN_IP" npx expo start --dev-client -c`
4. **Open app on Device A**
  - Open installed local dev client
5. **Open app on Device B**
  - Open installed local dev client
6. **If using USB reverse fallback, run `adb reverse` for port `8080`**
7. **Run manual test matrix**

Why this order:

- Backend first avoids false “network error” noise in app
- Expo first avoids stale bundle/cache issues
- Correct host config before launch avoids false network failures

---

## 4.1) Can We Use Expo Go Instead?

Short answer: **Yes for quick UI/API checks, but not as primary path now**.

Why not primary:

- Push-notification and native-runtime verification require dev client builds.
- Local build + dev client is the default workflow for this project.

Recommended split:

- Primary: local Android build + dev client
- Secondary: Expo Go for quick JS-only checks
- Fallback: EAS cloud only if local build environment is blocked

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

- All manual cases pass
- Auth matrix passes (signup/login/logout/forgot/reset/refresh/revocation)
- No open critical bugs
- No open major bugs
- Backend tests pass
- Frontend tests pass

---

## 10) What Can Be Automated (and What Can’t, Yet)

### Already automated

- Backend: 113 tests
- Frontend unit/component: 28 tests

### Can be automated next (recommended)

- **Maestro mobile smoke flows** on Android (physical devices or managed device farms):
  - app launch
  - simple navigation
  - post-login basic checks

### What Maestro is (plain explanation)

Maestro is a mobile UI test automation tool that runs scripted user flows on Android/iOS using simple YAML files.

Think of it as:

- "Robot QA tester" for repeatable UI checks
- Faster than manual for smoke/regression checks
- Easy to run in CI on Android device farms/emulators when needed

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

- Pass evidence policy finalized: failures + critical-path pass proof
- Emulator in release gate: optional
- Do you want a printable checklist sheet format (Yes/No boxes) for each run?

---

## 12) UI Hotfix Verification (Auth + Landscape)

Use this focused checklist after pulling the Feb 22 stabilization patch.

### Keyboard overlap regression check (Android)

- Open `Sign In`, `Sign Up`, `Forgot Password`, and `Reset Password`.
- Tap into the lowest input field on each screen (for example, `Confirm Password`).
- Confirm the form scrolls/moves so the field stays visible above the keyboard.
- Keep keyboard open and tap buttons/links (for example, "Back to Sign In") to verify taps are still handled.

### Dark-mode input readability check

- Set both phones to system dark mode.
- Open all auth screens and type in email/password fields.
- Confirm typed text is readable and high-contrast.
- Confirm placeholder text is visible but clearly lower emphasis than typed text.

### Tablet + landscape check (all screens baseline)

- Rotate phone and tablet to landscape across these critical flows:
  - auth screens
  - dashboard
  - category selection
  - game screen
  - results screen
- Confirm no clipped controls and no unreachable actions.
- In `GameScreen`, verify question/options/footer remain accessible (scroll if needed in compact heights).

---

## 13) Phase A Continuation Verification (Single Active + Resume + Expiry)

Run this matrix after the Phase A continuation patch.

### Phase A Preconditions

- Two linked users (`User A`, `User B`) on separate devices.
- Backend deployed with migration `V7__PhaseA_Game_Session_Continuation.sql`.
- Both users logged in and websocket connected.

### C-1301 One-active-session enforcement

- `User A` starts a game invite in any category.
- Before that game completes, `User A` tries to start another invite.
- Expected:
  - second invite is blocked (no new active session created),
  - user gets continuation guidance instead of a second session,
  - dashboard continues to show only one active session.

### C-1302 Continue CTA visibility and routing

- With an active session in `INVITED` or `ROUND1`/`ROUND2`, open Dashboard.
- Expected:
  - "Continue Game" CTA card is visible,
  - tapping it opens `GameScreen` for the existing `sessionId`,
  - app does not create a new game session implicitly.

### C-1303 Resume from middle of round (sequential contract)

- Start round 1 and answer 2-3 questions.
- Kill app on `User A` device (or logout/login), then return.
- Tap Continue Game.
- Expected:
  - app restores current question from server snapshot,
  - only one current question is shown (no full question list),
  - progress continues from persisted index without skipping/repeating incorrectly.

### C-1304 Round unlock guards

- Complete only one player's answer for a question and verify no round transition.
- Complete both players for all round 1 questions.
- Expected:
  - `ROUND2` starts only after both players complete round 1.
- In round 2, complete guesses with only one player on last question first.
- Expected:
  - final result is emitted only after both players complete round 2.

### C-1305 Session expiry behavior

- Using debug/admin DB update, set active session `expires_at` in the past.
- Attempt action (answer/guess/accept/continue load).
- Expected:
  - session transitions to `EXPIRED`,
  - user sees actionable expired guidance,
  - user can start a fresh game afterwards.

### C-1306 Partner presence signals

- With active session running, disconnect `User B` network/app.
- Expected on `User A`:
  - receives partner-left update.
- Reconnect `User B`.
- Expected on `User A`:
  - receives partner-returned update.

### Evidence capture for Phase A sign-off

- Screenshot/video of:
  - one-active-session block,
  - continue CTA + successful resume,
  - expiry handling,
  - round unlock correctness,
  - partner-left/returned notifications.
- Include relevant backend log timestamps for each scenario.

---

## 14) Phase B Verification (History + Stats + Badges)

Run this matrix after pulling the Phase B patch (history/stats/badges).

### Phase B Preconditions

- Two linked users (`User A`, `User B`) with at least 5 completed sessions between them.
- Backend includes migration `V8__PhaseB_History_Stats_Indexes.sql`.
- App build includes:
  - `GameHistory` route,
  - dashboard stats cards,
  - dashboard/profile badge surfaces.

### B-1401 History list baseline + pagination

- Open `Dashboard` -> tap `Game History`.
- Expected:
  - first page loads with recent sessions,
  - each card shows date, partner name, result, and score pair,
  - tapping `Load More` appends older items without replacing prior ones.
- Continue until no more pages.
- Expected:
  - terminal message appears ("caught up" equivalent),
  - no duplicate cards.

### B-1402 Sort and winner filters

- In `Game History`, switch sort to `Oldest`.
- Expected:
  - order reverses deterministically.
- Apply winner filter `I Won`.
- Expected:
  - only sessions where current user score > partner score remain.
- Apply winner filter `Partner Won`.
- Expected:
  - only sessions where partner score > current user score remain.
- Switch back to `All`.
- Expected:
  - full list returns.

### B-1403 Empty/error behavior

- Use a fresh account with zero completed sessions.
- Open `Game History`.
- Expected:
  - empty state is shown with clear guidance, no crash.
- Simulate transient network loss and retry.
- Expected:
  - error state appears with retry action,
  - retry recovers once network is restored.

### B-1404 Dashboard stats correctness

- Open Dashboard after known completed-session sample set.
- Validate displayed values against backend truth:
  - `gamesPlayed`,
  - `averageScore`,
  - `bestScore`,
  - `streakDays`,
  - `invitationAcceptanceRate`,
  - `avgInvitationResponseSeconds`.
- Expected:
  - values are deterministic across app relaunch,
  - fallback-safe rendering (zeros/placeholders) for no-history users.

### B-1405 Badge unlock and visibility

- On account with qualifying data, verify badges appear in:
  - Dashboard badge section,
  - Profile badge section.
- Confirm expected unlocked examples:
  - `FIRST_GAME` after first completion,
  - `FIVE_GAMES` after 5 completions,
  - `SHARP_GUESSER` after score >= 7,
  - `STREAK_3` after 3-day streak,
  - `RESPONSIVE_COUPLE` when acceptance-rate threshold met.
- Expected:
  - badges are consistent across both screens,
  - badges persist after logout/login.

### B-1406 Navigation and action priority guard

- Ensure primary game actions still work with stats/badge UI present:
  - Start New Game path (linked and no active game),
  - Continue Game path (active session exists),
  - Link with Partner path (unlinked user).
- Expected:
  - stats/badges do not block or regress core gameplay entry flows.

### Evidence capture for Phase B sign-off

- Screenshots/video of:
  - history pagination and filter transitions,
  - dashboard stats values,
  - badge visibility on dashboard + profile,
  - no-history empty state.
- Optional backend log/API snapshots:
  - `GET /api/game/history`,
  - `GET /api/game/stats`,
  - `GET /api/game/badges`.

---

## 15) Phase C Verification (Onboarding + Theme + Responsive)

Run this matrix after pulling the Phase C patch (onboarding, settings replay, tokens/theme provider, responsive pass).

### Preconditions

- Latest app build includes:
  - `Onboarding` + `Settings` routes,
  - theme preference controls (`system`/`light`/`dark`),
  - responsive updates across auth/dashboard/game/results/profile.
- Test on at least:
  - one phone device (portrait + landscape),
  - one tablet or large-screen emulator/device (portrait + landscape).

### C-1501 First-run onboarding gate

- Use a fresh account (or reset onboarding state from settings replay path and relaunch).
- Login and observe initial post-auth route.
- Expected:
  - onboarding is shown before dashboard,
  - onboarding displays sequential narrative steps,
  - `Next` advances step-by-step and `Get Started` lands on dashboard.

### C-1502 Onboarding replay from settings

- From `Profile`, open `Settings`.
- Tap `Replay Onboarding`.
- Expected:
  - app navigates to onboarding,
  - onboarding progresses normally and completion returns user to dashboard,
  - auth session remains intact (no forced logout, no token reset).

### C-1503 Theme preference persistence

- In `Settings`, set theme to:
  - `Light`, verify immediate UI update.
  - `Dark`, verify immediate UI update.
  - `System`, verify app follows device theme.
- Fully close and reopen app after each mode.
- Expected:
  - selected preference persists,
  - key screens retain readability and contrast.

### C-1504 Auth stack responsive + keyboard safety

- Open: `Sign In`, `Sign Up`, `Forgot Password`, `Reset Password`.
- Rotate between portrait and landscape on phone and tablet.
- Trigger keyboard on lower input fields.
- Expected:
  - no input is hidden by keyboard,
  - form remains scrollable/tappable,
  - tablet layouts preserve centered/max-width form readability.

### C-1505 Dashboard ecosystem responsive pass

- Validate `Dashboard`, `CategorySelection`, `PartnerLink`, `GameHistory` on phone/tablet in both orientations.
- Expected:
  - no clipped primary actions,
  - card widths and grid rows adapt without overlap,
  - filters/actions remain reachable in compact heights.

### C-1506 Gameplay + results responsive pass

- Start/continue a game and validate `GameScreen` in compact landscape and tablet widths.
- Complete game and validate `ResultsScreen`.
- Expected:
  - question/options/submit CTA remain reachable,
  - progress and status text remain legible,
  - results cards/buttons remain fully visible without clipping.

### C-1507 Profile/settings contrast consistency

- Validate `Profile` and `Settings` in both light and dark modes.
- Expected:
  - text contrast is readable,
  - settings option states are visually clear,
  - action buttons remain distinguishable in both modes.

### Evidence capture for Phase C sign-off

- Capture screenshot/video evidence for:
  - first-run onboarding gate,
  - replay onboarding from settings,
  - theme persistence across relaunch,
  - responsive behavior on phone + tablet (portrait + landscape),
  - gameplay/results no-clipping proof.

### Phase C strict execution order (recommended)

Use this exact order so failures are isolated to one layer at a time:

1. Run `C-1501` and `C-1502` first to validate onboarding state transitions before visual/theme checks.
2. Run `C-1503` second to validate persistence semantics (`system`/`light`/`dark`) before cross-screen sweeps.
3. Run `C-1504` next because auth keyboard + layout regressions can block all later test accounts.
4. Run `C-1505`, `C-1506`, and `C-1507` in sequence for full app responsive + contrast validation.
5. Capture evidence after each case immediately (do not defer captures to the end of the run).
6. If any case fails, log defect details, keep running remaining cases, then execute a focused retest pass only for failed cases.

### Phase C evidence template (copy for each run)

Use this template as the official pass/fail artifact for sign-off.

```markdown
## Phase C Manual Validation Run

- Date:
- Tester:
- Build/Commit:
- Environment:
- Phone Device:
- Tablet/Large Device:

### Case Results

| Case ID | Status (Pass/Fail/Blocked) | Evidence (Screenshot/Video file) | Observed Behavior | Expected Behavior | Defect ID (if any) |
| --- | --- | --- | --- | --- | --- |
| C-1501 |  |  |  |  |  |
| C-1502 |  |  |  |  |  |
| C-1503 |  |  |  |  |  |
| C-1504 |  |  |  |  |  |
| C-1505 |  |  |  |  |  |
| C-1506 |  |  |  |  |  |
| C-1507 |  |  |  |  |  |

### Defect Summary

- Total failures:
- Total blocked:
- Critical defects:
- High defects:

### Retest Summary

- Retest required: Yes/No
- Retest build/commit:
- Retest result:

### Final Recommendation

- Ready for Phase C sign-off: Yes/No
- Notes:
```

---

## 16) Phase D Verification (Unlink Controls + Profile/Settings + Notification Deep-Links)

## 17) Phase E Verification (Dark Mode Completion + Cross-Theme Visual Polish)

Use this section after Phase E implementation to run the deferred visual sign-off.

### Objective

Verify that the `Warm Luxe` dark-mode redesign is visually coherent, readable, and consistent across all primary Expo flows while theme switching remains stable for:

- `system`
- `light`
- `dark`

### Preconditions

- Latest `OnlyYoursExpo/` Phase E build installed
- Theme preference controls available in Settings
- At least one linked-couple account available so dashboard/history/game/results surfaces can be reached
- One completed game available so history/results surfaces can be checked

### Required screen list

Validate all of the following in `dark`, then spot-check parity in `light`, then confirm `system` resolves correctly:

- Sign in
- Sign up
- Forgot password
- Reset password
- Onboarding
- Dashboard
- Partner link
- Category selection
- Game
- Results
- Game history
- Profile
- Settings

### Visual acceptance checklist

- [ ] No unreadable text or washed-out contrast on any primary surface
- [ ] No light-only cards, inputs, banners, or badges remain in dark mode
- [ ] Elevated cards/panels are visually distinct from the base background
- [ ] Form fields feel intentional in dark mode and are not just flat inverted light inputs
- [ ] CTA buttons remain visually clear and correctly prioritized
- [ ] Reliability UI is readable:
  - reconnect banner
  - loading states
  - empty states
  - inline error/success states
- [ ] Game option states remain clear:
  - unselected
  - selected
  - submitted
  - disabled
- [ ] Results screen still feels celebratory in dark mode
- [ ] History badges and profile badges look intentional in both themes
- [ ] No clipped text, overflow, or broken spacing introduced by visual polish
- [ ] Theme switching in Settings persists after app restart
- [ ] `system` mode matches device appearance correctly

### Evidence to capture

Capture at least one screenshot per major surface in dark mode, plus one screenshot each for:

- Settings theme selector in all three modes
- Dashboard
- Game
- Results
- History
- Profile
- Partner link

### Defect logging guidance

Log each visual issue with:

- screen name
- theme mode
- device/orientation
- screenshot
- issue type:
  - contrast
  - hierarchy/depth
  - clipped text
  - hardcoded light artifact
  - inconsistent component styling
  - theme persistence failure

Run this matrix after pulling the Phase D patch (soft-unlink lifecycle, cooldown/recovery, profile/preferences persistence, and deep-link reliability updates).

## 18) Phase F Verification (Accessibility Baseline Across Primary Flows)

Use this section after Phase F implementation to run the deferred screen-reader validation pass.

### Objective

Verify that the active Expo app is usable at a baseline level with screen readers, with Android/TalkBack as the primary acceptance bar and iOS/VoiceOver as a secondary parity check.

### Preconditions

- Latest `OnlyYoursExpo/` Phase F build installed
- Device screen reader available:
  - TalkBack on Android
  - VoiceOver on iOS if doing parity spot checks
- One linked-couple account available so dashboard/game/history/results flows can be reached
- One active or resumable game session available so gameplay announcements can be exercised
- One completed game available so results and history semantics can be checked

### Accessibility acceptance checklist

- [ ] Primary interactive controls expose meaningful spoken labels
- [ ] Buttons announce as buttons rather than unlabeled text blocks
- [ ] Decorative emoji/illustrations are not read when they add no value
- [ ] Form fields are discoverable in a sensible order on:
  - sign in
  - sign up
  - forgot password
  - reset password
  - settings
  - profile edit
- [ ] Settings choice chips expose selected state clearly
- [ ] Category filter chips and history filter chips expose selected state clearly
- [ ] Game answer options expose selected/disabled state clearly
- [ ] Progress/state is understandable without relying on layout or color alone
- [ ] Critical runtime announcements are spoken clearly:
  - reconnect/disconnect
  - invitation pending / refresh path
  - round transition into guessing
  - guess result reveal
  - results ready
  - partner-code generated/copied
  - unlink/recover outcomes
- [ ] No major duplicate spoken output from nested wrappers and children

### Required walkthrough matrix

- Auth:
  - Verify email/password/token inputs announce purpose correctly
  - Verify validation and success messages are read when they appear
  - Verify navigation links to sign up / forgot password / sign in are discoverable
- Onboarding:
  - Verify current step title is understandable without relying on emoji
  - Verify onboarding progress is announced as progress
  - Verify Next / Get Started / Skip are clear
- Dashboard:
  - Verify Start New Game / Continue Game / Link with Partner announce intent clearly
  - Verify stat cards are understandable as spoken summaries
  - Verify Game History and View Profile links are discoverable
- Partner Link:
  - Verify generated code is spoken intelligibly
  - Verify Copy / Share / Connect actions announce correctly
  - Verify entered partner code field has a clear label
- Category Selection:
  - Verify each category card speaks title + description + sensitive warning when applicable
  - Verify invitation-in-flight state does not leave controls ambiguous
- Game:
  - Verify question progress is announced
  - Verify each answer option speaks letter + content + selected state
  - Verify submit button disabled/enabled state is understandable
  - Verify waiting-for-partner and invite-pending states are spoken
- Results:
  - Verify completion summary and player scores are understandable without visual layout
  - Verify Play Again / Back to Dashboard are discoverable
- History:
  - Verify sort and winner filters announce selected state
  - Verify each history card speaks date, result, partner, and scores clearly
- Profile + Settings:
  - Verify edit/save/cancel/settings/logout controls announce correctly
  - Verify unlink confirmation order is understandable
  - Verify recover previous partner action is clear during cooldown

### Evidence to capture

Capture, at minimum:

- device + OS version
- screen reader used (`TalkBack` or `VoiceOver`)
- whether the run covered `light`, `dark`, or `system`
- pass/fail for each major flow
- exact spoken-announcement defects or duplicate-read defects encountered

### Deferred sign-off note

Manual screen-reader validation for Phase F is currently deferred unless explicitly run. If not executed yet, record:

- `Manual TalkBack validation: Pending`
- `Manual VoiceOver spot check: Pending`
- `Known accessibility limitations after automated pass: <list or none found yet>`

Companion working artifact for real test execution:

- `PHASE_D_MANUAL_VALIDATION_RUN.md`

## 19) Phase G Verification (Haptic Feedback System)

Use this section after Phase G implementation to run the deferred manual haptics validation pass on real devices and supported simulator/emulator paths.

### Objective

Verify that the active Expo app delivers subtle-but-noticeable, semantically consistent haptic feedback in the approved high-value moments, while still degrading safely when haptics are disabled or unavailable.

### Preconditions

- Latest `OnlyYoursExpo/` Phase G build installed
- Haptics-enabled physical device available for primary validation
- Optional simulator/emulator available for unsupported/no-op confirmation
- One linked-couple account available so invitation, gameplay, settings, and partner-link flows can be reached
- One active or resumable game session available so gameplay haptics can be exercised
- Local Settings access available to toggle haptics on and off during the run

### Haptics acceptance checklist

- [ ] Haptics are enabled by default on a fresh install unless the user has already disabled them locally
- [ ] Settings exposes an in-app haptics preference with clear wording
- [ ] Toggling haptics off stops future feedback without breaking surrounding UX
- [ ] Toggling haptics back on restores feedback immediately
- [ ] Success/confirmation moments feel lighter than milestone moments like round transition or game completion
- [ ] Error/invalid-action feedback is distinguishable from success feedback
- [ ] No major interaction moment produces repeated or spammy duplicate haptics
- [ ] Unsupported-device or simulator paths do not crash, hang, or surface confusing errors

### Required walkthrough matrix

- Enabled mode on physical device:
  - Verify invitation sent feedback
  - Verify invitation accepted feedback
  - Verify answer submitted feedback
  - Verify guess submitted feedback
  - Verify correct guess feedback
  - Verify incorrect guess feedback
  - Verify round transition/unlock feedback
  - Verify game completion feedback
  - Verify partner code generate/copy/share feedback
  - Verify settings save, profile save, unlink, and recover feedback
  - Verify invalid-action or realtime-unavailable feedback where reachable
- Disabled mode on physical device:
  - Turn haptics off in `Settings`
  - Repeat a representative subset:
    - answer submit
    - guess submit
    - settings save
    - partner code copy/share
    - unlink/recover if safe to exercise
  - Confirm no haptic feedback fires while visible/app-state behavior still works normally
- Unsupported/no-op path:
  - Run the app on simulator/emulator or another no-haptics environment if available
  - Exercise representative flows and confirm no crash or runtime degradation occurs
- Repeated gameplay-loop sanity:
  - Play through multiple submissions and at least one full round transition
  - Confirm haptics feel intentional rather than noisy during repeated use

### Evidence to capture

Capture, at minimum:

- device model + OS version
- whether the run used physical device, simulator, or emulator
- whether haptics were enabled or disabled
- pass/fail by major flow:
  - gameplay
  - invitation/linking
  - partner-code actions
  - settings/profile actions
- any moments that felt too weak, too strong, duplicated, delayed, or missing

### Deferred sign-off note

Manual Phase G haptics validation is currently deferred unless explicitly run. If not executed yet, record:

- `Manual physical-device haptics validation: Pending`
- `Manual disabled-mode validation: Pending`
- `Manual unsupported-device/simulator check: Pending`
- `Known tuning issues after automated pass: none confirmed yet`

### Phase D Preconditions

- Latest app/backend build includes:
  - relationship status/unlink/recover APIs,
  - profile edit + notification preference APIs,
  - gameplay push payload routing (`type`, `sessionId`, `targetRoute`) and deep-link listener handling.
- Prepare two test accounts:
  - `Account A` and `Account B` linked as an active couple.
- Ensure both accounts have push token registration on test devices (or test harness capable of firing equivalent notification response payloads).
- Keep one scenario with an active game session and one scenario with no active game session.

### D-1601 Couple status baseline and settings state surface

- Login as `Account A` and open `Settings`.
- Verify relationship controls section reflects current relationship state.
- Expected:
  - status payload renders correctly (`LINKED`, `COOLDOWN_ACTIVE`, or `READY_TO_LINK`),
  - partner identity and helper messaging are visible when linked/cooldown states apply,
  - no stale status from prior sessions after app relaunch.

### D-1602 Unlink preview and two-step confirmation safety

- From linked state (`Account A` + `Account B`, no active game), tap unlink action.
- Verify first call returns preview/confirmation token and UI shows explicit confirmation step.
- Confirm unlink in second step.
- Expected:
  - unlink does not execute on first tap (preview-only step),
  - unlink executes only after confirmation token path,
  - status transitions to cooldown state with clear time-bound messaging.

### D-1603 Active-session guard blocks unsafe unlink

- Start a game so couple has an active session.
- Attempt unlink from settings.
- Expected:
  - unlink is blocked,
  - user sees actionable error guidance (finish/expire active game first),
  - couple state remains unchanged (no partial unlink side effects).

### D-1604 Recovery during cooldown

- After successful unlink (cooldown active), attempt `Recover Previous Partner`.
- Expected:
  - recovery path is available only when server indicates recoverability,
  - successful recovery restores linked state with original partner,
  - cooldown/recovery messaging updates immediately after response.

### D-1605 Cooldown behavior and relink restrictions

- During cooldown, attempt relink flows that should be blocked by policy.
- Expected:
  - policy-constrained actions are rejected with explicit server-backed reason,
  - UI remains stable and informative (no broken state or silent failure),
  - once cooldown expires (or via controlled test override), relink path behaves as expected.

### D-1606 Profile editing (`username`, `bio`) persistence and validation

- Open `Profile`, switch to edit mode, and update username + bio with valid values.
- Save and relaunch app.
- Also test invalid values:
  - username too short/too long/invalid characters,
  - bio over max length.
- Expected:
  - valid updates persist after refresh/relogin,
  - invalid inputs show user-safe validation feedback,
  - server validation errors map to clear in-app messaging without UI corruption.

### D-1607 Notification preferences persistence (`timezone`, reminder, quiet hours)

- In `Settings`, change:
  - `timezone`,
  - `reminderTimeLocal`,
  - `quietHoursStart`,
  - `quietHoursEnd`.
- Save and relaunch app.
- Expected:
  - values persist and rehydrate correctly from backend,
  - malformed `HH:mm` input is rejected with clear validation feedback,
  - empty/invalid timezone does not silently break settings surface.

### D-1608 Deep-link: continue game route correctness

- Trigger gameplay notification mapped to continue-game behavior for `Account A`.
- Tap notification from:
  - foreground,
  - background,
  - cold start.
- Expected:
  - app routes to `Game` with correct `sessionId`,
  - game screen resumes/loads expected session,
  - no duplicate navigation stack pushes for one user action.

### D-1609 Deep-link: partner-completed-answering route correctness

- Trigger partner-progress notification while session remains active.
- Tap notification in foreground/background/cold-start states.
- Expected:
  - app routes to `Game`,
  - session context is correct and user can continue without manual re-navigation,
  - stale/invalid session targets fail gracefully with non-crashing fallback messaging.

### D-1610 Deep-link: results-ready route correctness

- Complete a game and trigger results-ready notification.
- Tap notification in foreground/background/cold-start states.
- Expected:
  - app routes to `Results`,
  - results load via route payload or backend fetch fallback when needed,
  - no crash on initial null/late-loading score state.

### D-1611 Duplicate push suppression sanity check

- Trigger equivalent event more than once in quick succession for same user/session/event type.
- Expected:
  - user receives at most one push for equivalent event key,
  - distinct scoped events (for example question-specific progression) still deliver as appropriate.

### Evidence capture for Phase D sign-off

- Screenshots/video of:
  - unlink preview + confirmation and cooldown status,
  - active-session unlink block messaging,
  - recovery success state transition,
  - profile + settings save/persist flows,
  - all three deep-link notification routes (`Game`, `Game`, `Results`) from cold start.
- Optional backend/API snapshots:
  - `GET /api/couple/status`
  - `POST /api/couple/unlink` (preview + confirmation)
  - `POST /api/couple/recover`
  - `PUT /api/user/profile`
  - `PUT /api/user/preferences`
  - `GET /api/game/{sessionId}/results`

### Phase D strict execution order (recommended)

Use this order to isolate state mutation failures first, then routing behavior:

1. Run `D-1601` first to confirm baseline relationship state and settings hydration.
2. Run `D-1602`, `D-1603`, `D-1604`, and `D-1605` next (all unlink/cooldown/recovery transitions).
3. Run `D-1606` and `D-1607` for profile/settings persistence + validation.
4. Run `D-1608`, `D-1609`, and `D-1610` for deep-link routing in foreground/background/cold start.
5. Run `D-1611` last to verify dedupe under repeated trigger conditions.
6. Capture evidence during each case immediately; do not postpone screenshots/log snapshots.

### Phase D evidence template (copy for each run)

Use this template as the official pass/fail artifact for sign-off.

```markdown
## Phase D Manual Validation Run

- Date:
- Tester:
- Build/Commit:
- Environment:
- Device A (Account A):
- Device B (Account B):

### Case Results

| Case ID | Status (Pass/Fail/Blocked) | Evidence (Screenshot/Video file) | Observed Behavior | Expected Behavior | Defect ID (if any) |
| --- | --- | --- | --- | --- | --- |
| D-1601 |  |  |  |  |  |
| D-1602 |  |  |  |  |  |
| D-1603 |  |  |  |  |  |
| D-1604 |  |  |  |  |  |
| D-1605 |  |  |  |  |  |
| D-1606 |  |  |  |  |  |
| D-1607 |  |  |  |  |  |
| D-1608 |  |  |  |  |  |
| D-1609 |  |  |  |  |  |
| D-1610 |  |  |  |  |  |
| D-1611 |  |  |  |  |  |

### Defect Summary

- Total failures:
- Total blocked:
- Critical defects:
- High defects:

### Retest Summary

- Retest required: Yes/No
- Retest build/commit:
- Retest result:

### Final Recommendation

- Ready for Phase D sign-off: Yes/No
- Notes:
```
