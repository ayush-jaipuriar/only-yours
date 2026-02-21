# Only Yours - End-to-End Implementation Status

**Document Purpose**: Comprehensive single-source-of-truth for the entire implementation journey of the "Only Yours" couples game app. Covers everything built, everything pending, architecture, tech stack, file inventory, and roadmap.

**Last Updated**: February 21, 2026

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Architecture Overview](#3-architecture-overview)
4. [Database Schema](#4-database-schema)
5. [Sprint History & Progress Dashboard](#5-sprint-history--progress-dashboard)
6. [Complete File Inventory](#6-complete-file-inventory)
7. [API & WebSocket Contract Reference](#7-api--websocket-contract-reference)
8. [What Has Been Implemented (Detailed)](#8-what-has-been-implemented-detailed)
9. [What Is Pending (Detailed)](#9-what-is-pending-detailed)
10. [Known Issues & Technical Debt](#10-known-issues--technical-debt)
11. [Key Decisions & Lessons Learned](#11-key-decisions--lessons-learned)
12. [How to Run the Project](#12-how-to-run-the-project)
13. [Documentation Index](#13-documentation-index)

---

## 1. Project Overview

**Only Yours** is a mobile couples game where two partners answer questions about themselves (Round 1) and then guess how their partner answered (Round 2). The goal is to see how well you know each other, using real-time synchronized gameplay over WebSockets.

### Product Vision

```
User A selects a category  →  Partner B receives invitation  →  Both answer 8 questions
   →  Both guess partner's answers  →  Scores calculated  →  See how well you know each other
```

### Planned MVP Feature Set

| Feature | Status | Sprint |
|---------|--------|--------|
| Google Sign-In authentication | ✅ Complete | Sprint 1 |
| JWT-based stateless security | ✅ Complete | Sprint 1 |
| User profile viewing | ✅ Complete | Sprint 2 |
| Couple linking (invite code) | ✅ Complete | Sprint 2 |
| Question categories & content seeding | ✅ Complete | Sprint 3 |
| WebSocket infrastructure (STOMP/SockJS) | ✅ Complete | Sprint 3 |
| React Native modernization (0.72→0.75.4) | ✅ Complete | RN Upgrade |
| Game invitation system | ✅ Complete | Sprint 4 |
| Round 1: Answering questions | ✅ Complete | Sprint 4 |
| Round 2: Guessing partner's answers | ❌ Not started | Sprint 5 |
| Scoring & results display | ❌ Not started | Sprint 5 |
| UI/UX polish & error handling | ❌ Not started | Sprint 6 |
| Production deployment (Docker, HTTPS, CI) | ❌ Not started | Sprint 6 |

---

## 2. Technology Stack

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Java** | 17 | Primary language |
| **Spring Boot** | 3.5.x | Application framework |
| **Spring Security** | 6.x | Authentication & authorization |
| **Spring WebSocket** | 6.x | Real-time STOMP messaging |
| **Spring Data JPA** | 3.x | ORM / database access |
| **PostgreSQL** | 15+ | Primary database |
| **Flyway** | 10.x | Database migration management |
| **Lombok** | 1.18.x | Boilerplate reduction (getters, setters, builders) |
| **JJWT** | 0.11.x | JWT generation & validation |
| **Google API Client** | 2.x | Google ID token verification |
| **Gradle** | 8.14.3 | Build tool (backend) |

### Frontend (Mobile)

| Technology | Version | Purpose |
|------------|---------|---------|
| **React Native** | 0.75.4 | Cross-platform mobile framework |
| **React** | 18.3.1 | UI library |
| **Hermes** | Enabled | JavaScript engine (optimized for RN) |
| **New Architecture** | Enabled | Fabric + TurboModules |
| **React Navigation** | 7.x | Screen navigation |
| **Axios** | Latest | HTTP client |
| **AsyncStorage** | Latest | Secure local storage |
| **Google Sign-In** | Latest | Native Google authentication |
| **STOMP.js** | Latest | WebSocket STOMP client |
| **SockJS Client** | Latest | WebSocket fallback transport |
| **Yarn** | 4.10.3 | Package manager |

### Android Toolchain

| Technology | Version | Notes |
|------------|---------|-------|
| Android Gradle Plugin (AGP) | 8.7.3 | Upgraded from 7.4.2 |
| Gradle Wrapper | 8.10 | Upgraded from 7.6.1 |
| Compile SDK | 34/35 | Upgraded from 33 |
| Kotlin | 1.9.24 | Required by RN 0.75 |
| JDK | 17 | Azul Zulu JDK |

### iOS Toolchain

| Technology | Status |
|------------|--------|
| CocoaPods | Configured (Podfile present) |
| Hermes | Enabled |
| Fabric | Enabled |
| Minimum iOS | 13.4 |

### Development Tools

| Tool | Purpose |
|------|---------|
| pgAdmin | PostgreSQL GUI management |
| Android Studio | Android SDK, emulator |
| Postman | API testing (collection exists) |
| Git | Version control |

---

## 3. Architecture Overview

### System Architecture

```
┌────────────────────────────────────────────────────────────┐
│                     MOBILE CLIENT                          │
│            React Native 0.75.4 (New Architecture)          │
│                                                            │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌──────────────┐ │
│  │AuthCtx  │  │GameCtx  │  │ Screens │  │ WebSocket    │ │
│  │(JWT)    │  │(state)  │  │  (UI)   │  │ Service      │ │
│  └────┬────┘  └────┬────┘  └────┬────┘  └──────┬───────┘ │
│       │            │            │               │         │
│       └────────────┴────────────┴───────────────┘         │
│                         │                                  │
└─────────────────────────┼──────────────────────────────────┘
                          │
              ┌───────────┴───────────┐
              │  HTTP (REST)          │  WebSocket (STOMP/SockJS)
              │  Port 8080            │  Endpoint: /ws
              └───────────┬───────────┘
                          │
┌─────────────────────────┼──────────────────────────────────┐
│                     BACKEND SERVER                         │
│              Spring Boot 3.5.x / Java 17                   │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                  Security Layer                       │  │
│  │  JwtAuthFilter (HTTP) │ WebSocketSecurityConfig (WS)  │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                  │
│  ┌───────────────────────┼──────────────────────────────┐  │
│  │               Controller Layer                        │  │
│  │  AuthController │ UserController │ CoupleController   │  │
│  │  ContentController │ GameController (@MessageMapping) │  │
│  └───────────────────────┼──────────────────────────────┘  │
│                          │                                  │
│  ┌───────────────────────┼──────────────────────────────┐  │
│  │                Service Layer                          │  │
│  │  AuthService │ JwtService │ CoupleService │GameService│  │
│  └───────────────────────┼──────────────────────────────┘  │
│                          │                                  │
│  ┌───────────────────────┼──────────────────────────────┐  │
│  │              Repository Layer (JPA)                    │  │
│  │  UserRepo │ CoupleRepo │ QuestionRepo │               │  │
│  │  QuestionCategoryRepo │ GameSessionRepo │             │  │
│  │  GameAnswerRepo                                       │  │
│  └───────────────────────┼──────────────────────────────┘  │
│                          │                                  │
└──────────────────────────┼──────────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              │     PostgreSQL 15+       │
              │   Database: onlyyours    │
              │   Tables: 6              │
              │   Migrations: V1, V2, V3 │
              └─────────────────────────┘
```

### Game State Machine

```
           ┌──────────┐
           │  START    │
           └────┬─────┘
                │ Player A selects category
                ▼
           ┌──────────┐
           │ INVITED   │ ◄── Game session created
           └────┬─────┘
                │
         ┌──────┴──────┐
         ▼             ▼
    ┌─────────┐   ┌──────────┐
    │DECLINED │   │ ROUND1   │ ◄── Partner accepts
    └─────────┘   └────┬─────┘
                       │ Both answer 8 questions
                       ▼
                  ┌──────────┐
                  │ ROUND2   │ ◄── Auto-transition
                  └────┬─────┘
                       │ Both guess 8 questions
                       ▼
                  ┌──────────┐
                  │COMPLETED │ ◄── Scores calculated
                  └──────────┘
```

### WebSocket Message Flow

```
                    INVITATION FLOW
┌──────────┐                              ┌──────────┐
│ Player A │                              │ Player B │
└────┬─────┘                              └────┬─────┘
     │                                         │
     │ /app/game.invite {categoryId}           │
     │─────────────────────►┌──────┐           │
     │                      │Server│           │
     │◄─────────────────────┤      ├──────────►│
     │ /user/queue/game-events     │           │
     │ {type:"STATUS",             │ /user/queue/game-events
     │  status:"INVITATION_SENT"}  │ {type:"INVITATION",
     │                      │      │  inviterName, categoryName}
     │                      └──────┘           │
     │                                         │
     │                                         │ /app/game.accept
     │           ┌──────┐                      │
     │◄──────────┤Server├──────────────────────│
     │           └──────┘                      │
     │                                         │
     │ /topic/game/{sessionId}                 │
     │ {type:"QUESTION", questionText, ...}    │
     │◄────────────────────────────────────────►│
     │                                         │

                    ANSWERING FLOW (per question)
     │                                         │
     │ /app/game.answer {answer:"B"}           │
     │─────────────────────►┌──────┐           │
     │                      │Server│           │
     │◄─────────────────────┤      │           │
     │ /user/queue/game-status     │           │
     │ {status:"ANSWER_RECORDED"}  │           │
     │                      └──────┘           │
     │                                         │
     │                      ┌──────┐           │ /app/game.answer {answer:"C"}
     │                      │Server│◄──────────│
     │                      └──┬───┘           │
     │                         │               │
     │ /topic/game/{sessionId} │               │
     │ {type:"QUESTION",       │               │
     │  questionNumber:2, ...} │               │
     │◄────────────────────────┴──────────────►│
     │                                         │
     │      ... repeat for 8 questions ...     │
     │                                         │
     │ /topic/game/{sessionId}                 │
     │ {type:"STATUS",                         │
     │  status:"ROUND1_COMPLETE"}              │
     │◄────────────────────────────────────────►│
```

---

## 4. Database Schema

### Current Schema (V1 + V3)

```sql
-- V1: Initial schema
CREATE TABLE users (
    id              UUID PRIMARY KEY,
    google_user_id  VARCHAR(255) NOT NULL UNIQUE,
    name            VARCHAR(255) NOT NULL,
    email           VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE couples (
    id        UUID PRIMARY KEY,
    user1_id  UUID REFERENCES users(id),
    user2_id  UUID REFERENCES users(id),
    link_code VARCHAR(255) UNIQUE
);

CREATE TABLE question_categories (
    id           SERIAL PRIMARY KEY,
    name         VARCHAR(255) NOT NULL,
    description  TEXT,
    is_sensitive BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE questions (
    id          SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES question_categories(id),
    text        TEXT NOT NULL,
    option_a    VARCHAR(255) NOT NULL,
    option_b    VARCHAR(255) NOT NULL,
    option_c    VARCHAR(255) NOT NULL,
    option_d    VARCHAR(255) NOT NULL
);

CREATE TABLE game_sessions (
    id                      UUID PRIMARY KEY,
    couple_id               UUID NOT NULL REFERENCES couples(id),
    status                  VARCHAR(255) NOT NULL,
    player1_score           INTEGER,
    player2_score           INTEGER,
    -- V3 additions:
    category_id             INTEGER,
    question_ids            VARCHAR(500),          -- comma-separated IDs
    current_question_index  INTEGER DEFAULT 0,
    created_at              TIMESTAMP,
    started_at              TIMESTAMP,
    completed_at            TIMESTAMP
);

CREATE TABLE game_answers (
    id              UUID PRIMARY KEY,
    game_session_id UUID NOT NULL REFERENCES game_sessions(id),
    question_id     INTEGER NOT NULL REFERENCES questions(id),
    user_id         UUID NOT NULL REFERENCES users(id),
    round1_answer   VARCHAR(255),
    round2_guess    VARCHAR(255)
);
```

### Migration History

| Migration | Sprint | Purpose |
|-----------|--------|---------|
| `V1__Initial_Schema.sql` | Sprint 0 | Creates all 6 tables |
| `V2__Seed_Initial_Data.sql` | Sprint 3 | Seeds 7 categories and 60+ questions |
| `V3__Add_Game_Session_Fields.sql` | Sprint 4 | Adds game flow tracking columns to `game_sessions` |

### Seeded Content

| Category | Sensitive | Question Count |
|----------|-----------|----------------|
| Getting to Know You | No | 4 |
| Daily Habits | No | 4 |
| Memories | No | 4 |
| Intimacy | Yes | 4 |
| Spicy Secrets | Yes | 10 |
| Fun Hypotheticals | No | 10 |
| Relationship Deep Dive | Yes | 10 |
| **Total** | | **46 questions** |

**Note**: The game requires 8 questions per round. Categories with fewer than 8 questions (Getting to Know You, Daily Habits, Memories, Intimacy) need additional questions seeded before they can be used for gameplay.

---

## 5. Sprint History & Progress Dashboard

### Overall Progress

```
Sprint 0: Project Setup          ████████████████████ 100%  ✅
Sprint 1: Authentication         ████████████████████ 100%  ✅
Sprint 2: Profile & Linking      ████████████████████ 100%  ✅
Sprint 3: Game Setup & WebSocket ████████████████████ 100%  ✅
RN Upgrade: 0.72 → 0.75.4       ████████████████████ 100%  ✅
Sprint 4: Round 1 (Answering)    ████████████████████  98%  ✅
Sprint 5: Round 2 (Guessing)     ░░░░░░░░░░░░░░░░░░░░   0%  ❌
Sprint 6: Polish & Release       ░░░░░░░░░░░░░░░░░░░░   0%  ❌
```

### Sprint-by-Sprint Summary

#### Sprint 0: Project Setup & Foundation ✅

**Goal**: Establish development environment, project structures, and foundational configurations.

**What Was Done**:
- Spring Boot project initialized with all dependencies (Web, Security, JPA, PostgreSQL, WebSocket, Lombok, Flyway)
- PostgreSQL datasource configured in `application.properties`
- All 6 JPA entities created: `User`, `Couple`, `QuestionCategory`, `Question`, `GameSession`, `GameAnswer`
- All 6 repository interfaces created extending `JpaRepository`
- Full package structure established: `controller`, `service`, `repository`, `model`, `config`, `security`, `dto`
- Flyway migration V1 created with DDL for all tables
- `SecurityConfig` with CSRF disabled, stateless sessions
- React Native project initialized via `npx react-native init`
- Navigation (`@react-navigation/native`, `@react-navigation/stack`) installed and `AppNavigator` created
- HTTP client (`axios`), storage (`AsyncStorage`), Google Sign-In installed
- `AuthContext` created with `isLoggedIn`, `user`, `login()`, `logout()`
- Google Cloud project configured with OAuth consent screen
- Android and Web OAuth Client IDs generated
- Git repository initialized with `.gitignore`

**Files Created**: ~25+ files across backend and frontend

---

#### Sprint 1: Authentication & User Onboarding ✅

**Goal**: Complete end-to-end Google Sign-In flow with JWT-based stateless authentication.

**What Was Done**:

**Backend**:
- `GoogleSignInRequestDto` and `AuthResponseDto` DTOs
- `JwtService`: Generate, validate, extract claims from JWTs
- `AuthService`: Google ID token verification, user provisioning (create or update), JWT issuance
- `AuthController`: `POST /api/auth/google/signin` endpoint (public)
- `JwtAuthFilter`: Extracts `Authorization: Bearer <token>`, validates JWT, sets `SecurityContextHolder`
- `SecurityConfig`: Permits `/api/auth/**`, authenticates all other requests

**Frontend**:
- `GoogleSignin.configure()` with Web Client ID in `App.js`
- `SignInScreen`: Google Sign-In button, token exchange with backend, JWT storage in AsyncStorage
- Conditional navigation based on `isLoggedIn` state
- Authenticated `axios` instance with interceptor in `api.js`

**Key Concepts Implemented**: OAuth 2.0, OpenID Connect, JWT structure (Header.Payload.Signature), Spring Security Filter Chain, stateless authentication

**Issues Resolved**:
- Java version incompatibility (Java 24 → pinned to JDK 17)
- Android SDK not found (installed Android Studio, set `sdk.dir`)
- Persistent Babel/linter parsing errors (environmental, not blocking)

**Files Created**: 8 backend, 4 frontend

---

#### Sprint 2: Core Profile & Couple Linking ✅

**Goal**: User profile viewing and permanent two-way partner linking with unique codes.

**What Was Done**:

**Backend**:
- `UserDto` and `CoupleDto` DTOs for safe API responses
- `UserController`: `GET /api/user/me` (returns authenticated user's profile)
- `CoupleService`: `generateLinkCode()` (creates couple + random 6-char code), `redeemLinkCode()` (validates, links user2, clears code), `findCoupleForUser()`
- `CoupleController`: `POST /api/couple/generate-code`, `POST /api/couple/link`, `GET /api/couple`
- `CoupleRepository`: Added `findByLinkCode()` and `findByUser1_IdOrUser2_Id()`

**Frontend**:
- `ProfileScreen`: Fetches `/api/user/me`, displays name/email, logout button
- `DashboardScreen`: Fetches `/api/couple`, shows partner name or "Link" button
- `PartnerLinkScreen`: Generate code section (with Share API), Enter code section (TextInput + Connect button)
- `AppNavigator`: Updated with `Dashboard`, `Profile`, `PartnerLink` routes

**Key Concepts Implemented**: DTO pattern, code-based invitation system, React Native Share API, `Principal.getName()` for user resolution

**Files Created**: 4 backend, 3 frontend, 1 navigation update

---

#### Sprint 3: Game Setup & Real-time Foundation ✅

**Goal**: Category selection UI and WebSocket infrastructure for real-time gameplay.

**What Was Done**:

**Backend**:
- `V2__Seed_Initial_Data.sql`: 7 categories, 46 questions seeded via Flyway
- `CategoryDto` and `ContentController`: `GET /api/content/categories`
- `WebSocketConfig`: STOMP endpoint at `/ws` with SockJS fallback, broker prefixes `/topic` and `/user`, app prefix `/app`
- `WebSocketSecurityConfig`: Inbound `ChannelInterceptor` extracts JWT from CONNECT frame's `Authorization` header, validates via `JwtService`, sets `Principal`

**Frontend**:
- Installed `@stomp/stompjs` and `sockjs-client`
- `WebSocketService.js`: Singleton managing connect/disconnect, subscribe, sendMessage with JWT auth header
- `CategorySelectionScreen`: Fetches categories, displays as cards, sensitive category confirmation dialog
- `AuthContext` updated: Connects WebSocket on login/silent auth, disconnects on logout

**Issues Resolved**:
- Hibernate vs Flyway column name mismatch (`optionA` vs `option_a`): Fixed with `@Column(name=...)` annotations
- Flyway checksum mismatch: Resolved by dropping/recreating local database
- Metro bundler `debug` module corruption: Fixed by reinstalling `node_modules`
- Android build compatibility: Pinned AGP 7.4.2, Gradle 7.6.1, SDK 33 for RN 0.72 baseline
- `GameAnswer` and `GameSession` entity mapping: Added `@Column` annotations for snake_case alignment

**Key Concepts Implemented**: Flyway migration strategy, STOMP protocol, SockJS transport, WebSocket security via JWT, simple in-memory message broker

**Files Created**: 4 backend, 2 frontend, 1 migration

---

#### React Native Upgrade ✅

**Goal**: Modernize React Native from 0.72 to latest stable with New Architecture.

**What Was Done**:
- React Native: 0.72.0 → 0.75.4
- React: 18.2.0 → 18.3.1
- Android Gradle Plugin: 7.4.2 → 8.7.3
- Gradle Wrapper: 7.6.1 → 8.10
- Compile/Target SDK: 33 → 34/35
- Kotlin: Added 1.9.24
- New Architecture: Enabled (`newArchEnabled=true`)
- Hermes Engine: Optimized
- Yarn: Adopted 4.10.3 as package manager
- React Navigation: 7.1.14 → 7.1.18
- All dependencies updated for compatibility

**Remaining Validation**:
- Performance benchmarking vs RN 0.72 baseline
- iOS physical device testing
- Comprehensive E2E testing

**Documentation**: See `RN_UPGRADE_PRD.md`

---

#### Sprint 4: Core Gameplay - Round 1 (Answering) ✅

**Goal**: Real-time synchronized question-answering game between two coupled players.

**Status**: Complete — 54 automated tests passing, manual E2E testing pending.

**What Was Done**:

**Backend (100% complete)**:
- 5 new DTOs: `GameInvitationDto`, `QuestionPayloadDto`, `AnswerRequestDto`, `GameStatusDto`, `InvitationResponseDto`
- `GameSession` entity: Added `categoryId`, `questionIds`, `currentQuestionIndex`, `createdAt`, `startedAt`, `completedAt` fields, `DECLINED` enum value
- `V3__Add_Game_Session_Fields.sql` migration
- Repository enhancements: 3 methods on `GameSessionRepository`, 4 methods on `GameAnswerRepository`, 2 methods on `QuestionRepository`
- `GameService` (350+ lines): `createInvitation()`, `acceptInvitation()`, `declineInvitation()`, `submitAnswer()`, `areBothPlayersAnswered()`, `getGameSession()`
- `GameController` (250+ lines): `@MessageMapping("/game.invite")`, `/game.accept`, `/game.decline`, `/game.answer` with error handling

**Frontend (100% complete)**:
- `GameContext.js`: Global game state management with WebSocket subscription
- `GameScreen.js` (300+ lines): Question display, option cards, progress bar, waiting indicator
- Dashboard, CategorySelection, AuthContext, AppNavigator: All updated for game flow

**Testing (54 backend tests, 14 frontend tests — all passing)**:
- `JwtServiceTest.java` (9 tests): Token generation, validation, expiry, extraction
- `CoupleServiceTest.java` (9 tests): Link code generation, redemption, error cases
- `GameServiceTest.java` (14 tests): Full game lifecycle coverage
- `RestControllerTest.java` (12 tests): MockMvc for all REST endpoints + security filter
- `GameControllerWebSocketTest.java` (6 tests): Full WebSocket E2E flow
- `WebSocketPerformanceTest.java` (3 tests): Latency and throughput profiling
- `GameContext.test.js` (6 tests), `GameScreen.test.js` (8 tests)

**Bug Fixes Discovered & Resolved During Testing**:
- `javax.validation` → `jakarta.validation` (Spring Boot 3.x)
- `UUID categoryId` → `Integer categoryId` type mismatch chain
- JPA entity relationship setters (used `@ManyToOne` objects instead of non-existent flat ID setters)
- Repository method naming for JPA relationship traversal (`Question_Id`/`User_Id`)
- `JwtAuthFilter` malformed token exception handling (was returning 500)
- `WebSocketSecurityConfig` STOMP principal propagation (user not set on session)
- `WebSocketConfig` broker destination missing `/queue` prefix
- `SecurityConfig` missing `/ws/**` permit for WebSocket handshake
- `@GeneratedValue` conflicts with manual UUID setting
- `@Builder.Default` for Lombok DTO defaults

**Performance Profiling Results**:
- STOMP connection: **6ms**
- Invitation round-trip: **58ms** (target: <200ms) ✅
- Average answer latency: **56.3ms** (target: <200ms) ✅
- Full 8-question game: **2.4 seconds** ✅
- JVM memory: **58MB** ✅

**What's Pending**:
- E2E manual testing with 2 physical devices

**Files Created**: 8 backend source, 2 frontend, 1 migration, 6 backend test files, 2 frontend test files

---

## 6. Complete File Inventory

### Backend: 36 Java files + 3 SQL migrations

```
backend/src/main/java/com/onlyyours/
├── OnlyYoursBackendApplication.java           ← App entry point
│
├── config/
│   ├── WebSocketConfig.java                   ← Sprint 3: STOMP broker config
│   └── WebSocketSecurityConfig.java           ← Sprint 3: JWT validation on CONNECT
│
├── controller/
│   ├── AuthController.java                    ← Sprint 1: POST /api/auth/google/signin
│   ├── UserController.java                    ← Sprint 2: GET /api/user/me
│   ├── CoupleController.java                  ← Sprint 2: Couple linking endpoints
│   ├── ContentController.java                 ← Sprint 3: GET /api/content/categories
│   └── GameController.java                    ← Sprint 4: WebSocket @MessageMapping
│
├── dto/
│   ├── GoogleSignInRequestDto.java            ← Sprint 1: Incoming Google ID token
│   ├── AuthResponseDto.java                   ← Sprint 1: JWT response
│   ├── UserDto.java                           ← Sprint 2: User profile response
│   ├── CoupleDto.java                         ← Sprint 2: Couple info response
│   ├── CategoryDto.java                       ← Sprint 3: Category listing
│   ├── GameInvitationDto.java                 ← Sprint 4: Invitation message
│   ├── QuestionPayloadDto.java                ← Sprint 4: Question broadcast
│   ├── AnswerRequestDto.java                  ← Sprint 4: Answer submission
│   ├── GameStatusDto.java                     ← Sprint 4: Status updates
│   └── InvitationResponseDto.java             ← Sprint 4: Accept/decline
│
├── model/
│   ├── User.java                              ← Sprint 0: User entity
│   ├── Couple.java                            ← Sprint 0: Couple entity
│   ├── QuestionCategory.java                  ← Sprint 0: Category entity
│   ├── Question.java                          ← Sprint 0: Question entity (fixed S3)
│   ├── GameSession.java                       ← Sprint 0 + Sprint 4: Enhanced entity
│   └── GameAnswer.java                        ← Sprint 0: Answer entity (fixed S3)
│
├── repository/
│   ├── UserRepository.java                    ← Sprint 0: User CRUD
│   ├── CoupleRepository.java                  ← Sprint 0 + Sprint 2: Couple queries
│   ├── QuestionCategoryRepository.java        ← Sprint 0: Category CRUD
│   ├── QuestionRepository.java                ← Sprint 0 + Sprint 4: Question queries
│   ├── GameSessionRepository.java             ← Sprint 0 + Sprint 4: Session queries
│   └── GameAnswerRepository.java              ← Sprint 0 + Sprint 4: Answer queries
│
├── security/
│   ├── SecurityConfig.java                    ← Sprint 0 + Sprint 1: HTTP security
│   └── JwtAuthFilter.java                     ← Sprint 1: JWT filter
│
└── service/
    ├── AuthService.java                       ← Sprint 1: Google auth + user provisioning
    ├── JwtService.java                        ← Sprint 1: JWT generation/validation
    ├── CoupleService.java                     ← Sprint 2: Link code logic
    └── GameService.java                       ← Sprint 4: Game business logic

backend/src/main/resources/
├── application.properties                     ← DB config, JWT secret, Hibernate settings
└── db/migration/
    ├── V1__Initial_Schema.sql                 ← Sprint 0: All 6 tables
    ├── V2__Seed_Initial_Data.sql              ← Sprint 3: 7 categories, 46 questions
    └── V3__Add_Game_Session_Fields.sql        ← Sprint 4: Game tracking columns

backend/src/test/java/com/onlyyours/
├── OnlyYoursBackendApplicationTests.java      ← Sprint 0: Context load test
├── service/
│   ├── JwtServiceTest.java                    ← Sprint 4: 9 test cases
│   ├── CoupleServiceTest.java                 ← Sprint 4: 9 test cases
│   └── GameServiceTest.java                   ← Sprint 4: 14 test cases
└── controller/
    ├── RestControllerTest.java                ← Sprint 4: 12 test cases (MockMvc)
    ├── GameControllerWebSocketTest.java        ← Sprint 4: 6 test cases (WebSocket E2E)
    └── WebSocketPerformanceTest.java           ← Sprint 4: 3 test cases (latency profiling)
```

### Frontend: 14 JavaScript files + tests

```
OnlyYoursApp/
├── App.js                                     ← Sprint 0 + Sprint 4: Root with providers
├── App.tsx                                    ← Default RN template (unused)
├── index.js                                   ← RN entry point
│
└── src/
    ├── navigation/
    │   └── AppNavigator.js                    ← Sprint 1-4: Stack navigator (6 screens)
    │
    ├── screens/
    │   ├── SignInScreen.js                    ← Sprint 1: Google Sign-In UI
    │   ├── MainApp.js                         ← Sprint 1: Deprecated placeholder
    │   ├── DashboardScreen.js                 ← Sprint 2 + Sprint 4: Main landing page
    │   ├── ProfileScreen.js                   ← Sprint 2: User profile display
    │   ├── PartnerLinkScreen.js               ← Sprint 2: Code generation & redemption
    │   ├── CategorySelectionScreen.js         ← Sprint 3 + Sprint 4: Category cards + invitation
    │   ├── GameScreen.js                      ← Sprint 4: Gameplay UI (NEW)
    │   └── __tests__/
    │       └── GameScreen.test.js             ← Sprint 4: 8 test cases (NEW)
    │
    ├── services/
    │   ├── api.js                             ← Sprint 1: Authenticated axios instance
    │   └── WebSocketService.js                ← Sprint 3: STOMP/SockJS client singleton
    │
    └── state/
        ├── AuthContext.js                     ← Sprint 1-4: Auth state + invitation handling
        ├── GameContext.js                     ← Sprint 4: Game state management (NEW)
        └── __tests__/
            └── GameContext.test.js            ← Sprint 4: 6 test cases (NEW)
```

### Configuration Files

```
OnlyYoursApp/
├── package.json                               ← Dependencies and scripts
├── yarn.lock                                  ← Locked dependency versions
├── .yarnrc.yml                                ← Yarn 4 config
├── babel.config.js                            ← Babel transpilation
├── metro.config.js                            ← Metro bundler config
├── jest.config.js                             ← Test runner config
├── tsconfig.json                              ← TypeScript config
├── android/
│   ├── build.gradle                           ← AGP 8.7.3, SDK config
│   ├── gradle.properties                      ← New Architecture, Hermes flags
│   ├── gradle/wrapper/gradle-wrapper.properties ← Gradle 8.10
│   ├── settings.gradle                        ← Module includes
│   └── app/build.gradle                       ← App-level Android config
└── ios/
    └── Podfile                                ← CocoaPods config
```

### Documentation Files

```
Root/
├── README.md                                  ← Project overview
├── DEVELOPMENT_PLAN.md                        ← Master sprint plan (living document)
├── FRONTEND_DECISION.md                       ← Frontend stack evaluation
├── RN_UPGRADE_PRD.md                          ← React Native upgrade specification
├── SPRINT_1_IMPLEMENTATION.md                 ← Sprint 1 detailed report
├── SPRINT_2_IMPLEMENTATION.md                 ← Sprint 2 detailed report
├── SPRINT_3_IMPLEMENTATION.md                 ← Sprint 3 detailed report
├── SPRINT_4_PRD.md                            ← Sprint 4 technical specification
├── SPRINT_4_IMPLEMENTATION.md                 ← Sprint 4 detailed report
├── PROJECT_STATUS.md                          ← This document (comprehensive status)
├── TESTING_GUIDE.md                           ← Testing instructions
├── FLYWAY_STUDY_GUIDE.md                      ← Flyway deep-dive reference
├── COMPREHENSIVE_STUDY_GUIDE.md               ← Overall technology study guide
└── postman/
    └── OnlyYours_S0_S3.postman_collection.json ← API testing collection
```

---

## 7. API & WebSocket Contract Reference

### REST API Endpoints

| Method | Path | Auth | Sprint | Purpose |
|--------|------|------|--------|---------|
| `POST` | `/api/auth/google/signin` | Public | S1 | Exchange Google ID token for app JWT |
| `GET` | `/api/user/me` | JWT | S2 | Get authenticated user's profile |
| `POST` | `/api/couple/generate-code` | JWT | S2 | Generate 6-char couple link code |
| `POST` | `/api/couple/link` | JWT | S2 | Redeem link code, join couple |
| `GET` | `/api/couple` | JWT | S2 | Get couple status (200 or 404) |
| `GET` | `/api/content/categories` | JWT | S3 | List all question categories |

### WebSocket Endpoints

**Connection**: `ws://localhost:8080/ws` (STOMP over SockJS)
**Authentication**: JWT passed as `Authorization: Bearer <token>` in CONNECT frame

### WebSocket Message Catalog (Sprint 4)

| Direction | Destination | Payload | Trigger |
|-----------|-------------|---------|---------|
| Client→Server | `/app/game.invite` | `{categoryId: "uuid"}` | Player selects category |
| Server→Client | `/user/queue/game-events` | `GameInvitationDto` | Invitation sent to partner |
| Server→Client | `/user/queue/game-events` | `GameStatusDto` {INVITATION_SENT} | Confirmation to inviter |
| Client→Server | `/app/game.accept` | `{sessionId: "uuid"}` | Partner accepts invitation |
| Client→Server | `/app/game.decline` | `{sessionId: "uuid"}` | Partner declines invitation |
| Server→Client | `/user/queue/game-events` | `GameStatusDto` {INVITATION_DECLINED} | Decline notification |
| Server→Both | `/topic/game/{sessionId}` | `QuestionPayloadDto` | Question broadcast (8 times) |
| Client→Server | `/app/game.answer` | `AnswerRequestDto` | Player submits answer |
| Server→Client | `/user/queue/game-status` | `GameStatusDto` {ANSWER_RECORDED} | Answer confirmation |
| Server→Both | `/topic/game/{sessionId}` | `GameStatusDto` {ROUND1_COMPLETE} | All 8 questions answered |
| Server→Client | `/user/queue/errors` | `{type, message, timestamp}` | Error notification |

---

## 8. What Has Been Implemented (Detailed)

### A. Authentication System ✅ (Sprint 1)

**Backend**:
- Google ID token verification using `GoogleIdTokenVerifier`
- User auto-provisioning (create new user if first sign-in, update if returning)
- JWT generation with configurable expiry and HMAC-SHA256 signing
- `JwtAuthFilter` intercepting every HTTP request, validating Bearer tokens
- `SecurityConfig` with public (`/api/auth/**`) and protected (all else) routes
- Stateless session management (no server-side session storage)

**Frontend**:
- Native Google Sign-In prompt via `@react-native-google-signin/google-signin`
- Token exchange: Google ID token → backend → app JWT
- Secure JWT storage in `AsyncStorage`
- Auto-login on app restart (silent auth from stored token)
- Authenticated `axios` instance with request interceptor
- Conditional navigation (logged in → Dashboard, logged out → SignIn)

**Security Model**:
```
User ──► Google Sign-In ──► Google ID Token ──► Backend Verification
──► User DB Lookup/Create ──► App JWT Issued ──► Stored on Device
──► All subsequent requests include JWT in Authorization header
──► JwtAuthFilter validates on every request
```

---

### B. Profile & Couple Linking ✅ (Sprint 2)

**User Profile**:
- `GET /api/user/me` returns authenticated user's name and email
- Frontend displays profile with logout button
- Logout clears AsyncStorage and disconnects WebSocket

**Couple Linking Flow**:
```
User A: Taps "Get a Code" ──► POST /api/couple/generate-code
                           ◄── Returns 6-char code (e.g., "X7K2M9")
                           ──► Can share code via native Share API

User B: Enters code ──► POST /api/couple/link
                     ◄── Returns CoupleDto (both users linked)
                     ──► Navigates to Dashboard, shows partner name
```

**Security Rules**: Cannot self-link, code cleared after use, couple permanently established

---

### C. Content & Categories ✅ (Sprint 3)

**Database Seeding**: 7 categories, 46 questions seeded via Flyway V2

| Category | Questions | Sensitive |
|----------|-----------|-----------|
| Getting to Know You | 4 | No |
| Daily Habits | 4 | No |
| Memories | 4 | No |
| Intimacy | 4 | Yes |
| Spicy Secrets | 10 | Yes |
| Fun Hypotheticals | 10 | No |
| Relationship Deep Dive | 10 | Yes |

**Frontend Display**: Card-based category list with orange border for sensitive categories, confirmation dialog before selecting sensitive content

---

### D. WebSocket Infrastructure ✅ (Sprint 3)

**Backend**:
- STOMP message broker enabled with `/topic` (broadcast) and `/user` (private) prefixes
- SockJS fallback for networks blocking native WebSocket
- JWT authentication on STOMP CONNECT via channel interceptor
- `SimpMessagingTemplate` for programmatic message sending

**Frontend**:
- Singleton `WebSocketService` with connect/disconnect/subscribe/send methods
- Automatic connection on login, disconnection on logout
- JWT passed in STOMP CONNECT headers

---

### E. React Native Modernization ✅ (RN Upgrade)

| Component | Before | After |
|-----------|--------|-------|
| React Native | 0.72.0 | 0.75.4 |
| React | 18.2.0 | 18.3.1 |
| AGP | 7.4.2 | 8.7.3 |
| Gradle | 7.6.1 | 8.10 |
| SDK | 33 | 34/35 |
| Architecture | Old | New (Fabric + TurboModules) |
| JS Engine | Hermes (default) | Hermes (optimized) |
| Package Manager | npm | Yarn 4.10.3 |
| Kotlin | Not used | 1.9.24 |

---

### F. Game Invitation & Round 1 Answering ✅ (Sprint 4)

**Invitation System**:
- Player A selects category → WebSocket message `/app/game.invite`
- Server creates `GameSession` with `INVITED` status
- Invitation sent to Player B's private queue with category name, inviter name
- Player B sees Alert dialog: Accept or Decline
- Accept: Server loads questions, shuffles, selects 8, sets status to `ROUND1`, broadcasts first question
- Decline: Server sets status to `DECLINED`, notifies Player A

**Round 1 Gameplay**:
- Both players see same question simultaneously on `/topic/game/{sessionId}`
- Each player selects answer (A/B/C/D) and submits
- Server records answer, checks if both answered
- When both answer: server advances `currentQuestionIndex`, broadcasts next question
- After all 8 questions: server transitions to `ROUND2` status, broadcasts `ROUND1_COMPLETE`

**Frontend Game UI**:
- Progress bar (Question X of Y)
- Centered question text in card
- Four option buttons with letter badges
- Submit button (disabled until selection)
- "Waiting for partner..." spinner after submission
- Automatic state reset when next question arrives
- Round 1 complete alert with navigation back to Dashboard

**Backend Tests**: 14 test cases covering:
- Invitation creation (success, user not in couple)
- Invitation acceptance (success, wrong status)
- Invitation decline
- Answer submission (first player, both players, last question)
- Duplicate submission (idempotency)
- Invalid answer format
- Wrong game status
- Utility method correctness
- Session retrieval (success, not found)

---

## 9. What Is Pending (Detailed)

### A. Sprint 4 Remaining (~2% left)

| Task | Priority | Effort | Notes |
|------|----------|--------|-------|
| ~~Backend integration tests~~ | ~~Medium~~ | ~~1 day~~ | ✅ **DONE** — 6 WebSocket flow tests passing |
| ~~Performance profiling~~ | ~~Low~~ | ~~0.5 day~~ | ✅ **DONE** — 56ms avg latency, 2.4s full game |
| ~~Bug fixes from testing~~ | ~~Medium~~ | ~~1-2 days~~ | ✅ **DONE** — 13 bugs found and fixed |
| E2E manual testing (2 devices) | High | 1-2 days | 5 test cases: happy path, decline, disconnect, backgrounding, simultaneous |
| Seed more questions | High | 0.5 day | Categories with <8 questions can't be used for games |

**Blocker for E2E Testing**: Requires both backend running on localhost:8080 and two Android devices/emulators signed in with different Google accounts.

---

### B. Sprint 5: Round 2 (Guessing) & Results ❌

**Backend** (Estimated: 3-4 days):
- [ ] Game state transition: After Round 1, replay questions in Round 2 mode
- [ ] `@MessageMapping("/game.guess")`: Record guess in `round2_guess` column
- [ ] Guess validation: Compare `round2_guess` to partner's `round1_answer`
- [ ] Scoring logic: Count correct guesses for each player
- [ ] Update `player1_score` and `player2_score` in `game_sessions`
- [ ] Set status to `COMPLETED`, broadcast `ResultsPayload`
- [ ] Private feedback to each player: "Correct! Partner chose C" or "Wrong, partner chose A"

**Frontend** (Estimated: 3-4 days):
- [ ] Update GameScreen for Round 2: Change prompt to "How did [Partner] answer?"
- [ ] Listen for private guess feedback on `/user/queue/game-status`
- [ ] Show result animation between questions
- [ ] Build `ResultsScreen.js`: Display scores, partner comparison, celebratory UI
- [ ] "Play Again" button → CategorySelectionScreen
- [ ] "Back to Dashboard" button

**Testing** (Estimated: 2 days):
- [ ] Unit tests for guessing logic
- [ ] Integration tests for full game lifecycle
- [ ] E2E test: Complete game (Round 1 + Round 2) with scoring

---

### C. Sprint 6: Testing, Polish & MVP Release ❌

**Backend Polish** (Estimated: 2-3 days):
- [ ] Integration tests for auth flow (`@SpringBootTest`)
- [ ] Integration tests for REST controllers
- [ ] Test profile with H2 in-memory database
- [ ] Add comprehensive `slf4j` logging to all services
- [ ] Enable Spring Boot Actuator (`/health`, `/metrics`)
- [ ] Move secrets to environment variables (JWT secret, Google client ID, DB password)
- [ ] Create `Dockerfile` for containerized deployment
- [ ] Test Docker build locally

**Frontend Polish** (Estimated: 3-4 days):
- [ ] Add loading spinners for all network requests
- [ ] Empty state components (category list failure, no couple, etc.)
- [ ] Smooth screen transition animations
- [ ] Review/refine all user-facing copy
- [ ] Global axios error handling with user-friendly alerts
- [ ] WebSocket reconnection banner ("Reconnecting...")
- [ ] Connection status indicators
- [ ] E2E manual testing: full user journey on 2 physical Android devices
- [ ] Generate signed release APK

**DevOps** (Estimated: 2-3 days):
- [ ] Production PostgreSQL instance (AWS RDS / Google Cloud SQL)
- [ ] Container orchestration (AWS ECS / Google Cloud Run)
- [ ] Deploy backend container
- [ ] SSL/TLS termination (HTTPS enforcement)
- [ ] Domain name and DNS configuration

---

### D. Not Yet Planned (Post-MVP)

| Feature | Description | Priority |
|---------|-------------|----------|
| Game History | View past games, scores, trends | Medium |
| More Questions | Expand question pool (100+ per category) | High |
| Notifications | Push notifications for invitations | Medium |
| Session Timeout | Auto-expire INVITED sessions after 5 minutes | Low |
| Game Resume | Reconnect to in-progress game after disconnect | Medium |
| Player Avatars | Profile pictures from Google account | Low |
| Dark Mode | Full dark theme support | Low |
| iOS Testing | Physical device validation on iPhone | High |
| Play Again Flow | Quick rematch from results screen | Medium |
| Question Packs | Downloadable/purchasable question packs | Low (monetization) |
| Analytics | Track game completion rates, popular categories | Low |

---

## 10. Known Issues & Technical Debt

### Active Issues

| # | Severity | Description | Introduced | Fix Planned |
|---|----------|-------------|------------|-------------|
| 1 | **High** | Categories with <8 questions will crash `acceptInvitation()` | Sprint 4 | Seed more questions in V4 migration |
| 2 | **Medium** | No session timeout for INVITED games (stay in DB forever) | Sprint 4 | Sprint 6 (cron job) |
| 3 | **Medium** | No reconnection UI when WebSocket drops mid-game | Sprint 4 | Sprint 6 (banner component) |
| 4 | **Medium** | Race condition in synchronized answer counting | Sprint 4 | Mitigated by `@Transactional`; Redis lock if needed at scale |
| 5 | **Low** | `MainApp.js` is a deprecated placeholder (returns null) | Sprint 2 | Delete file |
| 6 | **Low** | `App.tsx` is the default RN template, unused | Sprint 0 | Delete file |
| 7 | **Low** | Babel linter parsing errors in IDE (not blocking) | Sprint 1 | Environmental / IDE config |

### Resolved Issues (Sprint 4 Testing Phase, Feb 21 2026)

| # | Severity | Description | Resolution |
|---|----------|-------------|------------|
| R1 | **Critical** | `javax.validation` imports instead of `jakarta.validation` — compilation failure | Changed to `jakarta.validation`, added `spring-boot-starter-validation` dep |
| R2 | **Critical** | `categoryId` typed as UUID throughout chain — should be Integer | Fixed GameService, GameController, GameInvitationDto parameter types |
| R3 | **Critical** | `GameAnswer.setQuestionId()`/`setUserId()` — methods don't exist on `@ManyToOne` entities | Fixed to use `setQuestion()`/`setUser()` with proper entity lookups |
| R4 | **Critical** | `GameAnswerRepository` method names don't match JPA relationships | Fixed: `QuestionId` → `Question_Id`, `UserId` → `User_Id` |
| R5 | **Critical** | `QuestionRepository` JPQL uses `q.categoryId` — entity has `q.category` | Fixed JPQL to `q.category.id` |
| R6 | **High** | `JwtAuthFilter` throws unhandled 500 on malformed JWT | Added try-catch, now properly returns 403 |
| R7 | **High** | `WebSocketSecurityConfig` user principal not set on STOMP session | Used `MessageHeaderAccessor.getAccessor()` for mutable accessor |
| R8 | **High** | `WebSocketConfig` missing `/queue` in broker destinations | Added `/queue` — user-directed messages now delivered |
| R9 | **High** | `SecurityConfig` blocks `/ws/**` — WebSocket handshake fails | Added `.requestMatchers("/ws/**").permitAll()` |
| R10 | **Medium** | Manual `setId(UUID.randomUUID())` conflicts with `@GeneratedValue` | Removed manual ID setting, let JPA auto-generate |
| R11 | **Medium** | `@Builder` ignores field defaults without `@Builder.Default` | Added `@Builder.Default` to DTO fields with defaults |
| R12 | **Low** | H2 test DB doesn't support PostgreSQL `RANDOM()` function | Added `MODE=PostgreSQL` to H2 JDBC URL |
| R13 | **Low** | Test JWT secret too short for HS256 | Updated to Base64 string ≥32 bytes |

### Technical Debt

| Area | Debt | Impact | Resolution |
|------|------|--------|------------|
| **Secrets in properties** | JWT secret and Google client ID in `application.properties` | Security risk in production | Move to env vars (Sprint 6) |
| **No rate limiting** | Users can spam invitations | DoS potential | Add rate limiter (Spring 6) |
| **No CORS configuration** | Backend accepts all origins (`*`) | Security risk in production | Restrict origins (Sprint 6) |
| **No pagination** | Category and question endpoints return all results | Performance risk at scale | Add pagination (post-MVP) |
| **JavaScript, not TypeScript** | All frontend files are `.js` | Type safety, refactoring risk | Gradual migration to `.tsx` |
| **Single authentication method** | Only Google Sign-In supported | Limits user base | Add Apple Sign-In, email/password (post-MVP) |
| **In-memory message broker** | Using Spring's simple broker | Not production-ready for scale | Upgrade to RabbitMQ/ActiveMQ (Sprint 6) |
| **No database indexes** | Only primary keys and unique constraints | Query performance at scale | Add indexes on foreign keys (Sprint 6) |

---

## 11. Key Decisions & Lessons Learned

### Architectural Decisions

| # | Decision | Options Considered | Chosen | Rationale |
|---|----------|-------------------|--------|-----------|
| 1 | Frontend framework | React Native, Jetpack Compose, Flutter, KMP | React Native | Single codebase, existing code, sufficient performance |
| 2 | Authentication | Sessions, JWT, Firebase Auth | JWT (stateless) | Scalable, no server-side session storage |
| 3 | Real-time transport | WebSocket, SSE, Polling | WebSocket (STOMP/SockJS) | Bidirectional, low latency, Spring support |
| 4 | Database | PostgreSQL, MySQL, MongoDB | PostgreSQL | Relational data model, ACID, Flyway support |
| 5 | Migration tool | Flyway, Liquibase, Manual DDL | Flyway | Simple, version-based, Spring Boot integration |
| 6 | Package manager | npm, Yarn 1, Yarn 4, pnpm | Yarn 4 | PnP mode, deterministic, faster installs |
| 7 | Game state sync | Database count, Redis, In-memory map | Database count | Simple, no new infra, acceptable for MVP |
| 8 | Question storage | Full data in session, IDs only, Re-randomize | Comma-separated IDs | Minimal storage, reproducible game state |
| 9 | Frontend state | Redux, MobX, Context API | Context API | Native React, sufficient complexity, no deps |
| 10 | Cross-context communication | Event emitter, Redux, Refs | React Refs | Simple, React-recommended for imperative APIs |

### Lessons Learned

**Environment Setup**:
- Always pin JDK version in `gradle.properties` to avoid version drift
- Create `local.properties` for Android SDK path early
- Flyway checksums are immutable after first run; never edit applied migrations

**Hibernate vs Flyway**:
- Always use `@Column(name = "snake_case")` on entity fields
- Set `spring.jpa.hibernate.ddl-auto=validate` from the start
- Flyway should be the single source of truth for schema

**WebSocket Development**:
- SockJS provides critical fallback for restrictive networks
- Private queues (`/user/queue/*`) vs broadcast topics (`/topic/*`) serve different purposes
- WebSocket security should mirror REST security (same JWT, same validation)

**React Native Upgrades**:
- Always upgrade AGP, Gradle, and SDK together
- Enable New Architecture before upgrading dependencies
- Keep the RN upgrade separate from feature work

---

## 12. How to Run the Project

### Prerequisites

| Tool | Version | Installation |
|------|---------|-------------|
| JDK | 17 | `brew install --cask zulu17` (or Azul JDK) |
| PostgreSQL | 15+ | `brew install postgresql` or pgAdmin |
| Node.js | LTS (20+) | `nvm install --lts` |
| Yarn | 4.10.3 | `corepack enable && yarn set version stable` |
| Android Studio | Latest | Download from developer.android.com |
| Android SDK | 34 | Via Android Studio SDK Manager |

### Backend Setup

```bash
# 1. Create PostgreSQL database
createdb onlyyours

# 2. Configure (if needed)
# Edit backend/src/main/resources/application.properties
# Set spring.datasource.url, username, password

# 3. Start backend
cd backend
./gradlew bootRun
# Backend runs on http://localhost:8080
# Flyway automatically runs migrations V1, V2, V3

# 4. Run tests
./gradlew test
```

### Frontend Setup

```bash
# 1. Install dependencies
cd OnlyYoursApp
yarn install

# 2. Start Metro bundler
yarn start

# 3. Run on Android (in separate terminal)
yarn android
# OR for iOS:
cd ios && pod install && cd ..
yarn ios
```

### Testing with Two Devices

1. Start backend on host machine
2. Start two Android emulators (different API levels if desired)
3. Sign in with different Google accounts on each
4. On device 1: Generate couple link code
5. On device 2: Enter link code to connect
6. On device 1: Dashboard → Start New Game → Select category
7. On device 2: Accept invitation alert
8. Both devices: Answer 8 questions

---

## 13. Documentation Index

| Document | Purpose | Status |
|----------|---------|--------|
| [`README.md`](README.md) | Project overview and quick start | Current |
| [`DEVELOPMENT_PLAN.md`](DEVELOPMENT_PLAN.md) | Master sprint plan with checkboxes | Living document |
| [`SPRINT_1_IMPLEMENTATION.md`](SPRINT_1_IMPLEMENTATION.md) | Sprint 1 detailed report (auth) | Final |
| [`SPRINT_2_IMPLEMENTATION.md`](SPRINT_2_IMPLEMENTATION.md) | Sprint 2 detailed report (profile/linking) | Final |
| [`SPRINT_3_IMPLEMENTATION.md`](SPRINT_3_IMPLEMENTATION.md) | Sprint 3 detailed report (WebSocket/categories) | Final |
| [`SPRINT_4_PRD.md`](SPRINT_4_PRD.md) | Sprint 4 technical specification (PRD) | Final |
| [`SPRINT_4_IMPLEMENTATION.md`](SPRINT_4_IMPLEMENTATION.md) | Sprint 4 detailed report (gameplay Round 1) | In progress |
| [`RN_UPGRADE_PRD.md`](RN_UPGRADE_PRD.md) | React Native upgrade specification | Final |
| [`FRONTEND_DECISION.md`](FRONTEND_DECISION.md) | Frontend stack evaluation | Final |
| [`PROJECT_STATUS.md`](PROJECT_STATUS.md) | This document (comprehensive status) | Living document |
| [`TESTING_GUIDE.md`](TESTING_GUIDE.md) | Testing instructions | Needs update |
| [`FLYWAY_STUDY_GUIDE.md`](FLYWAY_STUDY_GUIDE.md) | Flyway deep-dive reference | Final |
| [`COMPREHENSIVE_STUDY_GUIDE.md`](COMPREHENSIVE_STUDY_GUIDE.md) | Overall technology study guide | Final |
| [`postman/OnlyYours_S0_S3.postman_collection.json`](postman/OnlyYours_S0_S3.postman_collection.json) | Postman API testing collection | Covers S0-S3 |

---

## Summary: Where We Stand

### By the Numbers

| Metric | Value |
|--------|-------|
| **Sprints completed** | 4 of 6 (+ RN Upgrade) |
| **Backend Java files** | 36 |
| **Frontend JS files** | 14 |
| **Database tables** | 6 |
| **Database migrations** | 3 |
| **REST API endpoints** | 6 |
| **WebSocket message types** | 11 |
| **Question categories** | 7 |
| **Seeded questions** | 46 |
| **Backend test cases** | 14 |
| **Frontend test cases** | 14 |
| **Documentation files** | 13 |
| **Lines of code (estimated)** | ~5,000+ (backend + frontend) |
| **Lines of documentation** | ~10,000+ |

### What Works End-to-End Today

A user can:
1. ✅ Open the app and sign in with Google
2. ✅ View their profile
3. ✅ Generate a couple link code and share it
4. ✅ Partner redeems code, couple is linked
5. ✅ See partner's name on dashboard
6. ✅ Tap "Start New Game" and select a category
7. ✅ Partner receives invitation alert with Accept/Decline
8. ✅ Both players answer 8 questions in sync
9. ✅ See "Round 1 Complete" when finished
10. ❌ **Cannot yet** play Round 2 (guessing)
11. ❌ **Cannot yet** see scores or results

### What's Needed to Ship MVP

| Remaining Work | Estimated Effort |
|----------------|-----------------|
| Sprint 4 testing + bug fixes | 2-3 days |
| Sprint 5 (Round 2 + Scoring + Results) | 6-8 days |
| Sprint 6 (Polish + Production Deploy) | 7-10 days |
| **Total to MVP** | **~15-21 days** |

### Immediate Next Steps

1. **Seed more questions** for categories with <8 (Getting to Know You, Daily Habits, Memories, Intimacy)
2. **E2E test** the current implementation with 2 devices
3. **Fix any bugs** found during testing
4. **Begin Sprint 5** (Round 2 guessing and scoring)

---

**Document Version**: 1.0
**Maintained By**: Development Team
**Next Review**: After Sprint 5 completion
