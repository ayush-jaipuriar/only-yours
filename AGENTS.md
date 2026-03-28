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
- Backend dev flow: `cd backend && ./gradlew bootRun`; backend tests: `cd backend && ./gradlew test`; CI also runs `cd backend && ./gradlew build --no-daemon` on Java 17.
- Expo app flow: `cd OnlyYoursExpo && npm run android`, `npm run ios`, `npm run web`, and `npm test`; CI installs with `npm ci --legacy-peer-deps`.
- Local Android dev-client build: `cd OnlyYoursExpo && npm run android:local-build` uses `scripts/local-android-build.sh`, which expects Node 24+, Java 17, and a configured Android SDK.
- When using the Expo app on a physical device, keep `OnlyYoursExpo/.env.local` aligned with `OnlyYoursExpo/.env` because `.env.local` takes precedence.
- If Android push notifications are needed, `google-services.json` must exist at the `OnlyYoursExpo` project root so the local build script can copy it into `android/app/`.
