# only-yours AGENTS.md

## Sprint Planning Workflow Rule

- Before writing any new phase plan, sprint plan, or implementation-planning `.md` file, ask the user clarifying questions first.
- Do not proceed directly into plan writing when scope, sequencing, priorities, tradeoffs, or acceptance expectations could affect the plan structure.
- Wait for the user's answers before drafting the planning document.
- After clarifications are resolved, create the detailed planning `.md` file with implementation checklists as usual.

## Scope Note

- These instructions apply at the repository level for `only-yours`.
- If a future request involves planning work, clarification must happen before plan creation.

## Repository Workflows

- Treat `OnlyYoursExpo` as the active mobile app; use `OnlyYoursApp` only when a request explicitly targets the legacy React Native CLI baseline.
- For current Expo validation, prefer `README.md` and `MANUAL_TESTING_GUIDE_SPRINT6.md`; treat `TESTING_GUIDE.md` as historical reference unless a request explicitly needs the legacy flow.
- Backend dev flow: `cd backend && ./gradlew bootRun`; for a clean rebuild before starting, `cd backend && ./gradlew clean build -x test && ./gradlew bootRun`; for a release-style backend artifact build, `cd backend && ./gradlew bootJar --no-daemon -x test`; backend tests: `cd backend && ./gradlew test`; CI also runs `cd backend && ./gradlew build --no-daemon` on Java 17.
- For faster backend iteration, `cd backend && ./gradlew bootRun --continuous` is available from the testing guide.
- Before bringing phones online for manual testing, confirm the backend is healthy with `curl -s http://localhost:8080/actuator/health` and expect `{"status":"UP"}`.
- For local PostgreSQL, the manual testing guide uses Docker (`docker run --name onlyyours-pg ... postgres:15`), and `docker start onlyyours-pg` resumes the stopped container.
- Backend email/reset flow reads `RESEND_API_KEY` and `RESEND_FROM_EMAIL` from the root `.env` or `backend/.env` via Spring config import; after changing those values, restart `./gradlew bootRun`. A quick auth sanity check is `curl -i http://localhost:8080/api/user/me`, which should return 401/403 without a token.
- Expo app flow: use Node 24 in `OnlyYoursExpo/` (`source "$HOME/.nvm/nvm.sh" && nvm use 24`); `npm ci --legacy-peer-deps` is the clean install/CI-parity path, while `npm install` is the local refresh fallback. Commands: `npm run start`, `npm run android`, `npm run ios`, `npm run web`, and `npm test`; for deterministic Expo regression runs use `npm test -- --runInBand`. Local Expo dependency conflicts can usually be retried with `npm install --legacy-peer-deps` because `OnlyYoursExpo/.npmrc` sets `legacy-peer-deps=true`.
- Expo Go is fine for quick JS-only smoke checks, but use the local dev-client path for push-notification work and any native-runtime validation.
- For clean Expo regression runs, prefer `cd OnlyYoursExpo && npm ci --legacy-peer-deps && npm test -- --runInBand`.
- Local Android dev-client build: in a Node 24 shell (`source "$HOME/.nvm/nvm.sh" && nvm use 24`), `cd OnlyYoursExpo && npm run android:local-build` uses `scripts/local-android-build.sh`, which expects Node 24+, Java 17, and a configured Android SDK. Set `EXPO_FORCE_PREBUILD=1` to resync native config after plugin or `google-services.json` changes.
- If the local Expo Android build path is blocked, the manual testing guide falls back to `eas build --platform android --profile development`.
- For physical-device Expo dev-client testing, install the generated APK with `adb install -r OnlyYoursExpo/android/app/build/outputs/apk/debug/app-debug.apk` after `npm run android:local-build`, then refresh `OnlyYoursExpo/.env` and `OnlyYoursExpo/.env.local` with the current `LAN_IP` before starting Metro with `REACT_NATIVE_PACKAGER_HOSTNAME="$LAN_IP" npx expo start --dev-client -c`; when phones are on Wi-Fi, `curl -s "http://$LAN_IP:8080/actuator/health"` is a quick backend reachability check, and if LAN discovery fails, `npx expo start --tunnel` is the fallback.
- If the laptop and phones cannot share a LAN at all, tunnel the backend for local testing only (for example with Cloudflare Tunnel or ngrok) and point `EXPO_PUBLIC_API_URL` at the HTTPS tunnel URL; keep `npx expo start --tunnel` as the Metro fallback, not the backend fallback.
- For cable-free Android installs on Android 11+, use wireless debugging from `MANUAL_TESTING_GUIDE_SPRINT6.md`: `adb pair <PHONE_IP>:<PAIRING_PORT>`, `adb connect <PHONE_IP>:<DEBUG_PORT>`, and `adb -s <PHONE_IP>:<DEBUG_PORT> install -r OnlyYoursExpo/android/app/build/outputs/apk/debug/app-debug.apk`; run `adb devices` to confirm the pairing/connect step before installing. For older USB-first setups, `adb -s <USB_SERIAL> tcpip 5555` is the fallback before `adb connect <PHONE_IP>:5555`, and `adb disconnect` cleans up Wi-Fi adb sessions when finished.
- For USB-attached physical devices, `adb devices` is the first verification step, and `adb -s <SERIAL> reverse tcp:8080 tcp:8080` is the fallback when LAN routing is flaky; run it for each connected phone before opening the dev client, and use `adb logcat | grep -i onlyyours` as the first-pass device log filter when debugging app crashes or reconnect issues.
- When using the Expo app on a physical device, keep `OnlyYoursExpo/.env.local` aligned with `OnlyYoursExpo/.env` because `.env.local` takes precedence, and the app reads the backend host from `EXPO_PUBLIC_API_URL` (default `http://localhost:8080`).
- If Android push notifications are needed, `google-services.json` must exist at the `OnlyYoursExpo` project root so the local build script can copy it into `android/app/`.
- Keep package managers aligned with each workspace: `OnlyYoursExpo/` is npm-managed, while `OnlyYoursApp/` uses Yarn 4 (`yarn install`, `yarn start`, `yarn android`, `yarn ios`, `yarn lint`, `yarn test`). Avoid mixing install commands across those directories to reduce lockfile drift.
- Legacy app flow: `cd OnlyYoursApp && yarn install` before first run, then `yarn start`, `yarn android`, `yarn ios`, `yarn lint`, and `yarn test`; deterministic legacy runs usually use `YARN_IGNORE_ENGINES=1 yarn test --watchAll=false`, though some older docs still mention `yarn test --runInBand`.
- For legacy Android OAuth setup, `cd OnlyYoursApp/android && ./gradlew signingReport` captures the debug SHA-1 used in the testing guide.
- If Yarn engine checks get in the way for legacy app test runs, prefix `yarn test --watchAll=false` with `YARN_IGNORE_ENGINES=1`.
