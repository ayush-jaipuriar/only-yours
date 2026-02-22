# Only Yours - Detailed Development Plan

This document breaks down the development of the "Only Yours" MVP into a detailed, 7-sprint plan. Each task has a checkbox to track progress.

---

## Sprint 0: Project Setup & Foundation (Week 1)

**Goal:** Establish the development environment, project structures, and foundational configurations for both the backend and frontend. This sprint lays the groundwork for all future development.

### Backend Technical Tasks
- [x] **Project Initialization:**
    - [x] Initialize a new Spring Boot project using Spring Initializr.
    - [x] Use **Gradle (Kotlin DSL)** as the build tool and Java as the language.
    - [x] Include the following dependencies: `Spring Web`, `Spring Security`, `Spring Data JPA`, `PostgreSQL Driver`, `WebSocket`, `Lombok`, and `Flyway Migration`.
- [x] **Database Configuration:**
    - [x] Configure the PostgreSQL data source URL, username, and password in `application.properties`.
    - [x] Set `spring.jpa.hibernate.ddl-auto` to `validate` to ensure the schema matches the entities without auto-modifying it in production environments. (Use `update` or `create-drop` for initial local development).
- [x] **JPA Entity Definition:**
    - [x] Create the `com.onlyyours.model` package.
    - [x] Create the `User.java` entity class as per the schema.
    - [x] Create the `Couple.java` entity class.
    - [x] Create the `QuestionCategory.java` entity class.
    - [x] Create the `Question.java` entity class.
    - [x] Create the `GameSession.java` entity class.
    - [x] Create the `GameAnswer.java` entity class.
    - [x] Annotate all classes correctly with `@Entity`, `@Table`, `@Id`, relationship annotations (`@ManyToOne`, etc.), and column definitions.
- [x] **Repository Layer:**
    - [x] Create the `com.onlyyours.repository` package.
    - [x] Create `UserRepository.java` interface extending `JpaRepository<User, UUID>`.
    - [x] Create `CoupleRepository.java` interface extending `JpaRepository<Couple, UUID>`.
    - [x] Create `QuestionRepository.java` interface extending `JpaRepository<Question, Integer>`.
    - [x] Create interfaces for all other entities.
- [x] **Architectural Foundation:**
    - [x] Create the initial package structure: `controller`, `service`, `repository`, `model`, `config`, `security`, `dto`.
- [x] **Database Migration Setup (Flyway):**
    - [x] Flyway is included as a dependency.
    - [x] Create the `src/main/resources/db/migration` directory structure.
    - [x] Create the first migration script, e.g., `V1__Initial_Schema.sql`. This script will contain the Data Definition Language (DDL) to create all the tables (`users`, `couples`, `question_categories`, etc.) as defined in the PRD.
- [x] **Initial Security Configuration:**
    - [x] Create `SecurityConfig.java` in the `config` or `security` package.
    - [x] Define a `SecurityFilterChain` bean.
    - [x] In the filter chain, disable CSRF (`csrf -> csrf.disable()`).
    - [x] Set session management to `STATELESS`.

### Frontend Technical Tasks
- [x] **Project Initialization:**
    - [x] Initialize a new React Native project: `npx react-native init OnlyYoursApp`.
- [x] **Project Structure:**
    - [x] Create a `src` directory.
    - [x] Inside `src`, create subdirectories: `screens`, `components`, `services`, `navigation`, `state`, `assets`.
- [x] **Core Dependencies Installation:**
    - [x] Install navigation: `npm install @react-navigation/native @react-navigation/stack`.
    - [x] Install native helpers: `npm install react-native-screens react-native-safe-area-context`.
    - [x] Install HTTP client: `npm install axios`.
    - [x] Install secure storage: `npm install @react-native-async-storage/async-storage`.
    - [x] Install Google Sign-In: `npm install @react-native-google-signin/google-signin`.
- [x] **Navigation Setup:**
    - [x] Create `AppNavigator.js` in the `navigation` directory.
    - [x] Set up a `StackNavigator` with initial placeholder routes for `SignIn` and a `MainApp` stack.
- [x] **Global State (Authentication):**
    - [x] Create `AuthContext.js` in the `state` directory.
    - [x] The context should provide `isLoggedIn` status, `user` data, and placeholder functions `login()` and `logout()`.
    - [x] Wrap the `AppNavigator` in the `AuthProvider` in your main `App.js` file.

### Shared / DevOps Tasks
- [x] **Google Cloud Project Setup:**
    - [x] Create a new project in the Google Cloud Console.
    - [x] Configure the OAuth 2.0 consent screen with app details.
- [x] **OAuth Credentials Generation:**
    - [x] Create an "Android" type OAuth 2.0 Client ID. Note the client ID.
    - [x] Create a "Web application" type OAuth 2.0 Client ID. Note the Web Client ID and securely store the secret.
- [x] **Version Control:**
    - [x] Initialize a Git repository in the project root.
    - [x] Create a `.gitignore` file appropriate for a Java/Spring and React Native project.
    - [x] Establish a branching strategy (e.g., `main`, `develop`, `feature/*`).

---

## Sprint 1: Authentication & User Onboarding (Week 2)

**Goal:** Implement the complete, end-to-end Google Sign-In flow, allowing a user to authenticate with their Google account and receive an application-specific JWT from the backend.

### Backend Technical Tasks
- [x] **Dependencies:**
    - [x] Add `com.google.api-client:google-api-client` to `build.gradle` for Google ID token verification.
- [x] **Data Transfer Objects (DTOs):**
    - [x] Create `GoogleSignInRequestDto.java` to map the incoming `idToken`.
    - [x] Create `AuthResponseDto.java` to structure the response containing the application JWT.
- [x] **JWT Service:**
    - [x] Implement `JwtService.java`.
    - [x] Method to generate a JWT from user details.
    - [x] Method to validate an incoming JWT.
    - [x] Method to extract user ID/claims from a JWT.
    - [x] Store the JWT secret key securely in `application.properties` (to be moved to env vars later).
- [x] **Authentication Service:**
    - [x] Implement `AuthService.java`.
    - [x] Create `authenticateGoogleUser(String googleIdToken)` method.
        - [x] Use `GoogleIdTokenVerifier` to validate the token against Google's servers.
        - [x] On success, extract `sub` (Google ID), `email`, and `name`.
        - [x] Query `UserRepository` via `findByGoogleUserId`.
        - [x] If user does not exist, create a new `User` entity and save it.
        - [x] If user exists, update their details if necessary.
        - [x] Call `JwtService` to generate an application JWT for the user.
- [x] **Authentication Controller:**
    - [x] Implement `AuthController.java`.
    - [x] Create a `POST /api/auth/google/signin` endpoint.
    - [x] This endpoint should be publicly accessible.
    - [x] It calls the `AuthService` and returns the `AuthResponseDto` with a 200 OK status.
- [x] **Security Configuration Update:**
    - [x] In `SecurityConfig.java`, permit all requests to `/api/auth/**`.
    - [x] Secure all other endpoints by requiring authentication (`.anyRequest().authenticated()`).
    - [x] Implement `JwtAuthFilter.java` extending `OncePerRequestFilter`.
    - [x] This filter should read the `Authorization: Bearer <token>` header, validate the JWT using `JwtService`, and set the `Authentication` in the `SecurityContextHolder`.
    - [x] Add the `JwtAuthFilter` to the security filter chain before the standard `UsernamePasswordAuthenticationFilter`.

