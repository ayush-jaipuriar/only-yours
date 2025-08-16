# Only Yours - End-to-End Setup and Testing Guide (Sprints 0 → 3)

This guide walks you through setting up the environment and thoroughly testing the app from the foundation (Sprint 0) through Authentication (Sprint 1), Profile/Couple Linking (Sprint 2), and Categories/WebSocket foundation (Sprint 3). Tests are ordered to build on one another.

---

## 0) Quickstart Test Flow (Sprints 0–3)

1. Backend: configure `application.properties`, create DB, start backend.
2. Frontend: set `API_URL`, install deps, run app on emulator/device.
3. Sprint 1 – Sign-In: Sign in with Google, obtain JWT in app storage.
4. Sprint 1 – Protected API: Call `/api/user/me` using the JWT.
5. Sprint 2 – Couple Linking: Generate code (User A), redeem code (User B), verify `/api/couple`.
6. Sprint 3 – Categories: Verify Flyway seed, call `/api/content/categories`, view `CategorySelection` screen.
7. Sprint 3 – WebSocket: Confirm STOMP connect with JWT and auto-reconnect behavior.

---

## 1) Prerequisites and Tools (Sprint 0)

- Java 17 (JDK)
- Node.js 16+ and npm
- PostgreSQL 13+
- Android Studio (Android emulator) and/or Xcode (iOS Simulator)
- Google OAuth Client IDs:
  - Android Client ID (for device sign-in)
  - Web Client ID (used by backend verifier and RN config)

Why: Matching toolchain versions avoids build issues. OAuth IDs enable secure Google Sign-In and identity verification.

---

## 2) Backend Setup (Sprint 0)

- Configure database in `backend/src/main/resources/application.properties`:
  - `spring.datasource.url=jdbc:postgresql://localhost:5432/onlyyours`
  - `spring.datasource.username=postgres`
  - `spring.datasource.password=root`
  - `jwt.secret=your_long_random_secret` (use a strong string)
  - `google.client.id=<YOUR_WEB_CLIENT_ID>`

- Create database (choose one):
  - Using psql:
    ```bash
    createdb onlyyours
    # or
    psql -U postgres -c 'CREATE DATABASE onlyyours;'
    ```
  - Using Docker:
    ```bash
    docker run --name onlyyours-pg -e POSTGRES_PASSWORD=root -e POSTGRES_USER=postgres -e POSTGRES_DB=onlyyours -p 5432:5432 -d postgres:15
    ```

- Build and run backend:
  ```bash
  cd backend
  ./gradlew clean build -x test
  ./gradlew bootRun
  ```
  - Server: `http://localhost:8080`
  - On first run, Flyway creates tables as per `V1__Initial_Schema.sql`.

Sanity checks:
- Without a token, a protected endpoint should be 401:
  ```bash
  curl -i http://localhost:8080/api/user/me
  ```

---

## 3) Frontend Setup (Sprint 0)

- Install dependencies:
  ```bash
  cd OnlyYoursApp
  npm install
  ```

- Configure Google Sign-In in `OnlyYoursApp/App.js`:
  - Ensure `GoogleSignin.configure({ webClientId: '<YOUR_WEB_CLIENT_ID>' })` is set.

- Configure API base URL in `OnlyYoursApp/src/services/api.js`:
  - Set `API_URL` to your backend URL.
  - Connectivity tips:
    - Android Emulator → host: `http://10.0.2.2:8080/api`
    - iOS Simulator → host: `http://localhost:8080/api`
    - Physical device → host: `http://<YOUR_COMPUTER_LAN_IP>:8080/api` (same Wi-Fi and firewall open)

- iOS pods (if using iOS):
  ```bash
  cd ios && pod install && cd ..
  ```

- Run the app:
  ```bash
  npm start
  # in another terminal
  npm run android   # or
  npm run ios
  ```

---

## 4) Sprint 1 Testing: Authentication & Onboarding

Goal: Verify Google Sign-In end-to-end and JWT-based protected access.

