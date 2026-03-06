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

---

## P2 Planning Workflow Kickoff (Feb 22, 2026)

**Goal:** Begin P2 execution under the user-approved gated workflow (plan -> approval -> implementation -> full testing -> completion report).

- [x] **Created in-depth Phase A sprint planning document:**
    - [x] Added new file: `P2_PHASE_A_SPRINT_PLAN.md`.
    - [x] Included detailed work breakdown for `A1` to `A6` with task IDs (`PA-A*`), file-level targets, and implementation checklists.
    - [x] Included explicit automated validation command matrix for backend and frontend (focused + full regression suites).
    - [x] Included definition-of-done checklist, risk register, and approval gate checklist.
    - [x] **Why this change:** this creates an implementation-safe blueprint so coding starts only after explicit plan approval and can be tracked with objective completion criteria.

---

## P2 Phase A Core Implementation (Feb 22-23, 2026)

**Goal:** Deliver the continuation-safe gameplay core: one active session per couple, 7-day expiry, resume-safe question bootstrap, and dashboard Continue Game experience.

- [x] **Backend schema + lifecycle enforcement (`A1`):**
    - [x] Added migration: `backend/src/main/resources/db/migration/V7__PhaseA_Game_Session_Continuation.sql`.
    - [x] Added `expires_at` and `last_activity_at` fields and comments.
    - [x] Added partial unique index enforcing one active session (`INVITED`, `ROUND1`, `ROUND2`) per couple.
    - [x] Extended `GameSession` model with lifecycle fields + `EXPIRED` status.
    - [x] Extended repository methods for active-session and expiry-aware queries.
    - [x] **Why this change:** service-level checks alone are insufficient under race conditions; DB constraints provide the final correctness barrier.

- [x] **State machine hardening + resume API (`A2` + `A3`):**
    - [x] Added duplicate-active invite guard and deterministic response path (`ActiveGameSessionExistsException`).
    - [x] Added expiry guard (`SessionExpiredException`) to transition/read paths.
    - [x] Added active session summary DTO: `ActiveGameSessionDto`.
    - [x] Added resume REST endpoints in `GameQueryController`:
        - [x] `GET /api/game/active`
        - [x] `GET /api/game/{sessionId}/current-question`
    - [x] Added normalized status metadata (`eventType`, `timestamp`) in `GameStatusDto` and status emission paths.
    - [x] Added partner presence event listener (`PARTNER_LEFT` / `PARTNER_RETURNED`) via `GamePresenceEventListener`.
    - [x] **Why this change:** resume UX requires a canonical persisted-state API, not only live websocket timing.

- [x] **Frontend continuation UX (`A4`):**
    - [x] Updated `OnlyYoursExpo/src/screens/DashboardScreen.js` to fetch `/game/active` and render Continue Game CTA.
    - [x] Extracted continuation/load/start logic into `OnlyYoursExpo/src/screens/useDashboardGameFlow.js` to enable stable automated validation.
    - [x] Blocked accidental parallel game starts when an active session exists.
    - [x] Updated `OnlyYoursExpo/src/state/GameContext.js` with resume bootstrap to fetch current question snapshot.
    - [x] Updated `OnlyYoursExpo/src/state/AuthContext.js` to handle:
        - [x] `ACTIVE_SESSION_EXISTS`
        - [x] `SESSION_EXPIRED`
        - [x] `PARTNER_LEFT`
        - [x] `PARTNER_RETURNED`
    - [x] **Why this change:** users need deterministic recovery from disconnect/background scenarios without breaking sequential gameplay.

- [x] **Automated validation (`A5`):**
    - [x] Backend focused tests passed:
        - [x] `./gradlew test --tests "*GameServiceTest" --tests "*RestControllerTest" --tests "*GameControllerWebSocketTest"`
    - [x] Backend full regression passed:
        - [x] `./gradlew clean test`
    - [x] Frontend focused tests passed:
        - [x] `npm test -- --runInBand src/state/__tests__/useDashboardGameFlow.test.js src/state/__tests__/AuthContext.test.js src/state/__tests__/GameContext.test.js`
    - [x] Frontend full regression passed:
        - [x] `npm test -- --runInBand`
    - [x] Added/updated tests for continuation flows:
        - [x] `backend/src/test/java/com/onlyyours/service/GameServiceTest.java`
        - [x] `backend/src/test/java/com/onlyyours/controller/RestControllerTest.java`
        - [x] `backend/src/test/java/com/onlyyours/controller/GameControllerWebSocketTest.java`
        - [x] `backend/src/test/java/com/onlyyours/controller/WebSocketPerformanceTest.java`
        - [x] `OnlyYoursExpo/src/state/__tests__/AuthContext.test.js`
        - [x] `OnlyYoursExpo/src/state/__tests__/GameContext.test.js`
        - [x] `OnlyYoursExpo/src/state/__tests__/useDashboardGameFlow.test.js`

- [x] **Documentation updates (`A6`):**
    - [x] Updated `P2_PHASE_A_SPRINT_PLAN.md` with completed checklist + implementation summary.
    - [x] Updated `P2_IMPLEMENTATION_PLAN.md` Phase A checklist and weekly gates.
    - [x] Updated `MANUAL_TESTING_GUIDE_SPRINT6.md` with continuation validation scenarios.

- [ ] **Pending for closure outside this coding iteration:**
    - [ ] Two-device manual continuation/expiry matrix execution and evidence capture.
    - [ ] User sign-off on Phase A outcomes after manual validation.

---

## P2 Phase B Planning Kickoff (Feb 23, 2026)