### Frontend Technical Tasks
- [x] **Google Sign-In Configuration:**
    - [x] In the app's entry point (e.g., `App.js`), call `GoogleSignin.configure()` with the `webClientId` obtained from Google Cloud.
- [x] **Sign-In Screen Implementation (`SignInScreen.js`):**
    - [x] Create a "Sign in with Google" button.
    - [x] The `onPress` handler should be an `async` function.
    - [x] Inside a `try/catch` block:
        - [x] Call `await GoogleSignin.signIn()`.
        - [x] From the result, extract the `idToken`.
        - [x] Use `axios` to make a `POST` request to the backend's `/api/auth/google/signin` endpoint with the `idToken`.
        - [x] On a successful response (200 OK), retrieve the application JWT from the response body.
        - [x] Securely store the JWT using `@react-native-async-storage/async-storage`.
        - [x] Call the `login()` function from `AuthContext` with the user data and token.
- [x] **Conditional Navigation:**
    - [x] In `AppNavigator.js`, use the `isLoggedIn` state from `AuthContext`.
    - [x] If `isLoggedIn` is true, render the main app stack.
    - [x] If `isLoggedIn` is false, render the `SignInScreen`.
- [x] **Authenticated API Service:**
    - [x] Create an `axios` instance that automatically includes the JWT in the `Authorization` header for all subsequent requests.

---

## Sprint 2: Core Profile & Couple Linking (Week 3)

**Goal:** Enable users to view their basic profile and establish a permanent, two-way link with their partner's account using a unique, time-limited code.

### Backend Technical Tasks
- [x] **DTOs:**
    - [x] Create `UserDto.java` and `CoupleDto.java` to safely expose entity data to the client.
- [x] **User Profile Endpoint:**
    - [x] Implement `UserController.java`.
    - [x] Create a secured `GET /api/user/me` endpoint.
    - [x] Use the `Authentication` principal from Spring Security to get the current user's ID.
    - [x] Fetch the full user object from the repository and return it as a `UserDto`.
- [x] **Couple Linking Service (`CoupleService.java`):**
    - [x] Implement `generateLinkCode(UUID userId)`. This should create a new `Couple` entity with `user1_id` set, generate a random 6-8 character alphanumeric string for `link_code`, and save it.
    - [x] Implement `redeemLinkCode(UUID userId, String code)`. This will:
        - [x] Find a `Couple` by `link_code`.
        - [x] Validate that the code exists and has not been used (`user2_id` is null).
        - [x] Validate that the redeemer (`userId`) is not the same as `user1_id`.
        - [x] If valid, set `user2_id` to the current user's ID, nullify the `link_code`, and save the updated `Couple` entity.
- [x] **Couple Linking Controller (`CoupleController.java`):**
    - [x] Create a secured `POST /api/couple/generate-code` endpoint that calls the service and returns the code.
    - [x] Create a secured `POST /api/couple/link` endpoint that accepts the code in a request body and calls the redeem service.
    - [x] Create a secured `GET /api/couple` endpoint to fetch the details of the couple link if it exists.

### Frontend Technical Tasks
- [x] **Profile Screen (`ProfileScreen.js`):**
    - [x] On component mount (`useEffect`), make an authenticated `GET` request to `/api/user/me`.
    - [x] Display the user's name and email.
    - [x] Include a "Logout" button that clears `AsyncStorage` and calls the `logout()` function from `AuthContext`.
- [x] **Dashboard Screen (`DashboardScreen.js`):**
    - [x] On component focus, call `/api/couple`.
    - [x] If the response is successful (200 OK), display "You are connected with [Partner's Name]".
    - [x] If the response is a 404 Not Found, display a "Link with Partner" button that navigates to the `PartnerLinkScreen`.
- [x] **Partner Linking Screen (`PartnerLinkScreen.js`):**
    - [x] Create a UI with two sections: "Get a Code" and "Enter a Code".
    - [x] The "Get a Code" section has a button that calls `POST /api/couple/generate-code` and displays the returned code.
    - [x] Add a "Share" button that uses React Native's `Share` API to share the code.
    - [x] The "Enter a Code" section has a `TextInput` for the code and a "Connect" button that calls `POST /api/couple/link`.
    - [x] On a successful connection, navigate the user back to the dashboard, which re-fetches and shows the linked status.

Implementation details:
- DTOs added under `backend/src/main/java/com/onlyyours/dto/` to decouple API responses from entities.
- `UserController` maps `Principal.getName()` (email) to `User` and returns `UserDto`.
- `CoupleService` handles code generation, redemption, and lookup; `CoupleRepository` extended with `findByLinkCode` and `findByUser1_IdOrUser2_Id`.
- `CoupleController` exposes generate/link/get endpoints secured by JWT.

Changes made:
- Added screens under `OnlyYoursApp/src/screens/` and wired routes in `OnlyYoursApp/src/navigation/AppNavigator.js`.
- Updated `OnlyYoursApp/src/state/AuthContext.js` to clear `userToken` on logout.
- Deprecated `MainApp` placeholder in favor of `Dashboard`, `Profile`, and `PartnerLink`.

---

## Sprint 3: Game Setup & Real-time Foundation (Week 4)

**Goal:** Build the pre-game user flow (category selection) and establish the fundamental WebSocket infrastructure for real-time communication.

### Backend Technical Tasks
- [x] **Database Seeding (via Flyway):**
    - [x] Create a new Flyway migration script `V2__Seed_Initial_Data.sql` in `src/main/resources/db/migration`.
    - [x] Added `INSERT` statements to populate `question_categories` and sample `questions` per category.
    - [x] Post-startup fix: align `Question` entity column names to snake_case and set `spring.jpa.hibernate.ddl-auto=validate` to avoid Hibernate creating mismatched columns; add conditional constraint drops in `V2` for legacy `optiona`...`optiond` columns.
- [x] **Content Endpoint:**
    - [x] Implemented `ContentController.java`.
    - [x] Created `GET /api/content/categories` returning a list of `CategoryDto`s.
- [x] **WebSocket Configuration (`WebSocketConfig.java`):**
    - [x] Annotated with `@Configuration` and `@EnableWebSocketMessageBroker`.
    - [x] Implemented `WebSocketMessageBrokerConfigurer` with `/ws` STOMP endpoint (SockJS fallback).
    - [x] Enabled simple broker with `/topic` and `/user`; set app prefix `/app`.
- [x] **WebSocket Security:**
    - [x] Added `WebSocketSecurityConfig` with an inbound `ChannelInterceptor`.
    - [x] Intercepts `CONNECT`, extracts `Authorization` header, validates JWT via `JwtService`, sets authenticated user on the session; rejects invalid tokens.

### Frontend Technical Tasks
- [x] **WebSocket Libraries:**
    - [x] Installed STOMP and SockJS clients in app dependencies.
- [x] **WebSocket Service (`WebSocketService.js`):**
    - [x] Created a singleton service managing connection lifecycle, headers with `Authorization`, subscriptions, and publish.
