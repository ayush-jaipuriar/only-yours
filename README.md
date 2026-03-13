# Only Yours

Only Yours is a couples game app with a Spring Boot backend and two mobile clients in the repo:

- `OnlyYoursExpo`: the current Expo/React Native app and the most up-to-date frontend surface.
- `OnlyYoursApp`: the older React Native CLI app retained as a legacy baseline/reference.
- `backend`: the Spring Boot API, realtime game server, auth layer, and primary business-logic source of truth.

The product flow is: link with a partner, invite them into a category-based game, answer 8 questions about yourself in Round 1, guess your partner's answers in Round 2, then review scores, history, stats, and badges.

## Current Feature Set

- Email/password authentication with refresh tokens and password reset
- Couple linking via one-time partner codes
- Two-round realtime gameplay over STOMP/WebSockets
- Push notification registration and gameplay notifications
- Active-session continuation and 7-day session expiry
- Game history, dashboard stats, and badge milestones
- Profile editing, onboarding, theme preferences, and notification preferences
- Relationship unlink, cooldown, and recovery flow

Google sign-in code still exists in historical docs and legacy paths, but the current backend intentionally disables Google sign-in.

## Repository Layout

```text
.
├── backend/          Spring Boot 3.5 backend, PostgreSQL/Flyway, REST + WebSocket APIs
├── OnlyYoursExpo/    Active Expo app (React 19 / RN 0.81 / Expo 54)
├── OnlyYoursApp/     Legacy React Native CLI app
└── *.md              Product plans, implementation notes, testing docs, and status docs
```

## Tech Stack

### Backend

- Java 17
- Spring Boot 3.5
- Spring Security
- Spring Data JPA
- Spring WebSocket + STOMP
- PostgreSQL
- Flyway
- JWT
- Bucket4j rate limiting

### Active Frontend

- Expo 54
- React 19
- React Native 0.81
- React Navigation 7
- Axios
- AsyncStorage
- Expo Notifications
- STOMP over raw WebSocket (`/ws-native`)

## Quick Start

### Backend

```bash
cd backend
./gradlew bootRun
```

The backend reads configuration from `backend/src/main/resources/application.properties` and optional `.env` files.

### Expo App

```bash
cd OnlyYoursExpo
npm install
npm run android
```

The Expo app reads the backend host from `EXPO_PUBLIC_API_URL`, defaulting to `http://localhost:8080`.

### Legacy React Native CLI App

Use `OnlyYoursApp` only if you specifically need the older native-cli implementation. Most current feature work lives in `OnlyYoursExpo`.

## Tests

### Backend

```bash
cd backend
./gradlew test
```

### Expo App

```bash
cd OnlyYoursExpo
npm test
```

### Legacy App

```bash
cd OnlyYoursApp
npm test
```

## Deeper Documentation

- [Codebase Expert Guide](./CODEBASE_EXPERT_GUIDE.md)
- [Project Status](./PROJECT_STATUS.md)
- [Testing Guide](./TESTING_GUIDE.md)
- [Auth Migration Implementation](./AUTH_MIGRATION_IMPLEMENTATION.md)
