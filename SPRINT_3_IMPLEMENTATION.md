# Sprint 3 Implementation Report: Game Setup & Real-time Foundation

This report documents the implementation details for Sprint 3, covering backend content seeding and WebSocket setup, and frontend WebSocket client and category selection UI.

---

## Backend Implementation

### Data Seeding
- Added `backend/src/main/resources/db/migration/V2__Seed_Initial_Data.sql` to seed:
  - Categories: Getting to Know You, Daily Habits, Memories, Intimacy (sensitive)
  - Two sample questions per category

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

## Next Steps
- Implement invitation and game message payloads and controllers (Sprint 4).
- Wire Dashboard to navigate to `CategorySelection` and initiate invitations.
- Add connection status surface in UI and reconnection indicators.