- [x] **Category Selection Screen (`CategorySelectionScreen.js`):**
    - [x] Fetches categories from `/api/content/categories` on mount and displays as a list.
    - [x] Shows a confirmation `Alert` when a sensitive category is tapped.
- [x] **WebSocket Integration:**
    - [x] After login and on silent auth, `AuthContext` calls `WebSocketService.connect()`; service auto-retries and disconnects on logout.
- [x] **Metro Startup Maintenance:**
    - [x] Handle cases where the Metro bundler fails due to corrupted `node_modules` dependencies by reinstalling packages to restore missing modules (e.g., `debug/src/index.js`).
- [x] **Android Toolchain Baseline:**
    - [x] Keep Android Gradle Plugin at `7.4.2`, Gradle wrapper at `7.6.1`, and compile/target SDK 33 to stay aligned with React Native 0.72 until a coordinated upgrade.

**Note:** Sprint 3 has been completed. See [`SPRINT_3_IMPLEMENTATION.md`](SPRINT_3_IMPLEMENTATION.md) for detailed implementation report.

---

## React Native Upgrade (Completed - Feb 2026)

**Goal:** Modernize the React Native stack to version 0.75.4 with New Architecture for improved performance, stability, and future compatibility.

### Status: ✅ COMPLETE

The React Native upgrade has been successfully completed:
- ✅ React Native upgraded: 0.72.0 → 0.75.4
- ✅ Android toolchain modernized: AGP 7.4.2 → 8.7.3, Gradle 7.6.1 → 8.10
- ✅ New Architecture enabled (Fabric + TurboModules)
- ✅ Hermes engine optimized
- ✅ Yarn 4.10.3 adopted as package manager
- ✅ All dependencies updated to compatible versions

**Comprehensive Documentation:** See [`RN_UPGRADE_PRD.md`](RN_UPGRADE_PRD.md) for complete upgrade specification, testing strategy, and rollback plan.

**Remaining Validation Tasks:**
- Performance benchmarking vs RN 0.72 baseline
- iOS physical device testing
- Comprehensive E2E testing
- Documentation finalization

---

## Sprint 4: Core Gameplay - Round 1 (Answering) (Week 5)

**Status:** ✅ COMPLETE - 54 automated tests passing, manual E2E testing pending

**Comprehensive Documentation:** See [`SPRINT_4_PRD.md`](SPRINT_4_PRD.md) for complete technical specification, user stories, API contracts, and testing strategy.

**Goal:** Implement the first round of the core gameplay loop where both players synchronously answer a series of questions about themselves.

**Implementation Progress**: As of Feb 21, 2026
- ✅ Backend: All DTOs, entities, repositories, services, and controllers complete
- ✅ Frontend: All screens, contexts, and navigation complete
- ✅ Testing: 54 automated tests passing (unit + integration + WebSocket + performance)
- ✅ Bug fixes: Fixed entity/repository mismatches, WebSocket security, JWT filter error handling
- ✅ Performance profiling: WebSocket latency ~56ms avg, full game 2.4s
- ⏸️ Manual E2E Testing: Pending (requires 2 devices)

### Backend Technical Tasks
- [x] **Game DTOs (WebSocket Payloads):**
    - [x] Create POJOs for WebSocket messages: `GameInvitationDto.java`, `QuestionPayloadDto.java`, `AnswerRequestDto.java`, `GameStatusDto.java`, `InvitationResponseDto.java`.
    - **Implementation**: All DTOs created with comprehensive documentation in `backend/src/main/java/com/onlyyours/dto/`
- [x] **GameSession Entity Updates:**
    - [x] Added fields: `categoryId`, `questionIds`, `currentQuestionIndex`, `createdAt`, `startedAt`, `completedAt`
    - [x] Added `DECLINED` status to enum
    - [x] Created migration script `V3__Add_Game_Session_Fields.sql`
    - **Implementation**: `backend/src/main/java/com/onlyyours/model/GameSession.java`
- [x] **Repository Methods:**
    - [x] Added custom query methods to `GameSessionRepository`, `GameAnswerRepository`, `QuestionRepository`
    - **Implementation**: Enhanced all repository interfaces with game-specific queries
- [x] **Game Service (`GameService.java`):**
    - [x] Implemented `createInvitation()`: Creates session, validates couple and category
    - [x] Implemented `acceptInvitation()`: Loads questions, starts ROUND1, returns first question
    - [x] Implemented `declineInvitation()`: Updates status to DECLINED
    - [x] Implemented `submitAnswer()`: Records answer, checks if both answered, advances to next question
    - [x] Implemented `areBothPlayersAnswered()`: Utility method
    - [x] Implemented `getGameSession()`: Session retrieval
    - **Implementation**: 350+ lines with comprehensive error handling in `backend/src/main/java/com/onlyyours/service/GameService.java`
- [x] **Game WebSocket Controller (`GameController.java`):**
    - [x] `@MessageMapping("/game.invite")`: Creates invitation and sends to partner's private queue
    - [x] `@MessageMapping("/game.accept")`: Accepts invitation, starts game, broadcasts first question
    - [x] `@MessageMapping("/game.decline")`: Declines invitation, notifies inviter
    - [x] `@MessageMapping("/game.answer")`: Receives answer, broadcasts next question or Round 1 complete status
    - [x] Error handling with private error queue
    - **Implementation**: 250+ lines in `backend/src/main/java/com/onlyyours/controller/GameController.java`

### Frontend Technical Tasks
- [x] **Global Game State (`GameContext.js`):**
    - [x] Created context managing `activeSession`, `currentQuestion`, `myAnswer`, `waitingForPartner`, `gameStatus`
    - [x] Implemented `startGame()`, `submitAnswer()`, `endGame()` methods
    - [x] WebSocket subscription to `/topic/game/{sessionId}` with automatic question updates
    - [x] Integrated with `App.js` provider hierarchy
    - **Implementation**: `OnlyYoursApp/src/state/GameContext.js`
- [x] **Game Screen Implementation (`GameScreen.js`):**
    - [x] Progress indicator (Question X of Y) with animated progress bar
    - [x] Question display with centered text and card styling
    - [x] Four option buttons (A, B, C, D) with letter badges and full option text
    - [x] Submit button (disabled until option selected)
    - [x] "Waiting for partner..." indicator with spinner after submission
    - [x] Auto-advance to next question when both players answer
    - [x] Round 1 complete alert and navigation back to dashboard
    - **Implementation**: 300+ lines with complete styling in `OnlyYoursApp/src/screens/GameScreen.js`
- [x] **Dashboard Screen Updates:**
    - [x] Added "Start New Game" button that checks couple status
    - [x] Validates partner link before navigating to category selection
    - [x] Improved UI with modern styling and proper user feedback
    - **Implementation**: Enhanced `OnlyYoursApp/src/screens/DashboardScreen.js`
- [x] **Category Selection Screen Updates:**
    - [x] Sends `/app/game.invite` WebSocket message on category selection
    - [x] Shows confirmation dialog for sensitive categories
    - [x] Displays "Invitation sent, waiting..." alert with cancel option
    - [x] Improved card-based UI with sensitive category highlighting
    - **Implementation**: Updated `OnlyYoursApp/src/screens/CategorySelectionScreen.js`
