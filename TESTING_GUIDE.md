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

Goal: Verify content seeding and WebSocket connectivity baseline.

### A) Backend Data Seeding
- After starting the backend, confirm categories and questions are present:
  ```bash
  psql -U postgres -d onlyyours -c "SELECT id, name, is_sensitive FROM question_categories;"
  psql -U postgres -d onlyyours -c "SELECT COUNT(*) FROM questions;"
  ```

### B) Categories Endpoint
- With a valid JWT, call the categories endpoint:
  ```bash
  TOKEN="<paste token>"
  curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/content/categories | jq
  ```
- Expect a JSON array with category objects including `id`, `name`, `description`, `sensitive`.

### C) Frontend Category Screen
- In the app, navigate to `CategorySelection` (temporarily via deep link or by adding a nav button).
- Expect a list of categories. Tapping a `sensitive` one shows a confirmation alert.

### D) WebSocket Connectivity
- Ensure you are logged in (token in `AsyncStorage`). On login, the app will attempt to connect to `/ws` with the JWT.
- Inspect backend logs for WebSocket `CONNECT` and successful authentication.
- Network debugging: you should see SockJS/XHR stream to `/ws/**`.

Troubleshooting:
- If connecting from Android emulator, ensure the base URL used by the WebSocket client points to `http://10.0.2.2:8080` rather than `http://localhost:8080`.
- Invalid or expired JWT will be rejected during STOMP `CONNECT`.