Steps:
1. Launch the app (emulator or device).
2. On `SignInScreen`, tap "Sign in with Google" and complete Google account selection.
3. Expected results:
   - App posts the Google `idToken` to `POST /api/auth/google/signin`.
   - Backend verifies token against Google using `google.client.id`.
   - Backend issues application JWT and app stores it in `AsyncStorage` as `userToken`.
   - App navigates to the authenticated stack (Dashboard).

Backend verification (optional):
- Use the stored token to call a protected endpoint:
  ```bash
  TOKEN="<paste token>"
  curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/user/me
  ```
  - Expect 200 with your user profile (name, email, id).

Failure modes to check:
- Wrong `google.client.id` → backend returns 4xx (invalid token).
- No token on protected endpoint → 401.

---

## 5) Sprint 2 Testing: Profile & Couple Linking

### A) Profile Screen
- Navigate to `Profile`.
- Expect to see your `name` and `email` from `/api/user/me`.
- Tap `Logout` → app removes `userToken`, navigates back to `SignIn`.

### B) Dashboard Screen
- After login, Dashboard calls `GET /api/couple`.
  - If 404 → shows "Link with Partner" button.
  - If 200 → shows linked partner info.

### C) Partner Linking, Two-User Flow
Test with two sessions (two emulators or one emulator + one device):

User A (Generator):
1. Login as User A.
2. Go to `PartnerLink` → tap `Generate Code`.
3. Expect a 6-character code displayed.
4. Optionally tap `Share` to share the code.

User B (Redeemer):
1. Login as User B on another device/emulator.
2. Go to `PartnerLink` → enter code → tap `Connect`.
3. Expect success alert and navigation back to `Dashboard`.
4. Dashboard should now show "You are connected with <Partner's Name>".

Backend checks (optional):
- Verify couple via API using User B's token:
  ```bash
  TOKEN_B="<user_b_token>"
  curl -H "Authorization: Bearer $TOKEN_B" http://localhost:8080/api/couple
  ```
  - Expect JSON with both `user1` and `user2`.

Edge cases to validate:
- Self-redeem (User A tries to redeem own code) → 400/422-style error from backend, app shows error alert.
- Reuse code after successful link → code is cleared; subsequent redeem should fail.
- `GET /api/couple` when not linked → 404.

---

## 6) Troubleshooting & Tips

- Android emulator cannot reach `localhost` on your host; use `10.0.2.2`.
- If backend fails to start:
  - Check Postgres creds and DB existence.
  - Ensure `jwt.secret` is set and non-empty.
  - Ensure `google.client.id` matches your Web Client ID.
- If Google Sign-In fails on device:
  - Ensure Android Client ID is configured for your app package and SHA-1.
  - Verify `GoogleSignin.configure({ webClientId })` matches the backend verifier ID.
- To inspect database:
  ```bash
  psql -U postgres -d onlyyours -c "\\dt"
  psql -U postgres -d onlyyours -c "SELECT * FROM users;"
  psql -U postgres -d onlyyours -c "SELECT * FROM couples;"
  ```

---

## 7) Automated Tests

Backend:
```bash
cd backend
./gradlew test
```

Frontend (Jest):
```bash
cd OnlyYoursApp
npm test
```

---

## 8) What to Observe (Acceptance Criteria)

- After sign-in, `AsyncStorage` contains `userToken` and protected calls succeed.
- `GET /api/user/me` returns correct profile.
- Before linking, `GET /api/couple` returns 404; after linking, returns both users.
- Link code is single-use; cannot redeem twice or by the generator.
- Logout removes token and returns to `SignIn`.

This completes end-to-end validation for Sprints 0–2.


---

## 9) Sprint 3 Testing: Categories & WebSocket Foundation

Goal: Verify seeded game content is available via REST and that the real-time foundation authenticates and connects over STOMP/WebSocket with JWT.

Why: Category seeding and retrieval unblock pre-game flow. WebSocket auth/transport is critical for synchronous gameplay in later sprints.

### A) Backend Data Seeding (Flyway)
Prereq: Backend started with the same database as previous sprints.

