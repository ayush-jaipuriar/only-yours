# Comprehensive Study Guide: Sprints 1-3 (Detailed Edition)

This document provides a deep dive into the technical concepts, architecture, and implementation details of the "Only Yours" application, consolidating the work done in the first three sprints. Use this guide to understand the "what," "why," and "how" of each component, from backend to frontend.

---

## Part 1: Backend Concepts (Spring Boot)

The backend is built on Spring Boot, following a layered architecture to ensure a clean separation of concerns.

### Section 1.1: Core Authentication & Security (Sprint 1)

This section covers the foundational security layer that protects the entire API.

#### A. The Authentication Framework: OAuth 2.0 & OpenID Connect (OIDC)

*   **What is it?**
    *   **OAuth 2.0** is an industry-standard protocol for **authorization**. It provides a secure way for a third-party application (our app) to obtain limited access to a user's account on a service like Google, without the user having to share their password. It defines roles like Resource Owner (the user), Client (our app), Authorization Server (Google), and Resource Server (Google's APIs).
    *   **OpenID Connect (OIDC)** is a thin identity layer built on top of OAuth 2.0. While OAuth 2.0 is about granting permissions (what you can *do*), OIDC is about proving **authentication**—verifying who a user *is*. It introduces a special type of token called the `id_token`.

*   **Why is it important?**
    This is the most secure and standard way to implement third-party login. We delegate the complex and critical task of user authentication to Google's robust infrastructure instead of managing user passwords ourselves. The `id_token` from Google gives us cryptographic proof of the user's identity, which we can trust.

*   **How was it used?**
    The core of this process happens in our `AuthService.java`.
    1.  The frontend app uses the Google Sign-In SDK to get an `id_token`.
    2.  This token is sent to our backend's `/api/auth/google/signin` endpoint.
    3.  The `authenticateGoogleUser` method in `AuthService.java` receives this token. It then uses Google's `GoogleIdTokenVerifier` library to validate it. This single verification step is crucial: it confirms the token's signature (proving it came from Google), its expiration time, and its `audience` claim (proving it was intended for our specific application).

    ```java
    // Snippet from AuthService.java
    GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(transport, jsonFactory)
        .setAudience(Collections.singletonList(googleClientId))
        .build();

    GoogleIdToken idToken = verifier.verify(idTokenString); // This is the key verification step
    if (idToken != null) {
        Payload payload = idToken.getPayload();
        // ... extract user info and provision user in our database
    }
    ```

#### B. The Session Artifact: JSON Web Tokens (JWTs)

*   **What is it?**
    A JWT is a compact, URL-safe means of representing claims to be transferred between two parties. After we verify a user's identity with Google, we create our *own* JWT to manage their session within our application. A JWT consists of three parts separated by dots (`.`):
    1.  **Header**: JSON describing the token, including the signing algorithm (e.g., `HS256`)
    2.  **Payload**: JSON containing "claims" about the user, like their email (`sub`), when the token was issued (`iat`), and when it expires (`exp`).
    3.  **Signature**: A cryptographic signature created by signing the Header and Payload with a secret key known only to the server.

*   **Why use JWTs for a Stateless Architecture?**
    *   **Stateless:** This is the key advantage. The server does not need to store any session information in memory or a database. All the necessary information to identify the user is in the token itself. This makes the application highly scalable.
    *   **Self-contained:** The token contains the user's identity.
    *   **Secure:** The signature ensures that the token hasn't been tampered with. The server can verify the signature on every request to ensure the token's integrity. If a malicious user changes the payload (e.g., tries to change the email to impersonate someone else), the signature will become invalid.

*   **How was it used?**
    *   `JwtService.java` is the dedicated service for all JWT operations: generating, validating, and extracting claims.
    *   After `AuthService` authenticates a user, it calls `JwtService.generateToken()` to create a token. This method sets the claims and signs it with a secret key stored in our `application.properties`.
    *   The generated token is sent back to the client inside the `AuthResponseDto`.

    ```java
    // Snippet from JwtService.java (simplified)
    public String generateToken(UserDetails userDetails) {
        return Jwts.builder()
                .setSubject(userDetails.getUsername()) // user's email
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60 * 24)) // 24 hours
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }
    ```