**Goal:** Start Phase B under the same gated workflow (plan -> approval -> implementation -> full testing -> completion report).

- [x] **Created in-depth Phase B sprint planning document:**
    - [x] Added new file: `P2_PHASE_B_SPRINT_PLAN.md`.
    - [x] Broke work into detailed tracks `PB-B1` to `PB-B6` with file-level target paths.
    - [x] Added API contract draft for:
        - [x] `GET /api/game/history`
        - [x] `GET /api/game/stats`
        - [x] `GET /api/game/badges`
    - [x] Added metric formula definitions, badge-rule proposals, and index strategy notes.
    - [x] Added exact command matrix for backend/frontend focused + full regression runs.
    - [x] Added risk register, definition of done, and approval checklist.
    - [x] **Why this change:** this ensures Phase B implementation starts from explicit contracts and measurable completion gates rather than ad-hoc coding.

- [x] **Phase boundary note captured:**
    - [x] Phase A manual two-device verification is intentionally deferred by user and will be executed later.
    - [x] Phase B implementation was blocked until explicit approval of `P2_PHASE_B_SPRINT_PLAN.md` (workflow Step 2); approval is now received and implementation is complete.

---

## P2 Phase B Core Implementation (Feb 26, 2026)

**Goal:** Deliver the first retention/insight surfaces: paginated game history, dashboard stats cards, and badge MVP with deterministic backend contracts and regression-safe frontend integration.

- [x] **Historical games backend (`PB-B1`):**
    - [x] Added DTOs:
        - [x] `backend/src/main/java/com/onlyyours/dto/GameHistoryItemDto.java`
        - [x] `backend/src/main/java/com/onlyyours/dto/GameHistoryPageDto.java`
    - [x] Extended repository query support in `backend/src/main/java/com/onlyyours/repository/GameSessionRepository.java` for user-scoped completed and all-status timelines.
    - [x] Implemented history query service path in `backend/src/main/java/com/onlyyours/service/GameService.java` with:
        - [x] bounded pagination (`size` clamp),
        - [x] deterministic sort (`recent` / `oldest`),
        - [x] winner filter (`all` / `self` / `partner`) and tie-safe handling.
    - [x] Exposed `GET /api/game/history` in `backend/src/main/java/com/onlyyours/controller/GameQueryController.java`.
    - [x] Added migration `backend/src/main/resources/db/migration/V8__PhaseB_History_Stats_Indexes.sql` for history/stats query performance.
    - [x] **Why this change:** history must remain stable as game volume grows; bounded API contracts + indexes avoid unbounded client-side or DB scans.

- [x] **Dashboard stats backend (`PB-B3`):**
    - [x] Added `backend/src/main/java/com/onlyyours/dto/DashboardStatsDto.java`.
    - [x] Implemented aggregation logic in `GameService` for:
        - [x] games played,
        - [x] average score,
        - [x] best score,
        - [x] streak days,
        - [x] invitation acceptance rate,
        - [x] average invite response seconds.
    - [x] Exposed `GET /api/game/stats` in `GameQueryController`.
    - [x] Added no-history safe defaults for deterministic client rendering.
    - [x] **Why this change:** users need quick, interpretable progress signals; deterministic aggregates reduce UI ambiguity and edge-case drift.

- [x] **Badge MVP backend + frontend surface (`PB-B5`):**
    - [x] Added `backend/src/main/java/com/onlyyours/dto/BadgeDto.java`.
    - [x] Implemented server-side badge evaluator in `GameService` with deterministic earned badge output:
        - [x] `FIRST_GAME`, `FIVE_GAMES`, `TEN_GAMES`,
        - [x] `SHARP_GUESSER`, `STREAK_3`, `RESPONSIVE_COUPLE`.
    - [x] Exposed `GET /api/game/badges` in `GameQueryController`.
    - [x] Added reusable `OnlyYoursExpo/src/components/BadgeChip.js` with token-based color mapping and fallback styling.
    - [x] Rendered badges on:
        - [x] `OnlyYoursExpo/src/screens/DashboardScreen.js`
        - [x] `OnlyYoursExpo/src/screens/ProfileScreen.js`
    - [x] **Why this change:** server-authoritative badge derivation avoids frontend rule duplication and keeps future badge evolution backward compatible.

- [x] **Historical + stats frontend integration (`PB-B2` + `PB-B4`):**
    - [x] Added history route in `OnlyYoursExpo/src/navigation/AppNavigator.js`.
    - [x] Added `OnlyYoursExpo/src/screens/GameHistoryScreen.js` with:
        - [x] sort/winner controls,
        - [x] paginated load-more behavior,
        - [x] loading/empty/error states.
    - [x] Added `OnlyYoursExpo/src/screens/useGameHistoryFlow.js` to isolate query-state and retry logic for testability.
    - [x] Extended `OnlyYoursExpo/src/screens/useDashboardGameFlow.js` to fetch stats and badges on focus.
    - [x] Refactored `OnlyYoursExpo/src/screens/DashboardScreen.js` to render metric cards while preserving primary continuation/start actions.
    - [x] **Why this change:** separating data-flow logic from screen rendering keeps UI deterministic and makes query-state regressions testable without brittle screen-level mocks.

