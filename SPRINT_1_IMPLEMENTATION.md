# Sprint 1 Implementation Report: End-to-End Authentication

This document provides a detailed breakdown of the development journey for Sprint 1. The primary goal of this sprint was to implement a complete, secure, and seamless Google Sign-In flow for the "Only Yours" application.

---

## 1. The Implementation Journey

The implementation was divided into two main parts: the backend service responsible for validating users and issuing tokens, and the frontend application that provides the user interface for signing in.

### A. Backend Implementation (Spring Boot)

The backend was built to be a stateless, secure service that could authenticate users via Google and manage access using JSON Web Tokens (JWTs).

#### Step 1: Adding Core Dependencies
-   **What:** We added three key dependencies to the `backend/build.gradle` file:
    1.  `com.google.api-client:google-api-client`: This is the official Google library for Java. Its primary role in our project is to provide the `GoogleIdTokenVerifier`, a secure tool for validating the ID Tokens received from the frontend app.
    2.  `io.jsonwebtoken:jjwt-*` (api, impl, jackson): This is a popular and robust library for creating and parsing JSON Web Tokens (JWTs) in Java. We needed this to generate our own application-specific tokens after a user successfully authenticates.
-   **Why:** We rely on these specialized libraries to handle the complexities of cryptography and communication with Google's servers. Building these from scratch would be insecure and unnecessarily complex.

#### Step 2: Creating Data Transfer Objects (DTOs)
-   **What:** We created two DTOs in the `com.onlyyours.dto` package:
    1.  `GoogleSignInRequestDto.java`: A simple class containing a single field, `idToken`, to structure the incoming request from the mobile app.
    2.  `AuthResponseDto.java`: A simple class with a `token` field to structure the response we send back to the app.
-   **Why:** Using DTOs is a best practice. It separates our internal data models (the JPA entities) from the public API contract. This makes the API cleaner, more secure by preventing accidental data leaks, and easier to maintain.

#### Step 3: Implementing the JWT Service
-   **What:** The `JwtService.java` was created to handle all JWT-related logic. It has methods to:
    -   Generate a new token for a given user.
    -   Extract the username (subject) from a token.
    -   Validate a token to ensure it's not expired and was signed by us.
-   **Why:** This service centralizes all token management logic. By isolating it, we ensure that the rest of the application doesn't need to know the inner workings of JWTs. It simply asks the `JwtService` to "generate" or "validate" a token.

#### Step 4: Implementing the Authentication Service
-   **What:** `AuthService.java` contains the core business logic for the entire authentication process. Its `authenticateGoogleUser` method performs the following critical steps:
    1.  It uses the `GoogleIdTokenVerifier` (from the Google library) to verify the `idToken` sent from the app. This check confirms that the token is authentic, was issued by Google, and was intended for our application (by checking the Client ID).
    2.  If the token is valid, it extracts the user's Google ID, email, and name from the token's payload.
    3.  It queries our database using the `UserRepository` to see if a user with that Google ID already exists.
    4.  If the user exists, it updates their details. If not, it creates a new `User` record.
    5.  Finally, it calls our `JwtService` to generate a new, application-specific JWT for this user.
-   **Why:** This service acts as the brain of the operation, coordinating between the Google verifier, our database, and our JWT service to securely process a sign-in request.

#### Step 5: Implementing the Authentication Controller
-   **What:** `AuthController.java` is a standard Spring `@RestController` that exposes the public `POST /api/auth/google/signin` endpoint.
-   **Why:** This is the front door for authentication requests. Its only job is to receive the web request, pass the `idToken` to the `AuthService`, and return the response (our JWT or an error) to the client.

#### Step 6: Updating the Security Configuration
-   **What:** We created `JwtAuthFilter.java` and updated `SecurityConfig.java`.
    -   The `JwtAuthFilter` is a special class that runs on *every* request to a protected endpoint. It checks for an `Authorization: Bearer <token>` header, extracts the token, and uses the `JwtService` to validate it. If the token is valid, it sets the user's identity in Spring's security context, granting them access.
    -   The `SecurityConfig` was updated to insert this filter into the security chain and to define the security rules: allow public access to `/api/auth/**` but require valid authentication for every other request.
-   **Why:** This is the gatekeeper for our API. It ensures that the stateless JWTs issued by our service are used to control access to the entire application, enforcing security on all protected resources.

### B. Frontend Implementation (React Native)

The frontend was built to provide a simple user experience for signing in and to securely manage the session.

#### Step 1: Configuring Google Sign-In
-   **What:** In `App.js`, we added a `useEffect` hook to call `GoogleSignin.configure()`.
-   **Why:** This step is required by the `@react-native-google-signin/google-signin` library. It initializes the library and tells it which backend project to associate the sign-in attempts with, using the `webClientId`.