- [x] **Invitation Handling (`AuthContext.js`):**
    - [x] Subscribed to `/user/queue/game-events` after WebSocket connection
    - [x] Shows Alert with partner name, category info, and Accept/Decline buttons
    - [x] On Accept: sends `/app/game.accept`, starts game in GameContext, navigates to GameScreen
    - [x] On Decline: sends `/app/game.decline`, notifies inviter
    - [x] Handles invitation declined status messages
    - [x] Wired navigation and game context refs for cross-context communication
    - **Implementation**: Enhanced `OnlyYoursApp/src/state/AuthContext.js`
- [x] **Navigation Updates (`AppNavigator.js`):**
    - [x] Added Game screen to stack navigator
    - [x] Configured with `headerLeft: null` and `gestureEnabled: false` to prevent accidental exit
    - [x] Registered navigation ref with AuthContext for invitation handling
    - **Implementation**: Updated `OnlyYoursApp/src/navigation/AppNavigator.js`

### Testing Tasks
- [x] **Backend Unit Tests (54 total, all passing):**
    - [x] `JwtServiceTest.java` (9 tests): Token generation, validation, expiry, extraction, different users
    - [x] `CoupleServiceTest.java` (9 tests): Generate code, redeem, self-link, already-used, invalid code, find couple
    - [x] `GameServiceTest.java` (14 tests): Invitation CRUD, answer submission (first/both/duplicate/invalid), round completion, state transitions
    - [x] `RestControllerTest.java` (12 tests): MockMvc tests for UserController, CoupleController, ContentController, SecurityFilter
    - [x] `GameControllerWebSocketTest.java` (6 tests): Full WebSocket flow - connect, invite, accept, decline, answer
    - [x] `WebSocketPerformanceTest.java` (3 tests): Connection latency, invitation round-trip, full 8-question game timing
    - [x] `OnlyYoursBackendApplicationTests.java` (1 test): Context load
- [x] **Bug Fixes Discovered During Testing:**
    - [x] Fixed `javax.validation` → `jakarta.validation` (Spring Boot 3.x compatibility)
    - [x] Fixed `UUID categoryId` → `Integer categoryId` type mismatch throughout service/controller/DTO chain
    - [x] Fixed `GameAnswer` entity relationship setters (`setQuestion()`/`setUser()` instead of non-existent `setQuestionId()`/`setUserId()`)
    - [x] Fixed `GameAnswerRepository` method naming (`Question_Id`/`User_Id` for JPA relationship traversal)
    - [x] Fixed `QuestionRepository` JPQL query (`q.category.id` instead of `q.categoryId`)
    - [x] Fixed `JwtAuthFilter` to catch and handle malformed token exceptions (was throwing 500)
    - [x] Fixed `WebSocketSecurityConfig` principal propagation (STOMP CONNECT user not being set on session)
    - [x] Fixed `WebSocketConfig` broker destinations (added `/queue` for user-specific message delivery)
    - [x] Fixed `SecurityConfig` to permit `/ws/**` endpoint for WebSocket handshake
    - [x] Fixed `@GeneratedValue` conflicts with manual UUID setting in tests and service
    - [x] Added `@Builder.Default` for Lombok DTO fields with default values
    - [x] Added `spring-boot-starter-validation` dependency for Jakarta validation annotations
    - [x] Fixed H2 test config: PostgreSQL compatibility mode, proper JWT secret length
- [x] **Performance Profiling Results:**
    - [x] STOMP connection time: **6ms** ✅
    - [x] Invitation round-trip latency: **58ms** ✅ (target: <200ms)
    - [x] Average answer submission latency: **56.3ms** ✅ (target: <200ms)
    - [x] Full 8-question game completion: **2.4 seconds** ✅
    - [x] JVM memory usage during gameplay: **58MB** ✅
- [x] **Frontend Unit Tests (14 tests):**
    - [x] `GameContext.test.js` (6 tests): Provider enforcement, game lifecycle, WebSocket integration
    - [x] `GameScreen.test.js` (8 tests): Rendering, option selection, submit states, waiting indicator
- [ ] **E2E Manual Testing (pending - requires 2 physical devices):**
    - [ ] Test Case 1: Happy path - complete 8-question game with two devices
    - [ ] Test Case 2: Invitation declined flow
    - [ ] Test Case 3: Connection loss during game
    - [ ] Test Case 4: App backgrounding
    - [ ] Test Case 5: Simultaneous answer submission

### Files Created/Modified (Sprint 4)

**Backend - New Files:**
- `backend/src/main/java/com/onlyyours/dto/GameInvitationDto.java`
- `backend/src/main/java/com/onlyyours/dto/QuestionPayloadDto.java`
- `backend/src/main/java/com/onlyyours/dto/AnswerRequestDto.java`
- `backend/src/main/java/com/onlyyours/dto/GameStatusDto.java`
- `backend/src/main/java/com/onlyyours/dto/InvitationResponseDto.java`
- `backend/src/main/java/com/onlyyours/service/GameService.java`
- `backend/src/main/java/com/onlyyours/controller/GameController.java`
- `backend/src/main/resources/db/migration/V3__Add_Game_Session_Fields.sql`

**Backend - Modified Files:**
- `backend/src/main/java/com/onlyyours/model/GameSession.java`
- `backend/src/main/java/com/onlyyours/repository/GameSessionRepository.java`
- `backend/src/main/java/com/onlyyours/repository/GameAnswerRepository.java` (fixed method naming for JPA relationships)
- `backend/src/main/java/com/onlyyours/repository/QuestionRepository.java` (fixed method naming for JPA relationships)
- `backend/src/main/java/com/onlyyours/security/JwtAuthFilter.java` (added exception handling for malformed tokens)
- `backend/src/main/java/com/onlyyours/security/SecurityConfig.java` (permitted `/ws/**` endpoint)
- `backend/src/main/java/com/onlyyours/config/WebSocketConfig.java` (added `/queue` to broker destinations)
- `backend/src/main/java/com/onlyyours/config/WebSocketSecurityConfig.java` (fixed principal propagation)
- `backend/build.gradle` (added `spring-boot-starter-validation`)
- `backend/src/test/resources/application.properties` (PostgreSQL mode, proper JWT secret)

**Backend - Test Files (New):**
- `backend/src/test/java/com/onlyyours/service/JwtServiceTest.java` (9 tests)
- `backend/src/test/java/com/onlyyours/service/CoupleServiceTest.java` (9 tests)
- `backend/src/test/java/com/onlyyours/service/GameServiceTest.java` (14 tests - rewritten)
- `backend/src/test/java/com/onlyyours/controller/RestControllerTest.java` (12 tests)
- `backend/src/test/java/com/onlyyours/controller/GameControllerWebSocketTest.java` (6 tests)
- `backend/src/test/java/com/onlyyours/controller/WebSocketPerformanceTest.java` (3 tests)

**Frontend - New Files:**
- `OnlyYoursApp/src/state/GameContext.js`
- `OnlyYoursApp/src/screens/GameScreen.js`