- [x] **Automated validation and regression (`PB-B6`):**
    - [x] Backend focused tests passed:
        - [x] `./gradlew test --tests com.onlyyours.service.GameServiceTest --tests com.onlyyours.controller.RestControllerTest`
    - [x] Backend full regression passed:
        - [x] `./gradlew test`
    - [x] Frontend focused tests passed:
        - [x] `YARN_IGNORE_ENGINES=1 yarn test --watchAll=false src/state/__tests__/useDashboardGameFlow.test.js src/state/__tests__/useGameHistoryFlow.test.js`
    - [x] Frontend full regression passed:
        - [x] `YARN_IGNORE_ENGINES=1 yarn test --watchAll=false`
    - [x] Added/updated tests:
        - [x] `backend/src/test/java/com/onlyyours/service/GameServiceTest.java`
        - [x] `backend/src/test/java/com/onlyyours/controller/RestControllerTest.java`
        - [x] `OnlyYoursExpo/src/state/__tests__/useDashboardGameFlow.test.js`
        - [x] `OnlyYoursExpo/src/state/__tests__/useGameHistoryFlow.test.js`
    - [x] Ran lint diagnostics on newly modified frontend files.
    - [ ] Residual non-blocking Sonar prop-validation warnings remain in `BadgeChip.js` style pattern (no runtime/test failures).

- [x] **Additional in-depth validation rerun (user-requested confidence gate, Feb 26, 2026):**
    - [x] Backend focused rerun passed:
        - [x] `./gradlew test --tests "*GameServiceTest" --tests "*RestControllerTest" --tests "*GameControllerWebSocketTest" --tests "*WebSocketPerformanceTest"`
    - [x] Backend clean full regression rerun passed:
        - [x] `./gradlew clean test`
    - [x] Backend test-report summary captured from `backend/build/reports/tests/test/index.html`:
        - [x] total tests `128`, failures `0`, ignored `0`, success `100%`
        - [x] package mix confirms unit + integration coverage (`service` + `controller` + `integration`)
    - [x] Frontend expanded focused rerun passed:
        - [x] `YARN_IGNORE_ENGINES=1 yarn test --watchAll=false src/state/__tests__/useDashboardGameFlow.test.js src/state/__tests__/useGameHistoryFlow.test.js src/state/__tests__/AuthContext.test.js src/state/__tests__/GameContext.test.js src/services/__tests__/WebSocketService.test.js` (`46/46`)
    - [x] Frontend full regression rerun passed:
        - [x] `YARN_IGNORE_ENGINES=1 yarn test --watchAll=false` (`49/49`, `6/6 suites`)
    - [x] **Why this change:** this explicit rerun closes confidence gaps before Phase C planning by proving the same code passes both targeted high-risk paths and full project regressions in one validation cycle.

- [x] **Documentation synchronization:**
    - [x] Updated `P2_PHASE_B_SPRINT_PLAN.md` checklists and execution journal with implementation outcomes.
    - [x] Updated `P2_IMPLEMENTATION_PLAN.md` Phase B checklists.
    - [x] Updated `MANUAL_TESTING_GUIDE_SPRINT6.md` with Phase B manual matrix.

- [ ] **Pending for closure outside this coding iteration:**
    - [ ] Manual multi-device verification for Phase B history/stats/badges matrix.
    - [ ] User sign-off after manual validation evidence is captured.

---

## P2 Phase C Planning Kickoff (Feb 26, 2026)

**Goal:** Prepare a gated, implementation-ready blueprint for Phase C (`Onboarding + Theme Tokens + Responsive Expansion`) before any coding starts.

- [x] **Created in-depth Phase C sprint planning document:**
    - [x] Added new file: `P2_PHASE_C_SPRINT_PLAN.md`.
    - [x] Structured work into detailed tracks `PC-C1` to `PC-C4` with file-level targets and checklist granularity.
    - [x] Added architecture decisions for:
        - [x] token-first migration strategy,
        - [x] theme override model (`system` / `light` / `dark`),
        - [x] gradient token + fallback policy,
        - [x] onboarding state machine and replay flow.
    - [x] Added explicit dependency map (cross-phase + intra-phase).
    - [x] Added local state contract drafts (`onboarding_state_v1`, `theme_preference_v1`) and gradient token schema.
    - [x] Added focused/full test command matrix and risk register with mitigation actions.
    - [x] Added definition-of-done + approval checklist + post-approval execution journal.
    - [x] **Why this change:** Phase C touches many UI and architectural layers; a contract-first sprint blueprint prevents style drift, scope creep, and sequencing mistakes.

- [x] **Master plan synchronization:**
    - [x] Updated `P2_IMPLEMENTATION_PLAN.md` to reference `P2_PHASE_C_SPRINT_PLAN.md`.
    - [x] Marked Week 4 planning prerequisite as complete (plan created and ready for review).

- [x] **Pending before implementation starts:**
    - [x] User approval of `P2_PHASE_C_SPRINT_PLAN.md` (workflow Step 2) received.

---

## P2 Phase C Core Implementation (Feb 26, 2026)

**Goal:** Ship first-run onboarding, centralized theme tokens, and responsive expansion across priority screens without regressing existing game/state flows.

- [x] **Onboarding state + flow (`C1`):**
    - [x] Added versioned onboarding persistence contract in `OnlyYoursExpo/src/state/onboardingStorage.js` with idempotent helpers:
        - [x] `getOnboardingState`
        - [x] `markOnboardingStarted`
        - [x] `markOnboardingCompleted`
        - [x] `resetOnboardingState`
    - [x] Integrated onboarding state into `OnlyYoursExpo/src/state/AuthContext.js`:
        - [x] Added `onboardingStatus` state and `shouldShowOnboarding` gate.
        - [x] Added `startOnboarding`, `completeOnboarding`, `replayOnboarding` context actions.
        - [x] Hydrated onboarding state on login and silent-auth bootstrap paths.
    - [x] Added `OnlyYoursExpo/src/screens/OnboardingScreen.js` (multi-step narrative, skip/next/finish controls, deterministic dashboard handoff).
    - [x] Added minimal settings flow:
        - [x] `OnlyYoursExpo/src/screens/SettingsScreen.js`
        - [x] `OnlyYoursExpo/src/navigation/AppNavigator.js` route wiring
        - [x] `OnlyYoursExpo/src/screens/ProfileScreen.js` entry-point button
    - [x] **Why this change:** onboarding progression must be deterministic and replay-safe while remaining decoupled from auth token/session semantics.