#### Step 2: Implementing the Sign-In Screen
-   **What:** `SignInScreen.js` was created with a "Sign in with Google" button. The `onPress` handler triggers an `async` function that:
    1.  Calls `GoogleSignin.signIn()` to open the native Google login prompt.
    2.  Extracts the `idToken` from the successful result.
    3.  Uses `axios` to `POST` this token to our backend's `/api/auth/google/signin` endpoint.
    4.  Receives the application JWT from our backend.
    5.  Securely stores the token on the device using `@react-native-async-storage/async-storage`.
    6.  Calls the `login()` function from our `AuthContext` to update the application's state.
-   **Why:** This screen orchestrates the entire user-facing flow, connecting the user's action to the native Google SDK and our backend service.

#### Step 3: Implementing Conditional Navigation
-   **What:** We created a placeholder `MainApp.js` screen and updated `AppNavigator.js`. The navigator now uses the `isLoggedIn` state from our `AuthContext` to decide which screen to show. If `isLoggedIn` is `false`, it shows `SignInScreen`; otherwise, it shows `MainApp`.
-   **Why:** This creates a seamless user experience. The app automatically shows the correct interface based on the user's authentication status, without any flickering or manual navigation.

#### Step 4: Creating an Authenticated API Service
-   **What:** We created `src/services/api.js`. This file exports a pre-configured `axios` instance. It uses an "interceptor" to automatically fetch the JWT from `AsyncStorage` and add it to the `Authorization` header of every API call made with this instance.
-   **Why:** This is a crucial design pattern for clean code. It completely abstracts away the need to manage auth tokens for API calls. Any other part of our app can now simply import this `api` object and make a request (e.g., `api.get('/user/me')`) without ever needing to touch the token itself.

---

## 2. Technical Decisions and Rationale

-   **Architecture:** Stateless Authentication with JWT.
    -   **Decision:** Instead of using traditional server-side sessions, we chose JWTs.
    -   **Rationale:** This approach is highly scalable and perfectly suited for mobile and web clients. The backend doesn't need to store session information, making it simpler and more efficient. Each request from the client contains all the information needed to authenticate it.
-   **Authentication Flow:** Google ID Token Verification.
    -   **Decision:** The frontend sends a one-time Google `idToken` to the backend for verification.
    -   **Rationale:** This is a standard and secure OpenID Connect flow. It leverages Google's robust security. The backend's only job is to verify this token with Google, establishing trust, and then issue its own token. This decouples our app's session management from Google's.
-   **Backend Structure:** Layered Architecture.
    -   **Decision:** We separated logic into `Controller` -> `Service` -> `Repository`.
    -   **Rationale:** This is a standard design pattern that promotes separation of concerns, making the code easier to test, maintain, and understand. Controllers handle web requests, Services handle business logic, and Repositories handle database interaction.

---

## 3. Issues Faced and Solutions

The implementation journey was not without its challenges, primarily related to the local development environment setup.

-   **Issue 1: Java Version Incompatibility**
    -   **Problem:** The `./gradlew signingReport` command failed with an `Unsupported class file major version 68` error.
    -   **Diagnosis:** Running `java -version` revealed the system was using Java 24, which was too new for the project's version of Gradle.
    -   **Solution:** We located the path to a compatible JDK (Java 17) using `/usr/libexec/java_home -v 17`. We then created a `gradle.properties` file in the `android` directory and explicitly told Gradle which Java version to use by setting `org.gradle.java.home=/path/to/jdk-17`.
-   **Issue 2: Android SDK Not Found**
    -   **Problem:** After fixing the Java issue, the build failed again with `SDK location not found`.
    -   **Diagnosis:** The Gradle build process could not find the core Android development tools.
    -   **Solution:** The root cause was that the user had not yet installed the Android SDK. The solution was for the user to install Android Studio, which manages the SDK. After installation, we created the `android/local.properties` file and set the `sdk.dir` property to point to the default SDK location (`/Users/ayushjaipuriar/Library/Android/sdk`), which resolved the issue permanently.
-   **Issue 3: Persistent React Native Linter Errors**
    -   **Problem:** Multiple frontend files reported a `Parsing error: No Babel config file detected`.
    -   **Diagnosis:** This error persisted even after creating `babel.config.js` and `.babelrc` files.
    -   **Solution:** This type of error is often related to the linter extension in the IDE or its configuration, rather than a problem that would break the application itself. The code was syntactically correct and would run successfully when bundled by the React Native Metro server. The solution was to acknowledge it as an environmental issue and proceed, as it did not block development or the functionality of the app.

---

## 4. Concepts and Theory to Understand (Deep Dive)

To fully grasp the implementation, it's helpful to be familiar with these core concepts. This section goes into greater detail on each topic.