1) Verify Flyway applied V2 migration
   ```bash
   psql -U postgres -d onlyyours -c "SELECT version, description, success FROM flyway_schema_history ORDER BY installed_rank;"
   ```
   - Expect a row with `version = '2'` and `description` similar to `Seed_Initial_Data` and `success = t`.

2) Inspect seeded categories
   ```bash
   psql -U postgres -d onlyyours -c "SELECT id, name, is_sensitive FROM question_categories ORDER BY id;"
   ```
   - Expect: Getting to Know You, Daily Habits, Memories, Intimacy (is_sensitive = true for Intimacy).

3) Inspect seeded questions
   ```bash
   psql -U postgres -d onlyyours -c "SELECT category_id, COUNT(*) AS num_questions FROM questions GROUP BY category_id ORDER BY category_id;"
   ```
   - Expect ≥ 2 questions per category (as seeded).

Notes:
- Flyway runs pending migrations once; it will not duplicate seed data across restarts.

### B) Categories REST Endpoint
Concept: Authenticated REST returns a safe DTO for categories.

1) Happy path with JWT
   ```bash
   TOKEN="<paste token>"
   curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/content/categories | jq
   ```
   - Expect an array of objects with fields: `id`, `name`, `description`, `sensitive`.

2) Without JWT (security enforcement)
   ```bash
   curl -i http://localhost:8080/api/content/categories
   ```
   - Expect `401 Unauthorized` due to Spring Security (only `/api/auth/**` is public).

3) Shape validation (minimal contract)
   ```bash
   curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/content/categories \
     | jq 'map(has("id") and has("name") and has("sensitive")) | all'
   ```
   - Expect `true`.

Tips:
- If you don’t have `jq`, omit it and visually inspect the JSON.
- For physical devices, replace `http://localhost:8080` with your LAN IP (e.g., `http://192.168.1.50:8080`).

### C) Frontend Category Selection Screen
Concept: Client fetches categories and requires an explicit confirmation for sensitive categories.

1) Platform base URL sanity
   - `OnlyYoursApp/src/services/api.js` → `API_URL` should match your backend host:
     - Android Emulator: `http://10.0.2.2:8080/api`
     - iOS Simulator: `http://localhost:8080/api`
     - Physical device: `http://<YOUR_COMPUTER_LAN_IP>:8080/api`

2) Navigate and observe
   - From Dashboard, tap “Choose Category” to open `CategorySelection`.
   - Expect a loading indicator, then a list of categories rendered as cards.

3) Sensitive category confirmation
   - Tap `Intimacy` → Expect a native `Alert` warning. Choosing `Proceed` returns to previous screen (placeholder behavior for now).
   - Tap a non-sensitive category → Immediate return to previous screen.

Failure modes:
- If the list is empty, verify the REST call succeeds in logs/DevTools and re-check `API_URL`.
- A `401` in the network logs indicates a missing/expired JWT; sign in again.

### D) WebSocket Connectivity & Auth (STOMP + SockJS)
Concept: The app connects to `/ws` via SockJS transport and authenticates using the same JWT as REST.

1) Automatic connect on login
   - Ensure you’re logged in (token in `AsyncStorage`).
   - On login, `AuthContext` triggers `WebSocketService.connect(baseUrl)`, which sets `Authorization: Bearer <token>` in STOMP connect headers.

2) Backend-side verification
   - Observe backend logs on connect. Optionally increase verbosity by adding to `backend/src/main/resources/application.properties`:
     ```
     logging.level.org.springframework.web.socket=DEBUG
     logging.level.org.springframework.messaging=DEBUG
     ```
   - Expect a successful STOMP CONNECT and authenticated session; invalid tokens should result in errors and disconnect during CONNECT.

3) Failure: missing/invalid token (Node script optional)
   - You can simulate a bad connect using a quick Node script:
     ```javascript
     // test-ws.js
     const { Client } = require('@stomp/stompjs');
     const SockJS = require('sockjs-client');
     const client = new Client({
       webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
       connectHeaders: { Authorization: 'Bearer invalid_token' },
       onStompError: f => console.log('STOMP ERROR', f.headers, f.body),
       onWebSocketClose: () => console.log('WS closed'),
     });
     client.activate();
     ```
     ```bash
     node test-ws.js
     ```
     - Expect an error and closed connection.

