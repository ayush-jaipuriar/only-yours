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
- [ ] **Global State (Authentication):**
    - [ ] Create `AuthContext.js` in the `state` directory.
    - [ ] The context should provide `isLoggedIn` status, `user` data, and placeholder functions `login()` and `logout()`.
    - [ ] Wrap the `AppNavigator` in the `AuthProvider` in your main `App.js` file.

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
- [ ] **Authenticated API Service:**
    - [ ] Create an `axios` instance that automatically includes the JWT in the `Authorization` header for all subsequent requests.

---

## Sprint 2: Core Profile & Couple Linking (Week 3)

**Goal:** Enable users to view their basic profile and establish a permanent, two-way link with their partner's account using a unique, time-limited code.

### Backend Technical Tasks
- [ ] **DTOs:**
    - [ ] Create `UserDto.java` and `CoupleDto.java` to safely expose entity data to the client.
- [ ] **User Profile Endpoint:**
    - [ ] Implement `UserController.java`.
    - [ ] Create a secured `GET /api/user/me` endpoint.
    - [ ] Use the `Authentication` principal from Spring Security to get the current user's ID.
    - [ ] Fetch the full user object from the repository and return it as a `UserDto`.
- [ ] **Couple Linking Service (`CoupleService.java`):**
    - [ ] Implement `generateLinkCode(UUID userId)`. This should create a new `Couple` entity with `user1_id` set, generate a random 6-8 character alphanumeric string for `link_code`, and save it.
    - [ ] Implement `redeemLinkCode(UUID userId, String code)`. This will:
        - [ ] Find a `Couple` by `link_code`.
        - [ ] Validate that the code exists and has not been used (`user2_id` is null).
        - [ ] Validate that the redeemer (`userId`) is not the same as `user1_id`.
        - [ ] If valid, set `user2_id` to the current user's ID, nullify the `link_code`, and save the updated `Couple` entity.
- [ ] **Couple Linking Controller (`CoupleController.java`):**
    - [ ] Create a secured `POST /api/couple/generate-code` endpoint that calls the service and returns the code.
    - [ ] Create a secured `POST /api/couple/link` endpoint that accepts the code in a request body and calls the redeem service.
    - [ ] Create a secured `GET /api/couple` endpoint to fetch the details of the couple link if it exists.

### Frontend Technical Tasks
- [ ] **Profile Screen (`ProfileScreen.js`):**
    - [ ] On component mount (`useEffect`), make an authenticated `GET` request to `/api/user/me`.
    - [ ] Display the user's name and email.
    - [ ] Include a "Logout" button that clears `AsyncStorage` and calls the `logout()` function from `AuthContext`.
- [ ] **Dashboard Screen (`DashboardScreen.js`):**
    - [ ] On component mount, call `/api/couple`.
    - [ ] If the response is successful (200 OK), display "You are connected with [Partner's Name]".
    - [ ] If the response is a 404 Not Found, display a "Link with Partner" button that navigates to the `PartnerLinkScreen`.
- [ ] **Partner Linking Screen (`PartnerLinkScreen.js`):**
    - [ ] Create a UI with two sections: "Get a Code" and "Enter a Code".
    - [ ] The "Get a Code" section has a button that calls `POST /api/couple/generate-code` and displays the returned code.
    - [ ] Add a "Share" button that uses React Native's `Share` API to share the code.
    - [ ] The "Enter a Code" section has a `TextInput` for the code and a "Connect" button that calls `POST /api/couple/link`.
    - [ ] On a successful connection, navigate the user back to the dashboard, which should now re-fetch and show the linked status.

---

## Sprint 3: Game Setup & Real-time Foundation (Week 4)

**Goal:** Build the pre-game user flow (category selection) and establish the fundamental WebSocket infrastructure for real-time communication.

### Backend Technical Tasks
- [ ] **Database Seeding (via Flyway):**
    - [ ] Create a new Flyway migration script (e.g., `V2__Seed_Initial_Data.sql`) in `src/main/resources/db/migration`.
    - [ ] Add `INSERT` statements to this script to populate `question_categories` and a sample of `questions` for each category.
- [ ] **Content Endpoint:**
    - [ ] Implement `ContentController.java`.
    - [ ] Create a `GET /api/content/categories` endpoint that returns a list of all `CategoryDto`s.
