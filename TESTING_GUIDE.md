# Only Yours - End-to-End Setup and Testing Guide (Sprints 0 → 2)

This guide walks you through setting up the environment and thoroughly testing the app from the foundation (Sprint 0) through Authentication (Sprint 1) and Profile/Couple Linking (Sprint 2).

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