#### C. The API Gatekeeper: Spring Security & The Filter Chain

*   **What is it?**
    Spring Security is a powerful framework that handles authentication and authorization. Its core concept is the **Servlet Filter Chain**. Every incoming HTTP request passes through a series of "filters" before it reaches a controller. Each filter can inspect the request, modify it, or even reject it.

*   **Why is it essential?**
    It's the gatekeeper for our API. It enforces our security rules, ensuring that only authenticated users can access protected resources.

*   **How was it used?**
    1.  **`SecurityConfig.java`**: This is where we define our security rules using a `SecurityFilterChain`. We configured it to allow public access to `/api/auth/**` (so users can log in) but require authentication for all other requests (`.anyRequest().authenticated()`). We also explicitly add our custom filter to the chain.

        ```java
        // Snippet from SecurityConfig.java
        @Bean
        public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
            http
                // ... csrf disabled ...
                .authorizeHttpRequests(auth -> auth
                    .requestMatchers("/api/auth/**").permitAll()
                    .anyRequest().authenticated()
                )
                // ... other configs ...
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class); // Add our filter
            return http.build();
        }
        ```
    2.  **`JwtAuthFilter.java`**: This is our custom filter. For every request to a protected endpoint, its `doFilterInternal` method is executed:
        *   It looks for an `Authorization: Bearer <token>` header.
        *   It extracts the JWT string.
        *   It uses `JwtService` to validate the token.
        *   If the token is valid, it retrieves the user's details and creates an `Authentication` object.
        *   Crucially, it sets this object in the **`SecurityContextHolder`**. This is a thread-local storage that holds the security context for the current request. Once the `Authentication` object is set here, Spring Security considers the user to be authenticated for the remainder of the request's lifecycle.

---

### Section 1.2: Application Logic & Data Management (Sprints 2 & 3)

This section covers how we structure our code, interact with the database, and manage data.

#### A. The Layered Architecture

*   **What is it?**
    We organize our code into three main layers, a standard practice in enterprise applications:
    1.  **Controller (`@RestController`)**: The outermost layer. Its only job is to handle HTTP requests, validate and parse inputs, and call the appropriate service method. It is the entry point to our API. (e.g., `AuthController`, `CoupleController`).
    2.  **Service (`@Service`)**: This is the "business logic" layer. It contains the core application logic, coordinates between different repositories and other services, and handles transactions. It's the "brains" of the application. (e.g., `AuthService`, `CoupleService`).
    3.  **Repository (extends `JpaRepository`)**: The data access layer. Its only job is to interact with the database. It provides an abstraction over the raw database operations. (e.g., `UserRepository`, `CoupleRepository`).

*   **Why use it?**
    This **separation of concerns** is critical for building maintainable software. It makes the code much easier to read, test (you can test the service layer with mock repositories), and reason about. Each layer has a distinct and well-defined responsibility.

#### B. Data Transfer Objects (DTOs)

*   **What are they?**
    DTOs are simple Plain Old Java Objects (POJOs) used to transfer data between the client and server. They define the "shape" or "contract" of our API's data. (e.g., `UserDto`, `CoupleDto`, `CategoryDto`).

*   **Why are they important?**
    *   **API Contract:** They provide a stable contract for our API. Our internal database models (`@Entity` classes) can be complex and may change, but we can keep the DTOs the same to avoid breaking the frontend.
    *   **Security:** They are essential for security, as they prevent us from accidentally exposing sensitive or internal-only data. For example, our `User` entity has a `googleId` and may have other internal fields, but the `UserDto` only exposes the `id`, `name`, and `email` that the client needs.
    *   **Efficiency:** They can be tailored to specific API responses, sending only the data that is necessary, which can reduce payload size.

#### C. JPA Repositories & Custom Queries