- [x] **Theme token system + provider (`C2`):**
    - [x] Added foundational token modules:
        - [x] `OnlyYoursExpo/src/theme/tokens.js`
        - [x] `OnlyYoursExpo/src/theme/gradients.js`
        - [x] `OnlyYoursExpo/src/theme/motion.js`
    - [x] Added theme runtime provider + hook:
        - [x] `OnlyYoursExpo/src/theme/ThemeProvider.js`
        - [x] `OnlyYoursExpo/src/theme/useTheme.js`
        - [x] `OnlyYoursExpo/src/theme/index.js`
    - [x] Added persistence + override behavior:
        - [x] `system`/`light`/`dark` modes,
        - [x] storage key `theme_preference_v1`,
        - [x] system scheme resolution fallback.
    - [x] Wired provider into app root in `OnlyYoursExpo/App.js`.
    - [x] **Why this change:** centralizing design values prevents style drift, makes dark/light behavior consistent, and creates a scalable base for future settings work.

- [x] **Responsive + token migration across priority screens (`C3`):**
    - [x] Auth stack migrated to shared tokenized form styles:
        - [x] `SignInScreen.js`
        - [x] `SignUpScreen.js`
        - [x] `ForgotPasswordScreen.js`
        - [x] `ResetPasswordScreen.js`
        - [x] `AuthFormScreenLayout.js`
        - [x] shared helper `OnlyYoursExpo/src/theme/createAuthFormStyles.js`
    - [x] Dashboard ecosystem responsive/token pass:
        - [x] `DashboardScreen.js`
        - [x] `GameHistoryScreen.js`
        - [x] `CategorySelectionScreen.js`
        - [x] `PartnerLinkScreen.js`
    - [x] Gameplay/results responsive tokenized pass:
        - [x] `GameScreen.js`
        - [x] `ResultsScreen.js`
    - [x] Profile/settings/onboarding consistency pass:
        - [x] `ProfileScreen.js`
        - [x] `SettingsScreen.js`
        - [x] `OnboardingScreen.js`
    - [x] Shared component migration:
        - [x] `LoadingSpinner.js`
        - [x] `EmptyState.js`
        - [x] `BadgeChip.js`
    - [x] **Why this change:** responsive behavior and consistent token usage must land together to avoid fragmented UX between screen sizes and theme modes.

- [x] **Testing + regression validation (`C4` automated):**
    - [x] Added new tests:
        - [x] `OnlyYoursExpo/src/state/__tests__/onboardingStorage.test.js`
        - [x] `OnlyYoursExpo/src/theme/__tests__/ThemeProvider.test.js`
        - [x] `OnlyYoursExpo/src/state/__tests__/OnboardingScreenFlow.test.js`
        - [x] `OnlyYoursExpo/src/state/__tests__/SettingsScreenFlow.test.js`
    - [x] Updated context assertions in `OnlyYoursExpo/src/state/__tests__/AuthContext.test.js`.
    - [x] Ran focused frontend suite:
        - [x] `YARN_IGNORE_ENGINES=1 yarn test --watch=false src/state/__tests__/AuthContext.test.js src/state/__tests__/onboardingStorage.test.js src/state/__tests__/OnboardingScreenFlow.test.js src/state/__tests__/SettingsScreenFlow.test.js src/theme/__tests__/ThemeProvider.test.js`
    - [x] Ran full frontend regression:
        - [x] `YARN_IGNORE_ENGINES=1 yarn test --watch=false` (`10/10 suites`, `58/58 tests`)
    - [x] Ran backend full-suite safety regression:
        - [x] `./gradlew test` (backend)
    - [x] Ran IDE lint diagnostics for changed files and fixed newly introduced hook-order issue in `BadgeChip`.
    - [ ] Residual non-blocking Sonar prop-validation warnings remain in several legacy JS screens/components (no runtime/test failures).

- [x] **Documentation synchronization:**
    - [x] Updated `P2_PHASE_C_SPRINT_PLAN.md` checklists + execution journal with implementation and validation evidence.
    - [x] Updated `P2_IMPLEMENTATION_PLAN.md` Phase C checklists and completion notes.
    - [x] Updated `MANUAL_TESTING_GUIDE_SPRINT6.md` with a dedicated Phase C validation matrix.

- [ ] **Pending manual closure outside this coding iteration (user-deferred):**
    - [ ] Manual phone/tablet responsive validation (portrait + landscape) for Phase C.
    - [ ] Dark-mode/light-mode visual QA pass on real devices.
    - [ ] User sign-off after manual evidence capture.

---

## P2 Phase D Planning Kickoff (Mar 1, 2026)

**Goal:** Move into Phase D using the same gated workflow, while keeping deferred manual validation work pending for later.