- [ ] **WebSocket Configuration (`WebSocketConfig.java`):**
    - [ ] Annotate with `@Configuration` and `@EnableWebSocketMessageBroker`.
    - [ ] Implement the `WebSocketMessageBrokerConfigurer` interface.
    - [ ] In `registerStompEndpoints`, register a STOMP endpoint at `/ws` (with SockJS fallback).
    - [ ] In `configureMessageBroker`, enable a simple in-memory broker with destination prefixes `/topic` and `/user`.
    - [ ] Set the application destination prefix to `/app`.
- [ ] **WebSocket Security:**
    - [ ] Create a `ChannelInterceptor` to secure the WebSocket connection.
    - [ ] In the `preSend` method, intercept the `CONNECT` message.
    - [ ] Read the JWT from the STOMP headers.
    - [ ] Validate the token using `JwtService` and associate the authenticated user with the WebSocket session.
    - [ ] If the token is invalid, reject the connection.

### Frontend Technical Tasks
- [ ] **WebSocket Libraries:**
    - [ ] Install STOMP and SockJS clients: `npm install @stomp/stompjs sockjs-client`.
- [ ] **WebSocket Service (`WebSocketService.js`):**
    - [ ] Create a singleton service to manage the WebSocket connection.
    - [ ] Implement a `connect(jwt)` method that:
        - [ ] Instantiates a Stomp client.
        - [ ] Sets the `Authorization: Bearer ${jwt}` header for the connection.
        - [ ] Connects to the backend's `/ws` endpoint.
    - [ ] Implement `disconnect()`, `subscribe(topic, callback)`, and `sendMessage(destination, body)` methods.
- [ ] **Category Selection Screen (`CategorySelectionScreen.js`):**
    - [ ] On mount, fetch the list of categories from `/api/content/categories`.
    - [ ] Display the categories in a `<FlatList>` or similar scrollable view.
    - [ ] Each item should be a custom, pressable component (`CategoryCard.js`).
    - [ ] When a category marked as `is_sensitive` is pressed, show a native `Alert` for confirmation before proceeding.
- [ ] **WebSocket Integration:**
    - [ ] In the main app logic (e.g., after login in `AuthContext`), call `WebSocketService.connect(jwt)`.
    - [ ] Ensure the service gracefully handles disconnections and provides a mechanism to report connection status.

---

## Sprint 4: Core Gameplay - Round 1 (Answering) (Week 5)

**Goal:** Implement the first round of the core gameplay loop where both players synchronously answer a series of questions about themselves.

### Backend Technical Tasks
- [ ] **Game DTOs (WebSocket Payloads):**
    - [ ] Create POJOs for WebSocket messages: `GameInvitation.java`, `QuestionPayload.java`, `AnswerPayload.java`.
- [ ] **Game WebSocket Controller (`GameController.java`):**
    - [ ] Use the `@Controller` annotation (not `@RestController`).
    - [ ] **Invitation Flow:**
        - [ ] `@MessageMapping("/game.invite")`: Receives an invitation from a user (containing category ID). Creates a `game_sessions` record with `INVITED` status. Sends an invitation message to the partner's private queue (`/user/queue/game-events`) using `SimpMessagingTemplate`.
        - [ ] `@MessageMapping("/game.accept")`: Partner accepts the invitation.
    - [ ] **Game Logic (in `GameService`):**
        - [ ] On acceptance, load questions from the selected category.
        - [ ] Change game status to `ROUND1`.
        - [ ] Broadcast the first question to the game topic (`/topic/game/{sessionId}`).
    - [ ] **Answering Flow:**
        - [ ] `@MessageMapping("/game.answer")`: Receives an `AnswerPayload` from a player.
        - [ ] Persist the `round1_answer` in the `game_answers` table.
        - [ ] Check if both players have answered the current question.
        - [ ] If both have answered, broadcast the next question.
        - [ ] If only one has answered, wait.

### Frontend Technical Tasks
- [ ] **Global Game State (`GameContext.js`):**
    - [ ] Create a new context to manage the state of an active game: `sessionId`, `currentQuestion`, `players`, `scores`, etc.
- [ ] **Invitation Handling:**
    - [ ] On the `DashboardScreen`, the "Start New Game" button navigates to `CategorySelectionScreen`.
    - [ ] Selecting a category sends a `/app/game.invite` message via the `WebSocketService`.
    - [ ] The `WebSocketService` must listen on the private `/user/queue/game-events` topic.
    - [ ] When an invitation message is received, show an `Alert` with "Accept" and "Decline" buttons.
    - [ ] Tapping "Accept" sends a `/app/game.accept` message and navigates both players to the `GameScreen`.