*   **What is it?**
    Spring Data JPA is a powerful abstraction that dramatically simplifies database access. By creating an interface that extends `JpaRepository<EntityType, IdType>`, we get a full set of CRUD (Create, Read, Update, Delete) methods for that entity without writing a single line of implementation code. We can also define our own custom query methods simply by declaring their method signatures.

*   **Why use it?**
    It dramatically reduces the amount of boilerplate code we need to write for database operations, which is often tedious and error-prone.

*   **How was it used?**
    In `CoupleRepository.java`, we needed to find couples in specific ways. Instead of writing JPQL or SQL queries, we just declared method signatures with a specific naming convention, and Spring Data JPA provides the implementation at runtime.

    ```java
    // Snippet from CoupleRepository.java
    public interface CoupleRepository extends JpaRepository<Couple, UUID> {
        Optional<Couple> findByLinkCode(String linkCode); // Finds a couple by their unique invite code.

        // Finds the couple that a specific user belongs to, checking both user1 and user2 slots.
        Optional<Couple> findByUser1_IdOrUser2_Id(UUID user1Id, UUID user2Id);
    }
    ```

#### D. Database Migrations with Flyway

*   **What is it?**
    Flyway is a tool that brings the concept of version control to your database schema. You write your schema changes (like `CREATE TABLE`) and data insertions (like `INSERT INTO`) in plain SQL files with a versioned naming convention (e.g., `V1__...`, `V2__...`).

*   **Why is it important?**
    *   **Consistency & Reproducibility:** It solves the "it works on my machine" problem for databases. It ensures that every developer's local database and the production database are in the exact same state.
    *   **Automation:** When the Spring Boot application starts, Flyway automatically checks its metadata table in the database, sees if there are new migration scripts in the classpath that haven't been run, and applies them in order.

*   **How was it used?**
    *   `V1__Initial_Schema.sql`: This file contained the `CREATE TABLE` statements for all our initial entities like `users`, `couples`, `questions`, etc.
    *   `V2__Seed_Initial_Data.sql`: This file contained `INSERT INTO` statements to populate the `question_categories` and `questions` tables with initial content, making the game playable immediately after a fresh setup.

---

### Section 1.3: Real-time Communication (Sprint 3)

This section covers the technology stack for real-time game updates.

#### A. WebSocket, STOMP, and SockJS

*   **What are they?**
    *   **WebSocket:** A communication protocol that provides a **full-duplex** (two-way), persistent communication channel over a single TCP connection. Unlike HTTP's request-response model, once a WebSocket connection is established, the server can push data to the client at any time without the client having to ask for it.
    *   **STOMP:** The Simple Text Oriented Messaging Protocol. WebSocket itself is very low-level; it doesn't define message formats or topics. STOMP is a higher-level protocol that runs *on top of* WebSocket and adds a message-broker-like structure. It allows clients to send messages to and subscribe to named destinations (e.g., `/topic/game-updates/123`).
    *   **SockJS:** A browser JavaScript library that provides a WebSocket-like object. It's a **fallback mechanism**. If a client's network or browser doesn't support WebSocket, SockJS will automatically use other techniques (like HTTP long polling) to simulate a real-time connection, ensuring wide compatibility.

*   **Why this stack?**
    It provides a robust, standardized, and compatible way to implement real-time features. WebSocket is efficient, STOMP simplifies the messaging logic by adding a pub/sub model, and SockJS ensures our application works for the widest possible audience.

*   **How was it used?**
    In `WebSocketConfig.java`, we use the `@EnableWebSocketMessageBroker` annotation and configure our STOMP endpoint.

    ```java
    // Snippet from WebSocketConfig.java
    @Configuration
    @EnableWebSocketMessageBroker
    public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
        @Override
        public void configureMessageBroker(MessageBrokerRegistry config) {
            config.enableSimpleBroker("/topic", "/user"); // Enables a broker for pub/sub
            config.setApplicationDestinationPrefixes("/app"); // Prefix for messages bound for @MessageMapping methods
        }

        @Override
        public void registerStompEndpoints(StompEndpointRegistry registry) {
            registry.addEndpoint("/ws").setAllowedOrigins("*").withSockJS(); // The public endpoint clients connect to
        }
    }
    ```

