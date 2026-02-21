# Sprint 3 Implementation Report: Game Setup & Real-time Foundation

This report documents the implementation details for Sprint 3, covering backend content seeding and WebSocket setup, and frontend WebSocket client and category selection UI.

---

## Backend Implementation

### Data Seeding
- Added `backend/src/main/resources/db/migration/V2__Seed_Initial_Data.sql` to seed:
  - Categories: Getting to Know You, Daily Habits, Memories, Intimacy (sensitive)
  - Two sample questions per category

#### Post-migration Fix (Startup Failure)
- Root cause: Hibernate previously auto-created `questions` table columns based on camelCase field names (`optionA`, `optionB`, etc.), resulting in snake-less columns (`optiona`, `optionb`, ...). Our Flyway DDL (V1) correctly defines snake_case columns (`option_a`, `option_b`, ...). When V2 attempted to insert rows using snake_case columns, PostgreSQL enforced NOT NULL constraints on the legacy `optiona` columns, causing `ERROR: null value in column "optiona"`.
- Fixes applied:
  - Aligned JPA entity to Flyway schema by explicitly mapping column names in `Question.java` using `@Column(name = "option_a"|"option_b"|...)`.
  - Switched `spring.jpa.hibernate.ddl-auto` to `validate` to prevent Hibernate from creating/modifying tables; Flyway remains the single source of truth.
  - Made V2 seeding tolerant of legacy columns by conditionally dropping NOT NULL constraints on `optiona`…`optiond` if they exist, so inserts can succeed even on environments that previously booted with Hibernate DDL.
  - Next migration can safely DROP the legacy columns after verifying no data resides in them.

### DTOs and Controllers
- Added `backend/src/main/java/com/onlyyours/dto/CategoryDto.java` with fields: `id`, `name`, `description`, `sensitive`.
- Added `backend/src/main/java/com/onlyyours/controller/ContentController.java`:
  - `GET /api/content/categories`: returns list of `CategoryDto`.

### WebSocket Configuration and Security
- Added `backend/src/main/java/com/onlyyours/config/WebSocketConfig.java`:
  - STOMP endpoint at `/ws` with SockJS fallback, allowed origins `*` for development.
  - Simple in-memory broker with `/topic` and `/user`; app destination prefix `/app`.
- Added `backend/src/main/java/com/onlyyours/config/WebSocketSecurityConfig.java`:
  - Inbound `ChannelInterceptor` secures `CONNECT`: extracts `Authorization` header, validates via `JwtService`, and sets authenticated `Principal` on the STOMP session.

---

## Frontend Implementation (React Native)

### Dependencies
- Installed: `@stomp/stompjs`, `sockjs-client`.

### WebSocket Service
- Added `OnlyYoursApp/src/services/WebSocketService.js`:
  - `connect(baseUrl)`: connects to `${baseUrl}/ws` with `Authorization: Bearer <token>`.
  - `disconnect()`, `subscribe(destination, cb)`, `sendMessage(destination, body)`.

### Category Selection UI
- Added `OnlyYoursApp/src/screens/CategorySelectionScreen.js`:
  - Loads `/api/content/categories` and lists as cards, marks sensitive categories with a warning and confirmation dialog.
- Updated `OnlyYoursApp/src/navigation/AppNavigator.js` to include `CategorySelection` route.

### Auth Integration
- Updated `OnlyYoursApp/src/state/AuthContext.js`:
  - On `login()` and on silent auth at app start, connects WebSocket.
  - On `logout()`, disconnects WebSocket.

---

## Notes & Rationale
- WebSocket security mirrors REST JWT validation to keep a single auth source.
- SockJS ensures compatibility with devices/networks where native WebSockets might be blocked.
- Seeding through Flyway keeps reproducible environments across machines.

### Flyway Validation Follow-up (2025-10-09)
- Observed startup failure: `FlywayValidateException` complaining about checksum mismatch for `V2__Seed_Initial_Data.sql` when launching the backend.
- Root cause: local database already ran an earlier version of V2. Subsequent edits to the script changed its checksum, so Flyway refuses to proceed to protect schema integrity.
- Impacted components: Flyway initialization halts, preventing the `entityManagerFactory` bean from loading, which in turn cascades to `JwtAuthFilter` and other Spring beans.
- Immediate remediation options:
  - Revert `V2__Seed_Initial_Data.sql` to the exact bytes that generated the recorded checksum, or
  - If the schema/data differences are intentional, run `flyway repair` (or drop/recreate the local database) so the stored checksum aligns with the new script.