- [ ] **Game Screen Implementation (`GameScreen.js`):**
    - [ ] Subscribe to the game topic: `/topic/game/{sessionId}`.
    - [ ] When a `QuestionPayload` message arrives, update the component's state to display the question text and answer options.
    - [ ] The prompt should read "How would you answer?".
    - [ ] When the user selects an answer and clicks "Submit", send a `/app/game.answer` message with the question ID and selected option.
    - [ ] After submitting, show a loading/waiting indicator until the next question arrives from the server.

---

## Sprint 5: Core Gameplay - Round 2 (Guessing) & Results (Week 6)

**Goal:** Complete the core gameplay loop by implementing the guessing round (Round 2) and displaying the final scores.

### Backend Technical Tasks
- [ ] **Game State Transition:**
    - [ ] In `GameService`, after the last question of Round 1 is answered by both players, update the game status to `ROUND2`.
    - [ ] Broadcast the first question again, but with a payload indicating it's the guessing round.
- [ ] **Guessing Logic:**
    - [ ] `@MessageMapping("/game.guess")`: Receives a guess from a player.
    - [ ] Persist the guess to the `round2_guess` column in the `game_answers` table.
    - [ ] Fetch the partner's actual `round1_answer` for that same question.
    - [ ] Send a private message back to the guessing player with the result (e.g., `{ correct: true/false, partnerAnswer: 'C' }`).
    - [ ] Check if both players have guessed the current question. If so, broadcast the next question for guessing.
- [ ] **Scoring and Completion:**
    - [ ] After the last guess of Round 2, trigger a scoring calculation.
    - [ ] In `GameService`, query the `game_answers` table for the session, and calculate scores for each player.
    - [ ] Update the `game_sessions` status to `COMPLETED`.
    - [ ] Broadcast a final `ResultsPayload` (with both players' scores) to the game topic.

### Frontend Technical Tasks
- [ ] **Game Screen Update for Round 2:**
    - [ ] When a question payload for Round 2 arrives, update the UI prompt to "How did [Partner's Name] answer?".
    - [ ] Listen for the private guess feedback message on a user-specific queue.
    - [ ] On receipt, briefly display the result (e.g., "Correct! Your partner chose [Answer]") before the next question loads.
- [ ] **Results Screen (`ResultsScreen.js`):**
    - [ ] When the final `ResultsPayload` arrives on the game topic, navigate to this new screen.
    - [ ] Display the final scores for both players in a celebratory, visually appealing format.
    - [ ] Include a "Play Again" button that navigates back to the `CategorySelectionScreen`.
    - [ ] Include a "Back to Dashboard" button.

---

## Sprint 6: Testing, Polish & MVP Release Prep (Week 7)

**Goal:** Conduct comprehensive end-to-end testing, refine the UI/UX, and prepare the application for a production release.

### Backend Technical Tasks
- [ ] **Integration Testing:**
    - [ ] Use `@SpringBootTest` to write integration tests for the authentication flow.
    - [ ] Write tests for the REST controllers (`UserController`, `CoupleController`).
    - [ ] Use a test-specific profile to connect to an in-memory database (like H2) or a dedicated test PostgreSQL instance.
- [ ] **Logging & Monitoring:**
    - [ ] Review all service methods and ensure appropriate `slf4j` logging is in place for key events and errors.
    - [ ] Enable Spring Boot Actuator and expose the `/health` and `/metrics` endpoints for production monitoring.
- [ ] **Configuration & Security Hardening:**
    - [ ] Move all secrets (JWT secret, Google client secret, database password) from `application.properties` to be read from environment variables.
- [ ] **Containerization:**
    - [ ] Create a `Dockerfile` in the project root to build a container image of the Spring Boot application.
    - [ ] Test the Docker build locally.

### Frontend Technical Tasks
- [ ] **UI/UX Polish:**
    - [ ] Add loading spinners for all network requests.
    - [ ] Create and implement empty state components (e.g., for the category list if it fails to load).
    - [ ] Ensure smooth screen transitions and animations.
    - [ ] Review and refine all copy and user-facing text.
- [ ] **Error Handling:**
    - [ ] Implement global error handling for `axios` requests to show user-friendly alerts.
    - [ ] Add robust error handling for WebSocket connection issues (e.g., display a "reconnecting" banner).
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