#### B. WebSocket Security

*   **What's the challenge?**
    Authentication for WebSockets is different from REST APIs. The JWT can't be sent in a header on *every* message because it's a single, persistent connection. We need to authenticate the user *once*, at the moment they connect, and associate that identity with their session.

*   **How was it solved?**
    We used a `ChannelInterceptor` in `WebSocketSecurityConfig.java`. A channel interceptor allows us to tap into the messaging infrastructure.
    1.  When the frontend client tries to connect, it sends the JWT in a native header of the initial STOMP `CONNECT` message.
    2.  Our custom interceptor, which implements `ChannelInterceptor`, has a `preSend` method. This method is triggered for every message. We check if the message is a `CONNECT` message.
    3.  If it is, we extract the `Authorization` header, parse the JWT, and use our existing `JwtService` to validate it.
    4.  If validation succeeds, we create a Spring Security `Authentication` object and associate it with the message headers. This effectively attaches the user's identity (`Principal`) to their WebSocket session.
    5.  All subsequent messages and subscriptions on that connection are now trusted and linked to that user. This is an elegant solution as it reuses our existing JWT logic, keeping a single, consistent source of authentication.

---

## Part 2: Frontend Concepts (React Native)

The frontend is built with React Native, focusing on a clean user experience and a logical separation of concerns.

### Section 2.1: Authentication Flow & API Communication (Sprint 1)

This section covers how the user logs in and how we communicate securely with the backend.

#### A. Google Sign-In & Token Management

*   **What is it?**
    We use two key libraries: `@react-native-google-signin/google-signin` to trigger the native Google login flow on the device, and `@react-native-async-storage/async-storage` to securely persist the session token on the device's storage.

*   **Why this approach?**
    *   **Native Experience:** Using the official library provides a seamless and familiar login experience for the user, using the accounts already on their device.
    *   **Secure & Persistent Storage:** `AsyncStorage` is the standard way to persist small amounts of key-value data on the device. Storing the JWT here allows the user to close and reopen the app without having to log in again.

*   **How was it implemented?**
    1.  In `SignInScreen.js`, the "Sign in with Google" button has an `onPress` handler.
    2.  This handler first calls `await GoogleSignin.signIn();`. This opens the native Google UI.
    3.  On success, this returns a user object containing the crucial `idToken`.
    4.  We then make a `POST` request to our backend's `/api/auth/google/signin` endpoint, sending the `idToken`.
    5.  Our backend verifies it and returns our own application-specific JWT.
    6.  We then call `await AsyncStorage.setItem('userToken', response.data.token);` to save the token.
    7.  Finally, we update our application's global state to reflect that the user is now logged in.

#### B. Authenticated API Client (`axios` Interceptors)

*   **What is it?**
    In `src/services/api.js`, we do not export a raw `axios` object. Instead, we create a single, pre-configured `axios` instance. We then attach an **interceptor** to it. An interceptor is a function that `axios` will run *before* every single API request is sent.

*   **Why is it a powerful pattern?**
    It completely abstracts away token management from the rest of the application. Any component or service can now import this `api` object and make a request (e.g., `api.get('/user/me')`) without ever needing to know where or how the auth token is stored. The interceptor handles the job of retrieving the token from `AsyncStorage` and adding the `Authorization: Bearer ...` header to every outgoing request.

    ```javascript
    // Snippet from src/services/api.js
    import axios from 'axios';
    import AsyncStorage from '@react-native-async-storage/async-storage';

    const api = axios.create({
      baseURL: 'http://localhost:8080', // Or your server URL
    });

    api.interceptors.request.use(async (config) => {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    export default api;
    ```

---

### Section 2.2: State Management & Navigation (Sprints 1, 2, & 3)