- Recommendation: Prefer creating a new migration (`V3__...`) for further data tweaks instead of mutating previously applied scripts, keeping environments deterministic.

#### Local Database Reset via pgAdmin
- Context: During development it is often acceptable to wipe the local PostgreSQL instance when Flyway validation fails and we do not need to preserve seeded data.
- Steps in pgAdmin:
  1. Launch pgAdmin and expand `Servers ▸ PostgreSQL ▸ Databases`.
  2. Right-click the `onlyyours` database and choose `Disconnect` to ensure no active sessions block the drop.
  3. Right-click `onlyyours` again, select `Drop/Delete`, check `Cascade` if dependent objects exist, and confirm.
  4. Create a fresh database with the same name (`Create ▸ Database…`), owner `postgres`, encoding `UTF8`.
  5. Restart the Spring Boot app; Flyway will recreate schema and seed data from `V1`/`V2`.
- Rationale: Dropping the DB clears the Flyway history table so the current migration files become authoritative, restoring app startup.

#### Entity Mapping Fix (2025-10-09)
- After recreating the database the application failed with `Schema-validation: missing column [round1answer] in table [game_answers]`.
- Diagnosis: The `GameAnswer` entity fields `round1Answer` and `round2Guess` were not annotated, so Hibernate expected camelCase column names (`round1answer`, `round2guess`) instead of the snake_case defined in `V1__Initial_Schema.sql`.
- Resolution: Added `@Column(name = "round1_answer")` and `@Column(name = "round2_guess")` to `backend/src/main/java/com/onlyyours/model/GameAnswer.java` so the ORM mapping matches the Flyway schema, restoring successful EntityManager initialization.
- Follow-up: The same validation surfaced for `GameSession` (`missing column [player1score]`). Annotated `player1Score` and `player2Score` with `@Column(name = "player1_score")` / `@Column(name = "player2_score")` in `backend/src/main/java/com/onlyyours/model/GameSession.java` to keep all DTO fields snake_case aligned.

## Next Steps
- Implement invitation and game message payloads and controllers (Sprint 4).
- Wire Dashboard to navigate to `CategorySelection` and initiate invitations.
- Add connection status surface in UI and reconnection indicators.
### React Native Metro Startup Fix (2025-10-09)
- **Symptom observed:** Running `npm start` or `npm run android` inside `OnlyYoursApp` failed with `Cannot find module ... node_modules/debug/src/index.js` emitted by Metro.
- **Root cause:** The `debug` package inside `node_modules` had been installed with extension-less files (`src/index`, `src/browser`, `src/node`, `src/common`) instead of the expected `.js` files. Node uses the `main` field from `debug/package.json` (`./src/index.js`) and, because `src/index.js` did not exist, module resolution failed. The most plausible cause is a previous interrupted/corrupted npm install.
- **Resolution steps executed:**
  - Removed the stale `node_modules` directory to discard the corrupted installation.
  - Re-ran `npm install` from `OnlyYoursApp`, restoring the `debug` module with the proper `*.js` files and satisfying Metro’s dependency graph.
- **Verification:** `npm start` now launches Metro (v0.76.5) without module errors. After verifying the fix, Metro was stopped using `pkill -f "react-native start"` so the environment is clean for subsequent manual runs.

### Android Build Compatibility Reset (2025-10-09)
- **Scenario:** After the Metro fix, Android builds failed during `:app:checkDebugAarMetadata` because newer AndroidX dependencies (core-ktx 1.15, activity 1.8, etc.) require compile/target SDK ≥34 and AGP ≥8, while our React Native baseline (0.72) ships with AGP 7.4.x.
- **Goal:** Restore a stable Android toolchain that aligns with the React Native 0.72 template while we plan a future upgrade path.
- **Changes applied:**
  - Pinned `android/build.gradle` to the RN 0.72 defaults: `compileSdkVersion`/`targetSdkVersion` 33, `buildToolsVersion` 33.0.0, AGP `7.4.2`.
  - Reset the Gradle wrapper to `gradle-7.6.1` (compatible with AGP 7.4.x) via `./android/gradlew wrapper` using JDK 17.
  - Restored `android/gradle.properties` JVM args to the template defaults and reintroduced `org.gradle.java.home` pointing at Azul JDK 17.0.15.
- **Follow-up:** The build now expects the Android SDK 33 platform and JDK 17. Upgrading to SDK 34+ or AGP 8.x will require moving the app to a newer React Native release.