**Frontend - Modified Files:**
- `OnlyYoursApp/App.js` (added GameProvider)
- `OnlyYoursApp/src/state/AuthContext.js` (invitation handling)
- `OnlyYoursApp/src/screens/DashboardScreen.js` (Start Game button)
- `OnlyYoursApp/src/screens/CategorySelectionScreen.js` (WebSocket invitation)
- `OnlyYoursApp/src/navigation/AppNavigator.js` (Game screen route)

---

## Sprint 5: Core Gameplay - Round 2 (Guessing) & Results (Week 6)

**Status:** ✅ COMPLETE - 70 backend tests, 21 frontend tests, 0 failures

**Comprehensive Documentation:** See [`SPRINT_5_PLAN.md`](SPRINT_5_PLAN.md) for complete technical specification and implementation checklist.

**Goal:** Complete the core gameplay loop by implementing the guessing round (Round 2) and displaying the final scores.

**Implementation Progress**: As of Feb 21, 2026
- ✅ Backend: 3 new DTOs, 6 new service methods, new WebSocket endpoint, V4 migration
- ✅ Frontend: Round 2 UI, transition screen, guess feedback overlay, ResultsScreen
- ✅ Testing: 70 backend tests + 21 frontend tests, all passing
- ✅ Full game lifecycle tested end-to-end (invitation → Round 1 → Round 2 → scoring)

### Backend Technical Tasks
- [x] **Game State Transition:**
    - [x] In `GameService`, after the last question of Round 1 is answered by both players, update the game status to `ROUND2`.
    - [x] Broadcast the first question again via `getFirstRound2Question()`, with payload indicating it's the guessing round (`round="ROUND2"`).
- [x] **Guessing Logic:**
    - [x] `@MessageMapping("/game.guess")`: Receives a guess from a player via `GuessRequestDto`.
    - [x] Persist the guess to the `round2_guess` column in the `game_answers` table (with dedup protection).
    - [x] Fetch the partner's actual `round1_answer` for that same question.
    - [x] Send a private `GuessResultDto` back to the guessing player with the result (correct/incorrect, partnerAnswer, correctCount).
    - [x] Check if both players have guessed the current question via `areBothPlayersGuessed()`. If so, broadcast the next question for guessing.