- [x] **Created in-depth Phase D sprint planning document:**
    - [x] Added new file: `P2_PHASE_D_SPRINT_PLAN.md`.
    - [x] Broke work into detailed tracks `PD-D1` to `PD-D4` with file-level target paths.
    - [x] Added architecture decisions for:
        - [x] soft-unlink lifecycle + cooldown model,
        - [x] recoverable relink policy,
        - [x] server-authoritative profile/settings data contract,
        - [x] deep-link routing and duplicate fan-out prevention strategy.
    - [x] Added API/event contract drafts for unlink, settings, and push deep-link payloads.
    - [x] Added focused/full backend and frontend command matrix for validation.
    - [x] Added risk register, definition of done, approval checklist, and execution journal.
    - [x] **Why this change:** Phase D mixes backend state integrity and client notification routing; explicit contract-first planning reduces rework and de-risks implementation sequencing.

- [x] **Master plan synchronization:**
    - [x] Updated `P2_IMPLEMENTATION_PLAN.md` to reference `P2_PHASE_D_SPRINT_PLAN.md`.
    - [x] Updated Week 5 checklist to mark Phase D planning artifact creation as complete.
    - [x] **Why this change:** keeps the phase-level plan and weekly checkpoint view consistent, so progress tracking remains auditable.

- [x] **Validation deferral note retained:**
    - [x] Manual validation for Phase A/B/C remains deferred by user and does not block Phase D planning work.
    - [x] **Why this change:** preserves workflow continuity without losing visibility of pending manual closure tasks.

- [x] **Pending before Phase D implementation starts:**
    - [x] User approval of `P2_PHASE_D_SPRINT_PLAN.md` (workflow Step 2) received (`Please proceed`).

---

## P2 Phase D Core Implementation (Mar 1, 2026)

**Goal:** Complete reliability-first couple controls, profile/settings expansion, and notification deep-link hardening without regressing gameplay/auth/session flows.

- [x] **`PD-D1` unlink flow + cooldown + recovery:**
    - [x] Added couple lifecycle persistence model and migration (`status`, `createdAt`, `linkedAt`, `unlinkedAt`, `cooldownEndsAt`, `unlinkedByUser`, `unlinkReason`) in:
        - [x] `backend/src/main/resources/db/migration/V9__PhaseD_Couple_Unlink_Cooldown.sql`
        - [x] `backend/src/main/java/com/onlyyours/model/Couple.java`
        - [x] `backend/src/main/java/com/onlyyours/repository/CoupleRepository.java`
    - [x] Added couple status/unlink/recover API contracts and service logic:
        - [x] `GET /api/couple/status`
        - [x] `POST /api/couple/unlink` (preview + confirmation token flow)
        - [x] `POST /api/couple/recover`
        - [x] active-session unlink guard + cooldown enforcement
    - [x] Added machine-readable business errors via `CoupleOperationException` and handler mapping in `GlobalExceptionHandler`.
    - [x] Added frontend relationship-controls UX in `OnlyYoursExpo/src/screens/SettingsScreen.js`:
        - [x] 2-step unlink confirmation,
        - [x] cooldown status messaging,
        - [x] recovery entry point.
    - [x] **Why this change:** unlinking is a high-risk mutation; soft state transitions + explicit confirmation/cooldown/recovery minimize irreversible user harm and preserve historical data integrity.

- [x] **`PD-D2` profile + settings expansion:**
    - [x] Added profile/preferences persistence migrations:
        - [x] `backend/src/main/resources/db/migration/V10__PhaseD_User_Profile_Fields.sql`
        - [x] `backend/src/main/resources/db/migration/V11__PhaseD_User_Notification_Preferences.sql`
    - [x] Extended user model + DTOs and controller contracts for editable profile and notification preferences in:
        - [x] `backend/src/main/java/com/onlyyours/model/User.java`
        - [x] `backend/src/main/java/com/onlyyours/dto/UserDto.java`
        - [x] `backend/src/main/java/com/onlyyours/dto/UpdateProfileRequestDto.java`
        - [x] `backend/src/main/java/com/onlyyours/dto/NotificationPreferencesDto.java`
        - [x] `backend/src/main/java/com/onlyyours/controller/UserController.java`
    - [x] Added frontend profile editing UX (`username`, `bio`) in `OnlyYoursExpo/src/screens/ProfileScreen.js`.
    - [x] Added frontend reminder/quiet-hours/timezone controls in `OnlyYoursExpo/src/screens/SettingsScreen.js`.
    - [x] **Why this change:** preferences become reliable only when the server is source-of-truth; local-only settings drift across reinstalls/devices and break predictable notification behavior.

- [x] **`PD-D3` notification deep-link reliability + dedupe:**
    - [x] Added typed gameplay push event contract and dedupe strategy in `backend/src/main/java/com/onlyyours/service/PushNotificationService.java`:
        - [x] stable event metadata (`type`, `sessionId`, `targetRoute`),
        - [x] idempotent dispatch suppression for duplicate triggers.
    - [x] Wired gameplay notification triggers in `backend/src/main/java/com/onlyyours/controller/GameController.java` for:
        - [x] invitation continuation,
        - [x] partner-progress nudges,
        - [x] results-ready routing.
    - [x] Added results deep-link query support:
        - [x] `backend/src/main/java/com/onlyyours/service/GameService.java`
        - [x] `backend/src/main/java/com/onlyyours/controller/GameQueryController.java`
    - [x] Added frontend deep-link intent mapping and cold-start/auth-safe replay:
        - [x] `OnlyYoursExpo/src/services/NotificationService.js`
        - [x] `OnlyYoursExpo/src/state/AuthContext.js`
        - [x] route/session hydration in `GameScreen.js` and `ResultsScreen.js`
    - [x] **Why this change:** notification UX is only trustworthy when routes are deterministic and duplicate fan-out is suppressed; otherwise users see confusing navigation and noisy pushes.