4) Reconnection behavior
   - The client retries every ~5s. With the app running, stop the backend, wait for a few retry attempts, then start backend; the client should reconnect automatically.

Platform host notes for WebSocket:
- Android Emulator: use `http://10.0.2.2:8080` as the base URL in `AuthContext`/`WebSocketService.connect()`.
- Physical devices: use your LAN IP and ensure both are on the same network and firewall allows inbound connections.

Acceptance criteria (Sprint 3):
- `GET /api/content/categories` returns seeded data only with valid JWT; 401 otherwise.
- `CategorySelection` lists categories and shows a confirmation `Alert` for sensitive categories.
- App establishes a STOMP session after login; invalid tokens are rejected on CONNECT; client auto-retries on temporary disconnects.

---

## 10) Common Errors & Fixes (FAQ)

### Setup & Environment Issues

**Q: "Backend won't start - Connection refused to database"**
- **Cause**: PostgreSQL not running or wrong credentials.
- **Fix**: 
  ```bash
  # Check if PostgreSQL is running
  pg_ctl status
  # Or using brew (macOS)
  brew services list | grep postgres
  # Start if needed
  brew services start postgresql
  # Verify DB exists
  psql -U postgres -l | grep onlyyours
  ```

**Q: "Backend starts but Flyway fails with 'relation does not exist'"**
- **Cause**: Database exists but is corrupted or partially migrated.
- **Fix**: Drop and recreate the database:
  ```bash
  psql -U postgres -c "DROP DATABASE IF EXISTS onlyyours;"
  psql -U postgres -c "CREATE DATABASE onlyyours;"
  # Restart backend to re-run migrations
  ```

**Q: "Frontend can't reach backend from Android emulator"**
- **Cause**: Using `localhost` instead of `10.0.2.2`.
- **Fix**: Update `OnlyYoursApp/src/services/api.js`:
  ```javascript
  const API_URL = 'http://10.0.2.2:8080/api'; // Android emulator
  ```

**Q: "Frontend can't reach backend from physical device"**
- **Cause**: Using localhost instead of LAN IP, or firewall blocking.
- **Fix**: 
  1. Find your computer's IP: `ifconfig | grep "inet " | grep -v 127.0.0.1`
  2. Update API_URL to use that IP: `http://192.168.1.50:8080/api`
  3. Ensure firewall allows port 8080 inbound
  4. Ensure both devices on same Wi-Fi network

### Authentication Issues

**Q: "Google Sign-In fails with 'DEVELOPER_ERROR'"**
- **Cause**: Mismatch between configured Client IDs and actual usage.
- **Fix**: 
  1. Verify `webClientId` in `App.js` matches the Web Client ID from Google Cloud Console
  2. Verify `google.client.id` in `application.properties` matches the same Web Client ID
  3. For Android: ensure Android Client ID is configured with correct package name and SHA-1

**Q: "Sign-In succeeds but backend returns 401 'Invalid ID token'"**
- **Cause**: Backend `google.client.id` doesn't match the Web Client ID used by the app.
- **Fix**: Double-check both values are identical:
  ```bash
  # In application.properties
  google.client.id=123456789-abcdef.apps.googleusercontent.com
  # In App.js
  webClientId: '123456789-abcdef.apps.googleusercontent.com'
  ```

**Q: "JWT expired errors after some time"**
- **Cause**: JWT has 10-hour expiry (see `JwtService.java`).
- **Fix**: Sign out and sign in again, or implement refresh token logic in future sprints.

### API & Network Issues

**Q: "API calls return 401 even after successful sign-in"**
- **Cause**: JWT not stored or not included in requests.
- **Fix**: 
  1. Check `AsyncStorage`: In React Native debugger, inspect `AsyncStorage.getItem('userToken')`
  2. Verify `api.js` interceptor adds `Authorization` header
  3. Check network logs to confirm header is present