This section covers how we manage the application's state and UI flow.

#### A. Global State with React Context (`AuthContext`)

*   **What is it?**
    React's Context API is a mechanism for sharing state that can be considered "global" for a tree of React components, such as the current authenticated user. We created an `AuthContext.js` to provide the authentication state (`isLoggedIn`, `userToken`) and the functions to modify it (`login`, `logout`) to any component that needs it. The `AuthProvider` component wraps our entire application in `App.js`, making the context available everywhere.

*   **Why use it?**
    It prevents "prop drilling"—the tedious process of passing data down through many layers of nested components. It provides a single, clean source of truth for the user's session status. Any component can simply "subscribe" to this context using the `useContext` hook to access the state or actions.

#### B. Conditional Navigation (`AppNavigator.js`)

*   **What is it?**
    Our main navigator, built with React Navigation, uses the `isLoggedIn` value from our `AuthContext` to decide which set of screens to render. This is a form of conditional rendering at the highest level of the application's UI.

*   **Why is it important?**
    It creates a clean and secure separation between the public and private parts of the app. It automatically and instantly directs the user to the correct UI flow based on their session status. If the user is logged out, the sign-in screen is the only thing they can see. The moment they log in, the state changes, and the navigator swaps out the sign-in screen for the main authenticated app screens.

    ```javascript
    // Snippet from AppNavigator.js (conceptual)
    import { useAuth } from '../state/AuthContext';

    const AppNavigator = () => {
      const { isLoggedIn } = useAuth();

      return (
        <NavigationContainer>
          <Stack.Navigator>
            {isLoggedIn ? (
              <>
                <Stack.Screen name="Dashboard" component={DashboardScreen} />
                <Stack.Screen name="Profile" component={ProfileScreen} />
              </>
            ) : (
              <Stack.Screen name="SignIn" component={SignInScreen} />
            )}
          </Stack.Navigator>
        </NavigationContainer>
      );
    };
    ```

---

### Section 2.3: Real-time Client (Sprint 3)

This section covers how the frontend connects to the real-time backend service.

#### A. WebSocket Client Libraries

*   **What are they?**
    We use `@stomp/stompjs` and `sockjs-client` in the frontend. These libraries are the client-side counterparts to our backend WebSocket configuration. They are specifically chosen to work together. `sockjs-client` handles the underlying connection (and fallback), and `@stomp/stompjs` handles the STOMP messaging protocol on top of that connection.

*   **Why use them?**
    They handle the immense complexity of the STOMP protocol (frames, heart-beating, acknowledgements) and the SockJS fallback mechanism, providing a clean, modern, event-driven API for connecting, subscribing to topics, and sending messages.

#### B. WebSocket Service Abstraction

*   **What is it?**
    Similar to our `api.js` service for REST calls, we created a `WebSocketService.js` to act as a singleton manager for our WebSocket connection. It encapsulates all connection logic and exposes a simple API.

*   **Why is it a good practice?**
    *   **Separation of Concerns:** UI components should not be responsible for managing network connections. Their job is to display data and handle user input. This service separates the "how" of real-time communication from the components that use it.
    *   **Singleton Instance:** It ensures we only ever have one WebSocket connection active for the entire application, preventing bugs and unnecessary server load. The service holds the client instance and manages its state.

#### C. Tying WebSocket Lifecycle to Auth State

*   **What is the goal?**
    The WebSocket connection is a privileged connection that should only be active when a user is authenticated and logged in.

*   **How was it achieved?**
    This is one of the most elegant parts of the architecture. We integrated the `WebSocketService` directly into our `AuthContext.js`:
    *   Inside the `login` function in `AuthContext`, after the user token is successfully retrieved and stored, we make a call to `WebSocketService.connect()`, passing the token.
    *   Inside the `logout` function, before clearing the user token, we call `WebSocketService.disconnect()`.

    This design elegantly and robustly ties the lifecycle of the real-time connection directly to the user's authentication session, ensuring we connect when we should and always clean up the connection when the session ends.
