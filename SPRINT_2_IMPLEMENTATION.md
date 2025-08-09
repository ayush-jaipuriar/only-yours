# Sprint 2 Implementation Report: Core Profile & Couple Linking

This report documents the implementation details for Sprint 2, covering backend endpoints for user profile and couple linking, and frontend screens to consume these endpoints.

---

## Backend Implementation

### DTOs
- Created `backend/src/main/java/com/onlyyours/dto/UserDto.java` with fields: `id`, `name`, `email`.
- Created `backend/src/main/java/com/onlyyours/dto/CoupleDto.java` with fields: `id`, `user1`, `user2` (both `UserDto`).

### Repositories
- Updated `backend/src/main/java/com/onlyyours/repository/CoupleRepository.java`:
  - Added `findByLinkCode(String linkCode)` to locate couples by invite code.
  - Added `findByUser1_IdOrUser2_Id(UUID user1Id, UUID user2Id)` to fetch the couple a user belongs to.

### Services
- Added `backend/src/main/java/com/onlyyours/service/CoupleService.java`:
  - `generateLinkCode(UUID userId)`: Creates a `Couple` with `user1` set and a random 6-character alphanumeric `linkCode`; persists and returns the code.
  - `redeemLinkCode(UUID userId, String code)`: Validates code is present and unused, prevents self-redeem, sets `user2`, clears `linkCode`, and saves.
  - `findCoupleForUser(UUID userId)`: Finds existing couple for a given user.

### Controllers
- Added `backend/src/main/java/com/onlyyours/controller/UserController.java`:
  - `GET /api/user/me` (secured): Maps authenticated principal email to a `User` and returns `UserDto`.
- Added `backend/src/main/java/com/onlyyours/controller/CoupleController.java`:
  - `POST /api/couple/generate-code` (secured): Returns `{ code }` by delegating to `CoupleService#generateLinkCode`.
  - `POST /api/couple/link` (secured): Accepts `{ code }`, redeems, and returns `CoupleDto`.
  - `GET /api/couple` (secured): Returns current `CoupleDto` or 404 when not linked.

---

## Frontend Implementation (React Native)

### Auth Context
- Updated `OnlyYoursApp/src/state/AuthContext.js` to clear token on `logout()` by removing `userToken` from `AsyncStorage`.

### Screens
- Added `OnlyYoursApp/src/screens/ProfileScreen.js`:
  - On mount, calls `GET /api/user/me`, displays `name` and `email`, and provides a `Logout` button.
- Added `OnlyYoursApp/src/screens/DashboardScreen.js`:
  - On focus, calls `GET /api/couple`. If linked, shows partner; if 404, shows button to go to partner linking.
- Added `OnlyYoursApp/src/screens/PartnerLinkScreen.js`:
  - "Get a Code" button calls `POST /api/couple/generate-code` and displays the code with a `Share` button.
  - "Enter a Code" field posts to `POST /api/couple/link`; on success, navigates back to `Dashboard`.

### Navigation
- Updated `OnlyYoursApp/src/navigation/AppNavigator.js` to replace `MainApp` with authenticated stack: `Dashboard`, `Profile`, `PartnerLink`.
- Deprecated `OnlyYoursApp/src/screens/MainApp.js` (returns `null`).

---

## Notes, Decisions, and Rationale
- Link codes are one-time and cleared once redeemed to prevent reuse.
- For MVP simplicity, multiple outstanding codes per user are not prevented; future iteration can enforce uniqueness or expiry.
- We rely on Spring Security JWT auth; controllers use `Principal` email to resolve the current `User`.

---

## Next Steps
- Optional hardening: prevent multiple open couples per user; add link code expiry.
- Add unlink endpoint if needed.
- Proceed to Sprint 3: category seeding and WebSocket setup.