- [x] **`PD-D4` automated validation + stability fixes:**
    - [x] Backend tests expanded/added:
        - [x] `backend/src/test/java/com/onlyyours/service/CoupleServiceTest.java`
        - [x] `backend/src/test/java/com/onlyyours/controller/RestControllerTest.java`
        - [x] `backend/src/test/java/com/onlyyours/service/PushNotificationServiceTest.java` (new)
    - [x] Frontend tests expanded/added:
        - [x] `OnlyYoursExpo/src/state/__tests__/AuthContext.test.js`
        - [x] `OnlyYoursExpo/src/state/__tests__/SettingsScreenFlow.test.js`
        - [x] `OnlyYoursExpo/src/state/__tests__/ProfileScreenFlow.test.js` (new)
        - [x] `OnlyYoursExpo/src/services/__tests__/NotificationService.test.js` (new)
    - [x] Lint/quality cleanup in sprint scope:
        - [x] replaced wildcard response generics with explicit `ResponseEntity<Object>` where required,
        - [x] made `CoupleOperationException.metadata` transient for serialization/lint safety.
    - [x] **Why this change:** the highest-risk defects in this phase are behavioral regressions, so coverage was widened around state transitions and notification routing, with lint hygiene to avoid CI drift.

- [x] **Automated verification evidence (executed):**
    - [x] Backend focused: `./gradlew test --tests "*CoupleServiceTest" --tests "*RestControllerTest" --tests "*PushNotificationServiceTest"`
    - [x] Backend full regression: `./gradlew test`
    - [x] Frontend focused:
        - [x] `YARN_IGNORE_ENGINES=1 yarn test --watch=false src/services/__tests__/NotificationService.test.js`
        - [x] `YARN_IGNORE_ENGINES=1 yarn test --watch=false src/state/__tests__/AuthContext.test.js`
        - [x] `YARN_IGNORE_ENGINES=1 yarn test --watch=false src/state/__tests__/SettingsScreenFlow.test.js`
        - [x] `YARN_IGNORE_ENGINES=1 yarn test --watch=false src/state/__tests__/ProfileScreenFlow.test.js`
    - [x] Frontend full regression: `YARN_IGNORE_ENGINES=1 yarn test --watch=false`
    - [x] **Why this change:** this layered test strategy validates both narrow high-risk paths and full-system compatibility before marking implementation complete.

- [x] **Documentation synchronization:**
    - [x] Updated `P2_PHASE_D_SPRINT_PLAN.md` checklist and execution journal.
    - [x] Updated `P2_IMPLEMENTATION_PLAN.md` Phase D checklist/completion notes.
    - [x] Updated `MANUAL_TESTING_GUIDE_SPRINT6.md` with a dedicated Phase D validation matrix.

- [ ] **Pending manual closure outside this coding iteration (user-deferred):**
    - [ ] Manual two-device verification for Phase D unlink/recovery and deep-link flows.
    - [ ] Manual verification for previously deferred Phase A/B/C matrices.
    - [ ] User sign-off after manual evidence capture.

---

## P2 Phase D Manual Validation Readiness Pack (Mar 1, 2026)

**Goal:** Reduce execution friction for deferred manual validation by converting the Phase D matrix into a ready-to-run artifact with traceable evidence slots.

- [x] **Created a dedicated runnable worksheet for Phase D manual testing:**
    - [x] Added new file: `PHASE_D_MANUAL_VALIDATION_RUN.md`.
    - [x] Included:
        - [x] run metadata block (date/tester/build/devices/environment),
        - [x] strict case execution order (`D-1601` to `D-1611`),
        - [x] pass/fail matrix with evidence + defect columns,
        - [x] retest and final sign-off sections.
    - [x] **Why this change:** separating execution artifacts from the reference guide improves test-run ergonomics, prevents skipped evidence capture, and makes sign-off auditable.

- [x] **Added reference linkage from the canonical manual guide:**
    - [x] Updated `MANUAL_TESTING_GUIDE_SPRINT6.md` Phase D section to point to `PHASE_D_MANUAL_VALIDATION_RUN.md`.
    - [x] **Why this change:** keeps one source-of-truth for expected behavior while giving QA a practical form to fill during live execution.

- [x] **Added optional API snapshot helper block (placeholder-safe):**
    - [x] Included `curl` examples with environment placeholders (`${BASE_URL}`, `${TOKEN_ACCOUNT_A}`) and no real credentials.
    - [x] Included an endpoint snapshot checklist aligned with Phase D risk paths.
    - [x] **Why this change:** API snapshots make state-transition defects easier to diagnose (especially cooldown/recovery/deep-link target issues) without leaking secrets.

- [ ] **Still pending outside this coding iteration:**
    - [ ] Execute the manual two-device Phase D run and fill `PHASE_D_MANUAL_VALIDATION_RUN.md`.
    - [ ] Attach evidence artifacts and defect IDs.
    - [ ] Complete user sign-off decision after retest (if needed).

---

## P2 Documentation Consistency Reconciliation (Mar 3, 2026)

**Goal:** Align cross-document status reporting so master-phase checklists match actual implementation state without falsely closing manual validation gates.

- [x] **Audited Phase C status across planning and execution artifacts:**
    - [x] Reviewed `P2_IMPLEMENTATION_PLAN.md` Week 4 checklist entries.
    - [x] Cross-checked completion state in `P2_PHASE_C_SPRINT_PLAN.md` (execution journal + final completion checks).
    - [x] Cross-checked implementation narrative and pending-manual notes in `DEVELOPMENT_PLAN.md`.
    - [x] **Why this change:** checklist drift creates false negatives in progress tracking and can block downstream closure decisions even when implementation is complete.