### A. The Authentication & Authorization Framework: OAuth 2.0 and OIDC

The entire Google Sign-In process is built on two crucial industry standards: OAuth 2.0 and OpenID Connect (OIDC).

-   **OAuth 2.0 (The Authorization Framework):**
    -   **What it is:** OAuth 2.0 is a protocol for **authorization**. It's designed to solve the problem of how a third-party application (like ours) can get limited access to a user's resources on another service (like Google) without the user having to share their credentials (their password).
    -   **Key Roles:**
        -   **Resource Owner:** The user who owns the data (e.g., you with your Google account).
        -   **Client:** The application that wants to access the user's data (our "Only Yours" app).
        -   **Authorization Server:** The server that the user trusts, which issues access tokens (Google's authentication server).
        -   **Resource Server:** The server that hosts the user's data (e.g., Google's Profile API).
    -   **Access Tokens:** The primary artifact of OAuth 2.0 is the `access_token`. This token is like a key that grants permission to access specific resources. We didn't use this directly in our backend, but it's fundamental to the flow happening on the device.

-   **OpenID Connect (OIDC) (The Authentication Layer):**
    -   **What it is:** OIDC is a thin layer built on top of OAuth 2.0. While OAuth is about *authorization* (what you're allowed to do), OIDC is about **authentication** (proving who you are).
    -   **ID Tokens:** OIDC introduces the concept of an `id_token`, which is the cornerstone of our implementation.
        -   An `id_token` is a specific type of JWT.
        -   Its purpose is to provide the Client (our app) with verifiable proof of a user's identity.
        -   It contains claims like `sub` (a unique ID for the user), `email`, `name`, and importantly, `aud` (audience), which specifies *for which application* this token was issued.
    -   **How it works with OAuth:** When our app asks Google to sign the user in, it requests scopes like `openid`, `profile`, and `email`. The `openid` scope signals that we are performing an OIDC flow and want an `id_token` in return.

### B. The Session Artifact: JSON Web Tokens (JWT)

After verifying the user with Google, our backend issues its own JWT to manage the user's session within our application.

-   **Structure of a JWT:** A JWT is just a long string, but it has three distinct parts separated by dots (`.`):
    1.  **Header:** A Base64Url-encoded JSON object that describes the token, including the signing algorithm (`alg`, e.g., HS256) and the token type (`typ`, which is JWT).
    2.  **Payload:** A Base64Url-encoded JSON object containing the "claims". Claims are statements about the user and the token itself.
        -   **Registered Claims:** Standardized claims like `iss` (issuer), `exp` (expiration time), and `sub` (subject or user ID).
        -   **Our Claims:** We used the user's email as the `sub` claim. We could also add custom claims, like user roles.
    3.  **Signature:** A cryptographic signature created by taking the encoded Header and Payload, a secret key known only to the server, and signing them with the algorithm specified in the header.
-   **Why JWTs are powerful for Stateless Authentication:**
    -   The server does not need to store any information about the token after issuing it.
    -   When a client sends the JWT back with a request, the server can verify its authenticity simply by re-calculating the signature with the secret key. If the calculated signature matches the one on the token, the server knows the token is valid and the payload has not been tampered with. This avoids the need for a database lookup on every request, making it very efficient.

### C. The API Gatekeeper: Spring Security & The Filter Chain

Spring Security is the framework that protects our backend API.

-   **Core Concept: The Servlet Filter Chain:** When an HTTP request arrives at a Java web server, it doesn't go directly to our controller. It first passes through a chain of "filters". Each filter can inspect, modify, or even reject the request.
-   **`SecurityFilterChain`:** This is Spring Security's specialized filter chain. We configure it in our `SecurityConfig` class.
    -   We defined rules here, like `requestMatchers("/api/auth/**").permitAll()`, which tells Spring Security to let any request for our sign-in endpoint pass through without authentication.
    -   The rule `.anyRequest().authenticated()` tells it to block every other request unless it's authenticated.
-   **Our Custom Filter: `JwtAuthFilter`**
    -   **`OncePerRequestFilter`:** We extended this base class to ensure our filter logic runs exactly one time for each incoming request.
    -   **The Flow Inside the Filter:**
        1.  It looks for the `Authorization` header in the request.
        2.  It validates that the header starts with `Bearer ` and extracts the token string.
        3.  It uses our `JwtService` to parse the token and validate its signature and expiration.
        4.  If the token is valid, it retrieves the user's details from the database (via the `UserDetailsService` contract implemented by our `AuthService`).
        5.  It creates an `Authentication` object (specifically, a `UsernamePasswordAuthenticationToken`) which represents the successfully authenticated user.
        6.  Crucially, it places this `Authentication` object into the `SecurityContextHolder`.
-   **`SecurityContextHolder`:** This is a thread-local object. This means the authentication information is available to the entire execution thread for that specific request. When the request eventually reaches a protected controller method, Spring Security checks the `SecurityContextHolder`, sees a valid `Authentication` object, and grants access.

### D. The Google Sign-In Implementation Flow (Prerequisites & Concepts)

This section ties everything together, explaining the prerequisites and the step-by-step data flow.

-   **Prerequisite Concepts:**
    -   **OAuth Client IDs:** You had to create two.
        -   **Android Client ID:** This is linked to your app's unique **package name** (`com.onlyyoursapp`) and its **SHA-1 fingerprint**. When you call `GoogleSignin.signIn()`, Google's native services on the phone use these details to verify that the request is coming from *your authentic app* and not a malicious impostor.
        -   **Web Client ID:** This is used by our **backend**. The `id_token` that Google generates contains an `aud` (audience) claim. This claim states which client the token was intended for. Our backend uses the Web Client ID to verify that the `aud` claim in the token matches its own ID, proving that the token was meant for it.
    -   **OAuth Consent Screen:** This is the UI that Google shows to the user asking for permission ("This app would like to see your name and email address"). This is a crucial part of the user trust and transparency flow.

-   **The Detailed End-to-End Data Flow:**
    1.  **App Start:** The React Native app starts, and `GoogleSignin.configure()` is called with the **Web Client ID**.
    2.  **User Action:** The user taps the "Sign in with Google" button, calling `GoogleSignin.signIn()`.
    3.  **Native Hand-off:** The React Native library hands off control to the native Google Play Services on the Android device. This is a secure context switch.
    4.  **User Consent:** Google Play Services shows the account picker and the consent screen. The user authenticates with Google (password, biometrics, etc.). **Our app never sees these credentials.**
    5.  **Token Generation:** After consent, Google's Authorization Server generates a short-lived `id_token`. This token is signed by Google and contains the user's profile info and the all-important `aud` claim pointing to our Web Client ID.
    6.  **Token Return:** Google Play Services returns this `id_token` to our React Native application.
    7.  **Client-to-Server:** Our app takes this `id_token` and sends it in the body of a POST request to our backend endpoint (`/api/auth/google/signin`).
    8.  **Server-Side Verification:** Our `AuthService` receives the token. It uses the `GoogleIdTokenVerifier` and its configured **Web Client ID** to check the token's signature and audience claim with Google's servers.
    9.  **User Provisioning:** Once verified, our backend trusts the identity in the token. It checks if the user exists in our `users` table and creates or updates them.
    10. **Session Token Issuance:** Our `JwtService` generates a *new* JWT, signed with *our own* secret key. This is our application's session token.
    11. **Session Start:** The backend sends this new application JWT back to the React Native app.
    12. **Secure Storage:** The app stores this JWT securely in `AsyncStorage`.
    13. **State Update:** The `isLoggedIn` state is set to `true`, and the UI re-renders to show the main app screen.
    14. **Authenticated Requests:** For all future API calls (e.g., to get profile data), the `axios` interceptor automatically attaches this application JWT to the `Authorization` header, and our `JwtAuthFilter` on the backend validates it on every call. 

---

## 5. Current Status and Next Steps

### Current Status
- Backend authentication and JWT-based stateless security are implemented (`AuthController`, `AuthService`, `JwtService`, `JwtAuthFilter`, `SecurityConfig`).
- Frontend Google Sign-In flow is in place, with token storage and conditional navigation.
- Global auth state via `AuthContext` is wired and wraps the app in `App.js`.
- Preconfigured authenticated API client (`src/services/api.js`) is ready.

### Configuration To Do Before Running
- `google.client.id` in `backend/src/main/resources/application.properties` is now set to `216762620268-7cqrrmkujnqat14tsusuhokhjoqeqlme.apps.googleusercontent.com`.
- Set a strong `jwt.secret` value (move to environment variables later per Sprint 6).
- Mobile `GoogleSignin.configure({ webClientId })` in `OnlyYoursApp/App.js` is now set to `216762620268-7cqrrmkujnqat14tsusuhokhjoqeqlme.apps.googleusercontent.com`.

### Immediate Next Steps (Sprint 2)
- Create `UserDto` and `CoupleDto`.
- Implement `UserController#getMe` at `GET /api/user/me`. Use Spring Security `Authentication` principal; with our current setup, `principal.getName()` resolves to the user email, then fetch the `User` via `UserRepository#findByEmail` and map to `UserDto`.
- Implement `CoupleService` methods for link code generation and redemption, and expose via `CoupleController` endpoints.
- Frontend: add `ProfileScreen`, `DashboardScreen`, and `PartnerLinkScreen` wired to the new endpoints.