**Q: "Categories endpoint returns empty array"**
- **Cause**: Flyway V2 migration didn't run or failed.
- **Fix**: 
  ```bash
  # Check migration status
  psql -U postgres -d onlyyours -c "SELECT * FROM flyway_schema_history ORDER BY installed_rank;"
  # If V2 is missing, restart backend to trigger migration
  # If V2 failed, check backend logs for SQL errors
  ```

**Q: "Partner linking fails with 'Code not found'"**
- **Cause**: Code was already used, expired, or typo in entry.
- **Fix**: 
  1. Generate a fresh code
  2. Check database: `SELECT * FROM couples WHERE link_code IS NOT NULL;`
  3. Ensure exact code match (case-sensitive)

### WebSocket Issues

**Q: "WebSocket connection fails immediately"**
- **Cause**: Invalid JWT or wrong endpoint URL.
- **Fix**: 
  1. Verify you're logged in and have valid token in `AsyncStorage`
  2. Check WebSocket URL construction in `WebSocketService.js`
  3. Enable debug logging in `application.properties`:
     ```
     logging.level.org.springframework.web.socket=DEBUG
     ```

**Q: "WebSocket connects but disconnects immediately"**
- **Cause**: JWT validation failure during STOMP CONNECT.
- **Fix**: 
  1. Check backend logs for authentication errors
  2. Verify JWT hasn't expired
  3. Test JWT validity: `curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/user/me`

**Q: "App doesn't auto-reconnect after backend restart"**
- **Cause**: Client retry logic not working or app backgrounded.
- **Fix**: 
  1. Check `WebSocketService.js` has `reconnectDelay: 5000`
  2. Keep app in foreground during testing
  3. Manually trigger reconnect by logging out and back in

### Development Workflow Issues

**Q: "Hot reload doesn't work for backend changes"**
- **Cause**: Spring Boot DevTools limitation or not included.
- **Fix**: 
  1. Restart backend manually: `./gradlew bootRun`
  2. For faster iteration, use `./gradlew bootRun --continuous`

**Q: "React Native metro bundler errors"**
- **Cause**: Cache issues or dependency conflicts.
- **Fix**: 
  ```bash
  cd OnlyYoursApp
  npx react-native start --reset-cache
  # In another terminal
  npx react-native run-android --reset-cache
  ```

**Q: "Database queries for testing return empty results"**
- **Cause**: Wrong database, user permissions, or table names.
- **Fix**: 
  ```bash
  # Verify you're in the right database
  psql -U postgres -d onlyyours -c "\dt"
  # Check table contents
  psql -U postgres -d onlyyours -c "SELECT COUNT(*) FROM users;"
  psql -U postgres -d onlyyours -c "SELECT COUNT(*) FROM question_categories;"
  ```

### Platform-Specific Issues

**Q: "iOS build fails with pod errors"**
- **Fix**: 
  ```bash
  cd OnlyYoursApp/ios
  rm -rf Pods/ Podfile.lock
  pod install
  cd ..
  npx react-native run-ios
  ```

**Q: "Android build fails with gradle errors"**
- **Fix**: 
  ```bash
  cd OnlyYoursApp/android
  ./gradlew clean
  cd ..
  npx react-native run-android
  ```

### General Debugging Tips

1. **Check logs first**: Backend console, React Native metro bundler, device logs
2. **Network inspection**: Use React Native Flipper or Chrome DevTools for network requests
3. **Database state**: Use `psql` commands to inspect data between test steps
4. **Incremental testing**: Test each API endpoint with `curl` before testing in the app
5. **Token debugging**: Copy JWT from `AsyncStorage` and test directly with curl commands

**Emergency Reset** (when all else fails):
```bash
# Backend: clean build and restart
cd backend && ./gradlew clean build -x test && ./gradlew bootRun

# Frontend: clean and reinstall
cd OnlyYoursApp && rm -rf node_modules && npm install && npx react-native start --reset-cache

# Database: clean slate
psql -U postgres -c "DROP DATABASE IF EXISTS onlyyours; CREATE DATABASE onlyyours;"
```