- [x] **Reconciled Week 4 implementation checklist in `P2_IMPLEMENTATION_PLAN.md`:**
    - [x] Marked `C2`, `C1`, `C3`, and `C4` as complete to match shipped work.
    - [x] Clarified `C4` wording to explicitly separate automated/docs completion from deferred manual visual/responsive QA.
    - [x] **Why this change:** this preserves truthful implementation reporting while still keeping release-signoff controls strict.

- [x] **Preserved manual gate integrity (no false closure):**
    - [x] Left Week 4 gate checks (`phone/tablet pass`, `theming consistency`, `user sign-off`) as pending.
    - [x] Left deferred manual items in `DEVELOPMENT_PLAN.md` unchanged.
    - [x] **Why this change:** implementation completeness and release-readiness are different layers; manual validation remains the quality gate for real-device confidence.

- [ ] **Pending after this reconciliation pass:**
    - [ ] Execute deferred manual validation runs (Phase A/B/C/D matrices).
    - [ ] Update gate checkboxes from evidence.
    - [ ] Capture final user sign-off for phase closure.

---

## Backend Startup Hotfix - Flyway V7 Duplicate Active Session Guard (Mar 6, 2026)

**Goal:** Fix backend startup failure caused by Flyway migration `V7__PhaseA_Game_Session_Continuation.sql` when legacy data contains multiple active game sessions for the same couple.

- [x] **Diagnosed root cause from startup stack trace:**
    - [x] Failure occurred while creating unique index `uk_game_sessions_one_active_per_couple`.
    - [x] PostgreSQL error `23505` indicated duplicate `couple_id` values in active statuses (`INVITED`, `ROUND1`, `ROUND2`).
    - [x] **Why this matters:** index creation is a schema-level invariant; any historical data violating it blocks `entityManagerFactory`, cascading into repository/service bean initialization failures.

- [x] **Implemented migration hardening in `V7__PhaseA_Game_Session_Continuation.sql`:**
    - [x] Added a pre-index deduplication step:
        - [x] rank active sessions per couple by recency (`last_activity_at`, `started_at`, `created_at`, `id`),
        - [x] keep the newest active session,
        - [x] transition older active duplicates to `EXPIRED`,
        - [x] set `completed_at`, `expires_at`, `last_activity_at` fallback values when missing.
    - [x] Kept the unique partial index creation unchanged after cleanup.
    - [x] **Why this change:** it preserves the business invariant ("one active session per couple") while safely reconciling pre-existing inconsistent rows instead of forcing manual DB surgery.

- [ ] **Post-fix validation pending in local runtime:**
    - [x] Re-run backend startup / Flyway migration path to confirm no `uk_game_sessions_one_active_per_couple` violation remains.
        - [x] Validation command: `./gradlew bootRun` (backend starts cleanly; Tomcat up, JPA initialized, no Flyway index-violation crash).
    - [ ] Verify existing active session flows still behave correctly after dedupe (continue/resume paths).
    - [ ] Capture manual runtime evidence in troubleshooting notes if any additional edge cases appear.

---

## Local Wi-Fi Dev Client Connectivity Runbook Update (Mar 6, 2026)

**Goal:** Standardize the local physical-device workflow so Expo dev client sessions consistently avoid `127.0.0.1:8081` bundle failures and always target the laptop backend over current LAN IP.

- [x] **Updated `MANUAL_TESTING_GUIDE_SPRINT6.md` Quick Start to the Wi-Fi-safe process:**
    - [x] Added `LAN_IP=$(ipconfig getifaddr en0 || ipconfig getifaddr en1)` runtime resolution.
    - [x] Added `.env` rewrite step to keep `EXPO_PUBLIC_API_URL=http://$LAN_IP:8080` aligned with current Wi-Fi DHCP assignment.
    - [x] Added `REACT_NATIVE_PACKAGER_HOSTNAME="$LAN_IP" npx expo start --dev-client -c` as the default Metro startup command.
    - [x] **Why this change:** physical phones cannot use loopback (`127.0.0.1`) to reach laptop-hosted Metro/backend; explicit LAN host advertisement removes a recurring setup failure.

- [x] **Propagated the same process across guide sections (consistency pass):**
    - [x] Step 2 dev-client startup (`Step D`) now uses Node 24 + LAN host override.
    - [x] Step 7/8 setup now verifies and updates LAN-based backend URL before Expo startup.
    - [x] Setup troubleshooting now includes a dedicated `failed to connect to 127.0.0.1:8081` cause/fix block.
    - [x] Boot sequence command updated to include Node 24 activation + Metro LAN host override.
    - [x] **Why this change:** one canonical command flow prevents partial fixes where one section is correct and another reintroduces stale localhost instructions.

- [x] **Removed stale machine-specific assumptions in the guide:**
    - [x] Replaced hardcoded sample check (`192.168.1.101`) with dynamic LAN-IP checks.
    - [x] Replaced `rg`-based env check with portable `grep` command in setup checks.
    - [x] **Why this change:** LAN IP changes between sessions and `rg` is not guaranteed in every local shell environment.

- [ ] **Next manual validation step (outside this doc-only iteration):**
    - [ ] Run one full two-device startup using the new runbook and capture evidence in `PHASE_D_MANUAL_VALIDATION_RUN.md`.
    - [ ] If LAN changes again, re-run the same command sequence and confirm startup remains deterministic.

---