- [x] **Scoring and Completion:**
    - [x] After the last guess of Round 2, trigger `calculateAndCompleteGame()` scoring calculation.
    - [x] In `GameService`, query the `game_answers` table for the session, calculate scores for each player (correct guesses of partner's answers).
    - [x] Update the `game_sessions` status to `COMPLETED` with `completedAt` timestamp and `player1Score`/`player2Score`.
    - [x] Broadcast a `GameResultsDto` (with both players' scores, names, and tier-based message) to the game topic.

### Frontend Technical Tasks
- [x] **Game Screen Update for Round 2:**
    - [x] When a question payload for Round 2 arrives, update the UI prompt to "How did your partner answer?".
    - [x] Listen for the private guess feedback message on `/user/queue/game-events`.
    - [x] On receipt, briefly display the result ("Correct!"/"Not quite!") with partner's actual answer for 2.5 seconds before the next question loads.
    - [x] Show running correct count in Round 2 badge.
    - [x] Show transition screen between Round 1 and Round 2 with loading animation.
- [x] **Results Screen (`ResultsScreen.js`):**
    - [x] When the final `GameResultsDto` arrives on the game topic, navigate to Results screen.
    - [x] Display the final scores for both players with animated score counters in celebratory format.
    - [x] Include tier-based result message (Soulmates/Great connection/Good start/Lots to discover).
    - [x] Include a "Play Again" button that navigates to the `CategorySelectionScreen`.
    - [x] Include a "Back to Dashboard" button.

### Files Created/Modified (Sprint 5)

**Backend - New Files:**
- `backend/src/main/java/com/onlyyours/dto/GuessRequestDto.java`
- `backend/src/main/java/com/onlyyours/dto/GuessResultDto.java`
- `backend/src/main/java/com/onlyyours/dto/GameResultsDto.java`
- `backend/src/main/resources/db/migration/V4__Seed_Additional_Questions.sql`

**Backend - Modified Files:**
- `backend/src/main/java/com/onlyyours/service/GameService.java` (+6 methods, modified buildQuestionPayload)
- `backend/src/main/java/com/onlyyours/controller/GameController.java` (+handleGuess, modified handleAnswer)
- `backend/src/main/java/com/onlyyours/repository/GameAnswerRepository.java` (+2 query methods)
- `backend/src/test/java/com/onlyyours/service/GameServiceTest.java` (+16 test cases → 30 total)

**Frontend - New Files:**
- `OnlyYoursApp/src/screens/ResultsScreen.js`
- `OnlyYoursApp/src/screens/__tests__/ResultsScreen.test.js` (8 tests)
- `OnlyYoursApp/jest.config.js` (updated for test infrastructure)
- `OnlyYoursApp/jest.setup.js`
- `OnlyYoursApp/jest/react-native-mock.js`

**Frontend - Modified Files:**
- `OnlyYoursApp/src/state/GameContext.js` (+5 state vars, +2 methods, handles GUESS_RESULT/GAME_RESULTS)
- `OnlyYoursApp/src/screens/GameScreen.js` (Round 2 UI, transition, feedback overlay)
- `OnlyYoursApp/src/navigation/AppNavigator.js` (+Results route)
- `OnlyYoursApp/src/state/__tests__/GameContext.test.js` (11 tests, updated for Sprint 5)
- `OnlyYoursApp/src/screens/__tests__/GameScreen.test.js` (2 tests, updated for Sprint 5)

---

## Sprint 6: Testing, Polish & MVP Release Prep (Week 7)

**Status:** ✅ COMPLETE - 96 backend tests, 21 frontend tests, 0 failures

**Comprehensive Documentation:** See [`SPRINT_6_IMPLEMENTATION.md`](SPRINT_6_IMPLEMENTATION.md) for complete technical specification and implementation report.

**Goal:** Conduct comprehensive end-to-end testing, refine the UI/UX, and prepare the application for a production release.

**Implementation Progress**: As of Feb 21, 2026
- ✅ Backend: 26 new integration tests, Actuator, structured logging, bug fix in CoupleController
- ✅ Frontend: LoadingSpinner, EmptyState, ReconnectionBanner, AppErrorBoundary, global Axios interceptor
- ✅ Configuration: Environment variable externalization, application-prod.properties, .env.example
- ✅ Containerization: Multi-stage Dockerfile, .dockerignore, docker-compose.yml
- ✅ Testing: 96 backend + 21 frontend tests, all passing
- ⏸️ Infrastructure: Cloud deployment, HTTPS — requires live cloud setup (documented, out of scope)

### Backend Technical Tasks
- [x] **Integration Testing:**
    - [x] Use `@SpringBootTest` to write integration tests for the authentication flow.
    - [x] Write tests for the REST controllers (`UserController`, `CoupleController`).
    - [x] Use a test-specific profile to connect to an in-memory database (like H2) or a dedicated test PostgreSQL instance.
    - **Implementation**: 3 new test classes in `backend/src/test/java/com/onlyyours/integration/` — `BaseIntegrationTest`, `AuthFlowIntegrationTest` (11 tests), `CoupleFlowIntegrationTest` (10 tests), `ContentIntegrationTest` (5 tests)
    - **Bug Found & Fixed**: `CoupleController.link()` was not catching `IllegalArgumentException` from service layer (caused 500 for invalid/self-link codes); now returns proper 400.
- [x] **Logging & Monitoring:**
    - [x] Review all service methods and ensure appropriate `slf4j` logging is in place for key events and errors.
    - [x] Enable Spring Boot Actuator and expose the `/health` and `/metrics` endpoints for production monitoring.
    - **Implementation**: Added `@Slf4j` to `AuthService`, `CoupleService`; added `spring-boot-starter-actuator`; configured `/actuator/health,metrics,info`; updated `SecurityConfig` to permit `/actuator/health` publicly.
- [x] **Configuration & Security Hardening:**
    - [x] Move all secrets (JWT secret, Google client secret, database password) from `application.properties` to be read from environment variables.
    - **Implementation**: Updated `application.properties` to use `${ENV_VAR:default}` syntax; created `.env.example` and `application-prod.properties`.
- [x] **Containerization:**
    - [x] Create a `Dockerfile` in the project root to build a container image of the Spring Boot application.
    - [x] Test the Docker build locally.
    - **Implementation**: Multi-stage `backend/Dockerfile` (builder: JDK Alpine, runtime: JRE Alpine, non-root user); `backend/.dockerignore`; `docker-compose.yml` at project root.

### Frontend Technical Tasks
- [x] **UI/UX Polish:**
    - [x] Add loading spinners for all network requests.
    - [x] Create and implement empty state components (e.g., for the category list if it fails to load).
    - [x] Ensure smooth screen transitions and animations.
    - [x] Review and refine all copy and user-facing text.
    - **Implementation**: `LoadingSpinner.js`, `EmptyState.js` reusable components; updated `ProfileScreen`, `CategorySelectionScreen` with loading/error/empty states.
- [x] **Error Handling:**
    - [x] Implement global error handling for `axios` requests to show user-friendly alerts.
    - [x] Add robust error handling for WebSocket connection issues (e.g., display a "reconnecting" banner).
    - **Implementation**: Global response interceptor in `api.js` (401 → logout, 5xx → alert, network error → alert); `ReconnectionBanner.js` with slide animation; `WebSocketService.js` connection state tracking; `AppErrorBoundary.js` class component.
- [ ] **End-to-End Manual Testing:**
    - [ ] With two physical Android devices, test the entire user journey:
        - [ ] Sign-in / Sign-out
        - [ ] Linking accounts
        - [ ] Unlinking (if implemented)
        - [ ] Playing a full game from start to finish
        - [ ] Handling interruptions (app backgrounding, network loss)
- [ ] **Release Build Preparation:**
    - [ ] Follow the React Native documentation to generate a signed APK for release on the Google Play Store.

### DevOps Tasks
- [ ] **Provision Production Infrastructure:**
    - [ ] Set up a production-grade PostgreSQL instance (e.g., AWS RDS, Google Cloud SQL).
    - [ ] Set up a container orchestration service or serverless platform (e.g., AWS ECS, Google Cloud Run) for the backend.
- [ ] **Deployment:**
    - [ ] Deploy the containerized backend application to the production environment.
- [ ] **HTTPS Configuration:**
    - [ ] Configure a load balancer or API gateway to terminate SSL/TLS and enforce HTTPS for all API traffic.

### Files Created/Modified (Sprint 6)

**Backend - New Files:**
- `backend/src/test/java/com/onlyyours/integration/BaseIntegrationTest.java`
- `backend/src/test/java/com/onlyyours/integration/AuthFlowIntegrationTest.java` (11 tests)
- `backend/src/test/java/com/onlyyours/integration/CoupleFlowIntegrationTest.java` (10 tests)
- `backend/src/test/java/com/onlyyours/integration/ContentIntegrationTest.java` (5 tests)
- `backend/Dockerfile`
- `backend/.dockerignore`
- `backend/src/main/resources/application-prod.properties`
- `docker-compose.yml`
- `.env.example`

**Backend - Modified Files:**
- `backend/build.gradle` (added `spring-boot-starter-actuator`)
- `backend/src/main/resources/application.properties` (env var externalization + Actuator config)
- `backend/src/main/java/com/onlyyours/security/SecurityConfig.java` (permit `/actuator/health`)
- `backend/src/main/java/com/onlyyours/service/AuthService.java` (added `@Slf4j` + structured logging)
- `backend/src/main/java/com/onlyyours/service/CoupleService.java` (added `@Slf4j` + structured logging)
- `backend/src/main/java/com/onlyyours/controller/CoupleController.java` (bug fix: catch IllegalArgumentException in link())

**Frontend - New Files:**
- `OnlyYoursApp/src/components/LoadingSpinner.js`
- `OnlyYoursApp/src/components/EmptyState.js`
- `OnlyYoursApp/src/components/ReconnectionBanner.js`
- `OnlyYoursApp/src/components/AppErrorBoundary.js`

**Frontend - Modified Files:**
- `OnlyYoursApp/src/services/api.js` (global Axios response interceptor + setLogoutHandler)
- `OnlyYoursApp/src/services/WebSocketService.js` (connection state tracking + onConnectionStateChange callback)
- `OnlyYoursApp/src/state/AuthContext.js` (wsConnectionState, setLogoutHandler wiring)
- `OnlyYoursApp/App.js` (AppErrorBoundary + AppShell + ReconnectionBanner)
- `OnlyYoursApp/src/screens/ProfileScreen.js` (LoadingSpinner, EmptyState, improved UI)
- `OnlyYoursApp/src/screens/CategorySelectionScreen.js` (LoadingSpinner, EmptyState, retry logic)
- `OnlyYoursApp/jest.setup.js` (global axios mock + AsyncStorage mock)

---

## Architectural Decisions and Frontend Direction

### Frontend Stack Decision (2025-10-10)
- [x] Documented frontend stack evaluation and decision to stay on React Native with a modernization plan. See [`FRONTEND_DECISION.md`](FRONTEND_DECISION.md) for details, rationale, and next steps.

### React Native Upgrade (2026-02)
- [x] Completed React Native upgrade to 0.75.4 with New Architecture. See [`RN_UPGRADE_PRD.md`](RN_UPGRADE_PRD.md) for complete implementation details, testing results, and validation tasks.

### Sprint Implementation Documentation
- [x] Sprint 1: Authentication & User Onboarding - See [`SPRINT_1_IMPLEMENTATION.md`](SPRINT_1_IMPLEMENTATION.md)
- [x] Sprint 2: Core Profile & Couple Linking - See [`SPRINT_2_IMPLEMENTATION.md`](SPRINT_2_IMPLEMENTATION.md)
- [x] Sprint 3: Game Setup & Real-time Foundation - See [`SPRINT_3_IMPLEMENTATION.md`](SPRINT_3_IMPLEMENTATION.md)
- [ ] Sprint 4: Core Gameplay - Round 1 (Answering) - See [`SPRINT_4_PRD.md`](SPRINT_4_PRD.md) for implementation specification

### Comprehensive Project Status
- [x] See [`PROJECT_STATUS.md`](PROJECT_STATUS.md) for the end-to-end implementation status document covering architecture, file inventory, API contracts, pending work, known issues, and roadmap.

### Deployment & Manual Testing Guides
- [x] GCP production deployment strategy and runbook draft: [`GCP_DEPLOYMENT_PLAN.md`](GCP_DEPLOYMENT_PLAN.md)
- [x] Two-device Android manual testing runbook for Sprint 6: [`MANUAL_TESTING_GUIDE_SPRINT6.md`](MANUAL_TESTING_GUIDE_SPRINT6.md)
- [x] Refined deployment decisions: release tags only, Cloud Run min instances=1, emulator optional gate, and no-USB test paths documented.
- [x] Expanded beginner-first local setup in manual guide: toolchain install checks, DB/backend/frontend startup sequence, Android Studio emulator setup, first-run smoke checklist, and troubleshooting.
- [x] Added deep hand-holding for Android Studio setup in manual guide: exact click paths, SDK Manager tabs, component verification, PATH setup, AVD creation details, and beginner pitfalls checklist.
- [x] Added migration feasibility analysis for Expo + email/password auth with checklist, effort estimates, risk matrix, and go/no-go framework: [`EXPO_EMAIL_AUTH_FEASIBILITY.md`](EXPO_EMAIL_AUTH_FEASIBILITY.md)
- [x] Added comprehensive two-phase auth migration PRD (Phase 1 email/password in RN CLI, Phase 2 Expo migration) with sectioned implementation checklists and stabilization gates: [`AUTH_MIGRATION_PRD.md`](AUTH_MIGRATION_PRD.md)
- [x] Expanded auth migration PRD with week-by-week sprint schedule, daily checkpoints, milestone gates, and file-by-file implementation sequencing for execution tracking.
- [x] Updated `MANUAL_TESTING_GUIDE_SPRINT6.md` in detail for email/password auth migration manual verification:
    - [x] Replaced Google Sign-In specific manual cases with auth migration matrix (signup/login/logout/forgot/reset/refresh/revocation).
    - [x] Added detailed preconditions, step-by-step execution, expected outcomes, and security-negative validations.
    - [x] Updated release gate + evidence expectations to include auth-critical path proof.
    - [x] Kept linking/game/resilience/UX manual suites aligned with auth-first flow.
- [x] Created deep-dive implementation sprint plan for auth migration with architecture rationale, per-phase checklists, and progress counters: [`AUTH_MIGRATION_SPRINT_PLAN.md`](AUTH_MIGRATION_SPRINT_PLAN.md)
- [x] Phase 1 implementation checkpoint completed for backend + frontend core auth migration:
    - [x] Backend: new schema migration `V5__Email_Auth_Foundation.sql`, user model evolution, token entities/repositories, and full auth API endpoint set.
    - [x] Frontend: migrated to email/password screens (`SignIn`, `SignUp`, `ForgotPassword`, `ResetPassword`) and dual-token refresh lifecycle in `AuthContext` + `api.js`.
    - [x] Testing: added auth-focused backend service/integration/security tests and frontend screen tests; full backend and frontend suites are green.
    - [ ] Remaining before Phase 1 closure: local non-test PostgreSQL migration validation, docs finalization, and manual sign-off matrix (including physical Android device pass).
- [x] Fixed RN 0.75 Metro red-screen bundle failures encountered during emulator validation and documented recovery in Sprint 6 manual guide:
    - [x] Runtime bundling fix: forced Axios to browser-compatible entry in `OnlyYoursApp/src/services/api.js` (`axios/dist/browser/axios.cjs`) to avoid Node `crypto` resolution errors.
    - [x] Babel pipeline fix: switched to `module:@react-native/babel-preset` in `OnlyYoursApp/babel.config.js` and removed legacy `.babelrc` to eliminate transform conflicts (`private methods` / `duplicate __self`).
    - [x] Stability verification: confirmed Metro serves Android bundle with HTTP 200 and app install/launch succeeds after rerun.
    - [x] Documentation update: expanded `MANUAL_TESTING_GUIDE_SPRINT6.md` troubleshooting with exact symptoms, root causes, and step-by-step repair commands.
- [x] Stabilized Android local run pipeline for Sprint 6 manual testing after auth migration dependency/tooling drift:
    - [x] Repaired broken Gradle wrapper bootstrap by restoring `OnlyYoursApp/android/gradle/wrapper/gradle-wrapper.jar` (fixes `org.gradle.wrapper.GradleWrapperMain` startup failure).
    - [x] Restored missing Android SDK ext config in `OnlyYoursApp/android/build.gradle` (`minSdkVersion`, `compileSdkVersion`, `targetSdkVersion`, `ndkVersion`) so app module can resolve build constants.
    - [x] Disabled New Architecture in `OnlyYoursApp/android/gradle.properties` for compatibility with the current dependency set during manual testing (`newArchEnabled=false`).
    - [x] Removed obsolete Google Sign-In native dependency and pinned `react-native-gesture-handler` to `2.20.0` to align with `react-native@0.75.4`.
    - [x] Removed legacy duplicate autolinking line from `OnlyYoursApp/android/app/build.gradle` and converted debug Flipper helper to a no-op stub to resolve Java compile-time integration mismatches.
    - [x] Verified full local flow with Java 17 and emulator install: `npx react-native run-android` now builds and launches successfully (post-uninstall fix for `INSTALL_FAILED_UPDATE_INCOMPATIBLE`).

- [x] Phase 2 Expo Managed Workflow Migration implemented (Feb 2026):
    - [x] Created `OnlyYoursExpo/` — fresh Expo SDK 54 managed project (React 19.1.0, RN 0.81.5) alongside `OnlyYoursApp/` (kept as fallback).
    - [x] Configured `OnlyYoursExpo/app.json`: name "Only Yours", slug "only-yours", android package `com.onlyyoursapp`, `newArchEnabled: false` for compatibility.
    - [x] Created `OnlyYoursExpo/eas.json`: development (debug APK via `assembleDebug`), preview (release APK), and production (AAB) build profiles.
    - [x] Installed all Expo SDK 54-compatible deps via `npx expo install`: `@react-navigation/native`, `@react-navigation/stack`, `react-native-gesture-handler`, `react-native-safe-area-context`, `react-native-screens`, `@react-native-async-storage/async-storage`. Added `axios` and `@stomp/stompjs` as pure-JS deps.
    - [x] Migrated all 27 `src/` JS files from `OnlyYoursApp/src` to `OnlyYoursExpo/src` — no changes needed except two service files.
    - [x] Fixed `OnlyYoursExpo/src/services/api.js`: reverted Axios import from `axios/dist/browser/axios.cjs` back to standard `import axios from 'axios'` (Expo Metro resolves correctly without the hack).
    - [x] Fixed `OnlyYoursExpo/src/services/WebSocketService.js`: removed `sockjs-client` import and `webSocketFactory` in favour of `brokerURL` pointing to `ws://host/ws-native` — Expo's native WebSocket connects directly without SockJS/DOM dependencies.
    - [x] Added `/ws-native` raw STOMP WebSocket endpoint to `backend/src/main/java/com/onlyyours/config/WebSocketConfig.java` (alongside existing SockJS `/ws` endpoint).
    - [x] Wrote `OnlyYoursExpo/App.js` root component: `GestureHandlerRootView` → `AuthProvider` → `AppShell` (reads `wsConnectionState`) → `GameProvider` → `AppNavigator` + `ReconnectionBanner`.
    - [x] Verified Metro bundle: `npx expo export --platform android` completes in ~10 s, 974 modules, 0 errors, 2.62 MB bundle (requires Node 24 — `.nvmrc` set to 24 in `OnlyYoursExpo/`).
    - [x] Installed `eas-cli@18.0.3` globally. EAS project config ready; first cloud build requires `eas login` then `eas build --platform android --profile preview` (see MANUAL_TESTING_GUIDE_SPRINT6.md).
    - [x] Applied Option A (Same Wi-Fi LAN) runtime backend configuration for Expo physical-device testing:
        - [x] Set `OnlyYoursExpo/src/services/api.js` `API_URL` to `http://192.168.1.101:8080/api`.
        - [x] Set `OnlyYoursExpo/src/state/AuthContext.js` `API_BASE` to `http://192.168.1.101:8080`.
        - [x] Verified backend LAN reachability from laptop using `curl http://192.168.1.101:8080/actuator/health` (`{\"status\":\"UP\"}`).
    - [x] Fixed backend JWT secret decoding bug causing signup/login 500s with error `Illegal base64 character: '_'`:
        - [x] Updated `backend/src/main/java/com/onlyyours/service/JwtService.java` to use `Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8))` for both signing and parsing.
        - [x] Replaced deprecated string-based JWT key overloads in `signWith(...)` and parser `setSigningKey(...)`.
        - [x] Verified with `cd backend && ./gradlew test` (BUILD SUCCESSFUL).
    - [x] Fixed Expo "Couldn't Load Profile" auth-retry gap + normalized manual guide to Expo-only:
        - [x] Updated `OnlyYoursExpo/src/services/api.js` interceptor to treat `403` same as `401` for token-refresh retry flow.
        - [x] Updated `backend/src/main/java/com/onlyyours/security/SecurityConfig.java` to return explicit `401 Unauthorized` for unauthenticated requests via `authenticationEntryPoint`.
        - [x] Verified backend test suite after security changes: `cd backend && ./gradlew test` (BUILD SUCCESSFUL).
        - [x] Removed remaining `OnlyYoursApp`/RN CLI command references from `MANUAL_TESTING_GUIDE_SPRINT6.md` and rewrote boot/networking/troubleshooting to Expo physical-device flow end-to-end.
    - [x] Fixed remaining Expo 401/403 profile + couple status runtime issues:
        - [x] Normalized API paths in Expo screens to avoid accidental `/api/api/...` routes:
            - `OnlyYoursExpo/src/screens/ProfileScreen.js`: `/api/user/me` -> `/user/me`
            - `OnlyYoursExpo/src/screens/DashboardScreen.js`: `/api/couple` -> `/couple`
            - `OnlyYoursExpo/src/screens/CategorySelectionScreen.js`: `/api/content/categories` -> `/content/categories`
        - [x] Validated route mismatch behavior by curl (`/api/user/me` -> 200, `/api/api/user/me` -> 401) to confirm root cause.
        - [x] Removed `newArchEnabled: false` from `OnlyYoursExpo/app.json` to align with Expo Go runtime and remove startup warning.
        - [x] Cleared stale Metro port conflict by stopping legacy process on `8081` (`pid 13129`), so Expo can run on default `8081` instead of auto-switching to `8082`.
        - [x] Updated `MANUAL_TESTING_GUIDE_SPRINT6.md` with explicit `npx expo` command usage and 401/403 troubleshooting notes.
    - [x] Hardened Expo runtime guard + startup diagnostics for physical-device runs:
        - [x] Added Node/NPM engine guard in `OnlyYoursExpo/package.json` (`node: >=24 <25`, `npm: >=11 <12`) to make runtime expectations explicit.
        - [x] Verified Metro serves both platform bundles under Node 24 (`/index.bundle?platform=ios|android` -> HTTP 200) to rule out JS compile failures.
        - [x] Confirmed active Expo dev server process is running on Node 24 (`~/.nvm/versions/node/v24.x/bin/node`) before troubleshooting device-side loading.
        - [x] Updated Expo troubleshooting notes in `MANUAL_TESTING_GUIDE_SPRINT6.md` with a deterministic "long spinner" triage flow (Node runtime, QR freshness, LAN/tunnel path, backend reachability).
    - [ ] Physical device EAS build validation: pending `eas login` + first cloud build + install on Android phone.

### Notes
- React Native and Android/iOS toolchains have been successfully upgraded to reduce dev friction and leverage New Architecture for performance.
- Sprint 4 core implementation is complete; testing and polish pending.
- All foundational infrastructure (auth, WebSocket, database) is complete and stable.
- Phase 2 Expo migration is complete at the code level. Local emulator is no longer required. Use `eas build` + physical device for all future mobile testing.

---

## Post-Sprint Stabilization Hotfixes (Feb 22, 2026)

**Goal:** Fix critical usability issues found during two-device Android testing before wider P2 feature implementation.

- [x] **Keyboard-safe auth forms on Android (login/signup/forgot/reset):**
    - [x] Added a reusable auth-screen wrapper: `OnlyYoursExpo/src/components/AuthFormScreenLayout.js`.
    - [x] Implemented `SafeAreaView` + `KeyboardAvoidingView` + `ScrollView` combination to prevent keyboard overlap on smaller heights.
    - [x] Applied the wrapper to these screens:
        - [x] `OnlyYoursExpo/src/screens/SignInScreen.js`
        - [x] `OnlyYoursExpo/src/screens/SignUpScreen.js`
        - [x] `OnlyYoursExpo/src/screens/ForgotPasswordScreen.js`
        - [x] `OnlyYoursExpo/src/screens/ResetPasswordScreen.js`
    - [x] **Why this change:** keyboard handling behavior differs between iOS and Android; using this layered layout pattern gives predictable form movement and preserves tap handling while the keyboard is open.

- [x] **Fix password/input illegibility under dark-mode system settings:**
    - [x] Added explicit input `color` on auth form text inputs to avoid platform-default dark text behavior mismatch.
    - [x] Added explicit `placeholderTextColor` for consistent contrast and readability.
    - [x] **Why this change:** relying on implicit platform defaults can produce low-contrast text when device theme and screen background are mismatched.

- [x] **Enable tablet + landscape responsiveness baseline (including gameplay screen):**
    - [x] Updated `OnlyYoursExpo/app.json` to support multi-orientation and tablet layouts (`orientation: "default"`, `ios.supportsTablet: true`).
    - [x] Updated `OnlyYoursExpo/src/screens/GameScreen.js` to use a scrollable, max-width-centered content layout for better behavior in compact landscape heights and large tablet widths.
    - [x] **Why this change:** portrait lock and fixed single-column assumptions break usability on tablets and landscape; this baseline removes hard lock-in and keeps gameplay accessible across form factors.

- [x] **Validation executed for this hotfix set:**
    - [x] Ran focused frontend tests: `AuthContext` + `GameContext` suites pass (`16/16`).
    - [x] Reviewed IDE diagnostics for changed files (existing historical warnings remain; no blocking compile/test regressions introduced by this hotfix).