## Invitation Pending -> Loading Question Recovery Hardening (Mar 6, 2026)

**Goal:** Fix the runtime dead-end where both devices could land on `GameScreen` with indefinite `Loading question...` while the session remained in `INVITED` state.

- [x] **Diagnosed root cause from combined frontend/backend evidence:**
    - [x] Backend log showed invitation creation (`status=INVITED`) without a matching `Game started` acceptance transition.
    - [x] Frontend flow opened `GameScreen` from `INVITATION_SENT`/active-session paths even when no question payload existed yet.
    - [x] **Why this matters:** `GET /api/game/{sessionId}/current-question` returns conflict for `INVITED` sessions by design, so clients need explicit acceptance/recovery UX instead of endless spinner.

- [x] **Added invite-state recovery in frontend game state layer (`OnlyYoursExpo/src/state/GameContext.js`):**
    - [x] Added invited-session detection during current-question hydration fallback (`/api/game/active` check on conflict).
    - [x] Added `isInvitationPending` state + `acceptPendingInvitation()` action.
    - [x] Added `refreshCurrentQuestion()` action for manual resync when question payload is delayed.
    - [x] Updated same-session re-entry (`startGame` with identical `sessionId`) to re-hydrate snapshot instead of no-op.
    - [x] **Why this change:** recovery must be deterministic after missed invitation events or reconnect races.

- [x] **Added explicit pending-invitation UI in `OnlyYoursExpo/src/screens/GameScreen.js`:**
    - [x] Replaced ambiguous spinner-only state with actionable panel when session is pending invite acceptance.
    - [x] Added `Accept Invitation` CTA (sends `/app/game.accept`) and `Refresh Session` CTA.
    - [x] **Why this change:** users need a visible unblocking action when the session has not advanced to Round 1 yet.

- [x] **Hardened invitation alert actions in `OnlyYoursExpo/src/state/AuthContext.js`:**
    - [x] Added send-result checks for `/app/game.accept` and `/app/game.decline` (`WebSocketService.sendMessage` false path).
    - [x] Added explicit realtime-disconnected alerts instead of optimistic navigation when STOMP publish fails.
    - [x] **Why this change:** previously the UI could move to `GameScreen` even if acceptance was never delivered to backend.

- [x] **Documentation synchronization for this runtime issue:**
    - [x] Updated `MANUAL_TESTING_GUIDE_SPRINT6.md` troubleshooting with a dedicated section for "both phones stuck on Loading question".
    - [x] Added step-by-step recovery sequence and hard fallback restart command.

- [ ] **Validation follow-up (runtime):**
    - [ ] Re-run two-device invite -> accept flow and confirm backend logs `Game started: session=...` on recovery path.
    - [ ] Capture evidence in `PHASE_D_MANUAL_VALIDATION_RUN.md` under runtime defects/retest notes.

---

## Round 1 "Waiting for Partner" Race Condition Fix (Mar 6, 2026)

**Goal:** Fix a concurrency bug where both players could answer question 1 at nearly the same time and both clients remained stuck on "Waiting for partner..." even though both answers were already saved.

- [x] **Diagnosed race condition from backend evidence:**
    - [x] Observed logs where both `Answer recorded` events appeared for the same session/question, but both handlers logged `Waiting for partner...`.
    - [x] Confirmed this can happen when two `submitAnswer` transactions run in parallel and each transaction counts answers before the other transaction commits.
    - [x] **Why this matters:** the game can dead-end in Round 1 because no request executes the advance-to-next-question branch after both answers are already persisted.

- [x] **Added session-row locking for write-critical game mutations:**
    - [x] Added `GameSessionRepository.findByIdForUpdate(...)` with `PESSIMISTIC_WRITE` lock.
    - [x] Updated `GameService.submitAnswer(...)` to load the session with row lock before validation and answer-write logic.
    - [x] Updated `GameService.submitGuess(...)` to use the same lock path for consistency under concurrent writes.
    - [x] **Why this change:** serializing concurrent writes per session removes non-deterministic interleavings that were leaving the state machine in a "both answered but not advanced" state.

- [x] **Added stale-state recovery path inside Round 1 progression logic:**
    - [x] Refactored progression into `resolveRound1Progress(...)` so both new submissions and duplicate submissions use the same advancement decision.
    - [x] Added guard that checks current session question ID before advancing, avoiding accidental double-advance on stale duplicate events.
    - [x] Added duplicate-submission recovery: if both answers already exist for the current question, a duplicate submit now safely triggers advancement instead of returning early.
    - [x] Added hydration-time recovery in `getCurrentQuestionForUser(...)`: when both answers already exist for the current Round 1 question, the API now advances session state before returning payload.
    - [x] **Why this change:** this self-heals sessions that were already stuck before the lock-based fix was deployed.

- [x] **Added regression test coverage in backend service tests:**
    - [x] Added `testSubmitAnswer_DuplicateAfterBothAnswersRecorded_RecoversStuckWaitingState` in `backend/src/test/java/com/onlyyours/service/GameServiceTest.java`.
    - [x] Test verifies that when both answers are present and a duplicate submit occurs, the session advances to question 2.
    - [x] **Why this change:** reproduces the formerly stuck state in a deterministic test and guards against future regressions.

- [ ] **Runtime validation follow-up (manual):**
    - [ ] Execute two-device Round 1 with near-simultaneous answer taps on question 1.
    - [ ] Confirm logs show one `Waiting for partner` and one `Both players answered ... Advancing...` for the same question.
    - [ ] Capture evidence in `PHASE_D_MANUAL_VALIDATION_RUN.md` under runtime defect retest notes.

