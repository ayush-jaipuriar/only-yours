# Sprint 6 Plan: Testing, Polish & MVP Release Prep

**Sprint:** 6  
**Goal:** Conduct comprehensive testing, refine UI/UX, harden configuration, and prepare the application for production deployment.  
**Status:** 📋 PLANNING  
**Date:** February 21, 2026  

---

## Table of Contents

1. [Sprint Overview](#1-sprint-overview)
2. [Technical Background & Concepts](#2-technical-background--concepts)
3. [Phase 1: Backend Integration Testing](#3-phase-1-backend-integration-testing)
4. [Phase 2: Logging & Monitoring (Spring Actuator)](#4-phase-2-logging--monitoring-spring-actuator)
5. [Phase 3: Configuration & Security Hardening](#5-phase-3-configuration--security-hardening)
6. [Phase 4: Containerization (Docker)](#6-phase-4-containerization-docker)
7. [Phase 5: Frontend UI/UX Polish](#7-phase-5-frontend-uiux-polish)
8. [Phase 6: Frontend Error Handling](#8-phase-6-frontend-error-handling)
9. [Phase 7: Automated Test Suite Execution](#9-phase-7-automated-test-suite-execution)
10. [Implementation Checklist](#10-implementation-checklist)
11. [Files to Create / Modify](#11-files-to-create--modify)
12. [Out of Scope (Infrastructure)](#12-out-of-scope-infrastructure)

---

## 1. Sprint Overview

Sprint 6 is the final sprint of the MVP development cycle. The core gameplay (Round 1 → Round 2 → Results) was completed in Sprint 5 with 91 automated tests (70 backend + 21 frontend) all passing. Sprint 6 focuses on making the application **production-ready** by:

| Area | What We'll Do |
|------|---------------|
| **Testing** | Comprehensive integration tests for auth flow, REST controllers, and full game lifecycle |
| **Observability** | Structured logging across all services + Spring Boot Actuator for `/health` and `/metrics` |
| **Configuration** | Externalize all secrets to environment variables; create prod application profile |
| **Containerization** | Multi-stage Dockerfile + docker-compose for local orchestration |
| **Frontend Polish** | Loading spinners, empty states, global error handling, WebSocket reconnection banner |
| **Documentation** | Update all .md files; final project status update |

---

## 2. Technical Background & Concepts

### 2.1 Integration Testing vs Unit Testing

**Unit Tests** (what we have 91 of) test individual methods/classes in isolation using mocks:
- `GameServiceTest`: GameService methods with mocked repositories
- `RestControllerTest`: Controllers with MockMvc (no real HTTP)

**Integration Tests** test the full stack together with a real (in-memory H2) database:
- `@SpringBootTest` boots the full Spring context
- `@AutoConfigureMockMvc` provides a real HTTP client
- Flyway is disabled; H2 schema created by Hibernate
- Tests verify end-to-end behavior: HTTP request → Controller → Service → Repository → H2 DB → HTTP response

**Why integration tests matter:** Unit tests can pass while integration tests fail due to misconfigured beans, wrong Spring Security rules, or JPA relationship issues that only surface with a real database.

### 2.2 Spring Boot Actuator

Spring Boot Actuator is a production-readiness library that exposes operational endpoints:
- `/actuator/health` → Returns `{"status": "UP"}` — used by load balancers and Kubernetes probes
- `/actuator/metrics` → Returns JVM metrics, request counts, cache stats, etc.
- `/actuator/info` → Application metadata

Actuator endpoints can be secured (require auth) or made public. We'll expose `/health` publicly (for infrastructure use) and restrict `/metrics` to authorized clients.

### 2.3 Environment-Based Configuration

The 12-Factor App methodology requires **configuration to be in the environment**, not committed to source code. This means:
- `application.properties` contains non-sensitive defaults
- Sensitive values (JWT secret, DB password, Google client secret) come from OS environment variables or a `.env` file
- Spring Boot reads environment variables via `${VARIABLE_NAME:default_value}` syntax
- A production `application-prod.properties` profile enables production-specific settings (Actuator, stricter security)

### 2.4 Multi-Stage Docker Build

A multi-stage Dockerfile has two stages:
1. **Build stage**: Uses a full JDK image to compile the Java application (`./gradlew bootJar`)
2. **Runtime stage**: Uses a minimal JRE image (Eclipse Temurin Alpine) to run the compiled JAR

This reduces the final image size from ~600MB (full JDK) to ~150MB (JRE only). The compiled JAR is copied from the build stage to the runtime stage.

### 2.5 Frontend Loading States

React Native best practices for loading states:
- Each screen has a `loading` boolean state initialized to `true`
- API calls are wrapped in `try/finally` to guarantee `setLoading(false)` even on error
- `ActivityIndicator` is shown while `loading === true`
- An empty state component (custom illustration or text) is shown when data is empty

### 2.6 Global Axios Error Interceptor

Instead of writing error handling in every API call, Axios supports **interceptors** — middleware functions that run before/after every request/response:
```javascript
apiClient.interceptors.response.use(
  response => response,                          // pass-through on success
  error => {                                     // runs on any HTTP error
    if (error.response?.status === 401) { /* force logout */ }
    return Promise.reject(error);                // propagate for local handling
  }
);
```

### 2.7 WebSocket Reconnection

The current `WebSocketService.js` has basic retry logic but no user-visible indicator. We'll add:
- A React context value `wsConnected` (boolean)
- A `ReconnectionBanner` component that slides in from the top when `wsConnected === false`
- The WebSocket service emits connection state changes via a callback

---

## 3. Phase 1: Backend Integration Testing

### 3.1 New Integration Test: `AuthFlowIntegrationTest.java`

**Location:** `backend/src/test/java/com/onlyyours/integration/AuthFlowIntegrationTest.java`

**Tests to implement:**

| # | Test Name | What It Verifies |
|---|-----------|------------------|
| 1 | `testGoogleSignInWithInvalidToken_Returns401` | POST `/api/auth/google/signin` with garbage token → 401/400 |
| 2 | `testProtectedEndpointWithoutToken_Returns403` | GET `/api/user/me` with no token → 403 |
| 3 | `testProtectedEndpointWithValidToken_Returns200` | GET `/api/user/me` with valid JWT → 200 with user data |
| 4 | `testJwtExpiry_ExpiredTokenReturns403` | Expired JWT → 403 |
| 5 | `testCoupleEndpointWithoutPartner_Returns404` | GET `/api/couple` for user with no partner → 404 |

**Strategy:** Use `@SpringBootTest(webEnvironment = RANDOM_PORT)`, seed test data manually via repositories (no need to call Google API — use a pre-built valid JWT from JwtService directly).

### 3.2 New Integration Test: `CoupleFlowIntegrationTest.java`

**Location:** `backend/src/test/java/com/onlyyours/integration/CoupleFlowIntegrationTest.java`

**Tests to implement:**

| # | Test Name | What It Verifies |
|---|-----------|------------------|
| 1 | `testGenerateLinkCode_Success` | POST `/api/couple/generate-code` → returns 6-8 char code |
| 2 | `testRedeemLinkCode_Success` | Two users: User1 generates code, User2 redeems → couple formed |
| 3 | `testRedeemOwnCode_ReturnsBadRequest` | User1 tries to redeem their own code → 400 |
| 4 | `testGetCouple_AfterLinking_Returns200` | GET `/api/couple` after linking → 200 with partner info |
| 5 | `testGetCouple_BeforeLinking_Returns404` | GET `/api/couple` before linking → 404 |

### 3.3 New Integration Test: `ContentIntegrationTest.java`

**Location:** `backend/src/test/java/com/onlyyours/integration/ContentIntegrationTest.java`

| # | Test Name | What It Verifies |
|---|-----------|------------------|
| 1 | `testGetCategories_Returns200WithList` | GET `/api/content/categories` → 200 + non-empty list |
| 2 | `testGetCategories_WithoutAuth_Returns403` | GET `/api/content/categories` without JWT → 403 |

### 3.4 Test Infrastructure Changes

- Create `backend/src/test/java/com/onlyyours/integration/` package
- Create a `BaseIntegrationTest.java` superclass with shared setup:
  - `@SpringBootTest(webEnvironment = RANDOM_PORT)`
  - `@ActiveProfiles("test")`
  - Helper method `createTestUser(email)` using UserRepository
  - Helper method `createJwtForUser(user)` using JwtService
  - `TestRestTemplate` or `MockMvc` for HTTP calls

---

## 4. Phase 2: Logging & Monitoring (Spring Actuator)

### 4.1 Add Spring Boot Actuator Dependency

Add to `build.gradle`:
```groovy
implementation 'org.springframework.boot:spring-boot-starter-actuator'
```

### 4.2 Configure Actuator Endpoints

In `application.properties`:
```properties
# Actuator
management.endpoints.web.exposure.include=health,metrics,info
management.endpoint.health.show-details=when-authorized
management.info.app.name=Only Yours Backend
management.info.app.version=1.0.0-MVP
```

### 4.3 Security Configuration for Actuator

Update `SecurityConfig.java` to permit `/actuator/health` publicly (for load balancers):
```java
.requestMatchers("/actuator/health").permitAll()
.requestMatchers("/actuator/**").hasRole("ADMIN")  // all other actuator endpoints require auth
```

### 4.4 Add `@Slf4j` Logging to Services

Services that need structured logging added/reviewed:

| Service | Key Log Points |
|---------|---------------|
| `AuthService` | Google token validation success/failure, new user creation vs. existing user |
| `CoupleService` | Code generation (log code length, not value), code redemption success/failure |
| `GameService` | Already has `@Slf4j` from Sprint 5; review for completeness |
| `JwtService` | Token generation (log user ID), validation failure reason |

**Log level strategy:**
- `log.info()` — Key business events (user registered, couple linked, game started)
- `log.warn()` — Expected failures (invalid code, duplicate attempt)
- `log.error()` — Unexpected failures (database errors, null pointer exceptions)
- `log.debug()` — Diagnostic details (token payload, query results) — disabled in production

---

## 5. Phase 3: Configuration & Security Hardening

### 5.1 Update `application.properties` — Use Environment Variables

Change hardcoded values to use Spring's `${ENV_VAR:default}` syntax:

```properties
# Database
spring.datasource.url=${DATABASE_URL:jdbc:postgresql://localhost:5432/onlyyours}
spring.datasource.username=${DATABASE_USERNAME:postgres}
spring.datasource.password=${DATABASE_PASSWORD:root}

# JWT
jwt.secret=${JWT_SECRET:your_super_secret_key_which_should_be_long_and_random}

# Google OAuth
google.client.id=${GOOGLE_CLIENT_ID:216762620268-...apps.googleusercontent.com}
```

### 5.2 Create `.env.example`

Document required environment variables for new developers and CI/CD:

```bash
DATABASE_URL=jdbc:postgresql://localhost:5432/onlyyours
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your_db_password_here
JWT_SECRET=your_256_bit_base64_encoded_secret_here
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

### 5.3 Create `application-prod.properties`

Production-specific overrides:
```properties
# Strict security in production
spring.jpa.hibernate.ddl-auto=validate
logging.level.root=WARN
logging.level.com.onlyyours=INFO
management.endpoint.health.show-details=never
```

### 5.4 Verify `.gitignore` Coverage

Ensure `.env`, `.env.*`, `*.bak` are in `.gitignore` (already done per security rules).

---

## 6. Phase 4: Containerization (Docker)

### 6.1 Multi-Stage `Dockerfile`

**Location:** `backend/Dockerfile`

```dockerfile
# ---- Stage 1: Build ----
FROM eclipse-temurin:17-jdk-alpine AS builder
WORKDIR /app
COPY gradlew .
COPY gradle gradle
COPY build.gradle .
COPY settings.gradle .
COPY src src
RUN chmod +x gradlew && ./gradlew bootJar --no-daemon

# ---- Stage 2: Runtime ----
FROM eclipse-temurin:17-jre-alpine AS runtime
WORKDIR /app
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring
COPY --from=builder /app/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

**Design decisions:**
- Alpine base images minimize attack surface and image size (~150MB vs ~600MB for full JDK)
- Non-root user (`spring`) for security hardening
- `--no-daemon` flag prevents Gradle daemon from running inside container (saves memory)

### 6.2 `.dockerignore`

**Location:** `backend/.dockerignore`

```
.git
.gradle
build/
out/
*.md
*.zip
```

### 6.3 `docker-compose.yml` (Development)

**Location:** `docker-compose.yml` (project root)

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: onlyyours
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DATABASE_PASSWORD:-root}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      DATABASE_URL: jdbc:postgresql://postgres:5432/onlyyours
      DATABASE_USERNAME: postgres
      DATABASE_PASSWORD: ${DATABASE_PASSWORD:-root}
      JWT_SECRET: ${JWT_SECRET}
      GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID}
    depends_on:
      - postgres

volumes:
  postgres_data:
```

---

## 7. Phase 5: Frontend UI/UX Polish

### 7.1 Loading State Pattern

Apply consistent loading state to all screens:

**Pattern:**
```javascript
const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchData = async () => {
    try {
      // API call
    } catch (e) {
      // error handling
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, []);

if (loading) return <LoadingSpinner />;
```

**Screens to update:**
- `DashboardScreen.js` — Add loading state for couple status fetch
- `CategorySelectionScreen.js` — Add loading state for categories fetch
- `ProfileScreen.js` — Add loading state for user profile fetch
- `PartnerLinkScreen.js` — Add loading states for generate/link operations

### 7.2 Empty State Components

Create `OnlyYoursApp/src/components/EmptyState.js`:

```jsx
const EmptyState = ({ icon, title, message, actionLabel, onAction }) => (
  <View style={styles.container}>
    <Text style={styles.icon}>{icon}</Text>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.message}>{message}</Text>
    {actionLabel && <TouchableOpacity onPress={onAction}><Text>{actionLabel}</Text></TouchableOpacity>}
  </View>
);
```

Used for:
- Category list fails to load → "Couldn't load categories. Tap to retry."
- Dashboard has no couple → uses existing "Link with Partner" as the action

### 7.3 LoadingSpinner Component

Create `OnlyYoursApp/src/components/LoadingSpinner.js`:
- Centered `ActivityIndicator` with app-themed color
- Optional `message` prop for context ("Loading categories...", etc.)

### 7.4 UI Copy Review

| Screen | Current | Improved |
|--------|---------|----------|
| DashboardScreen | "Link with Partner" button | "Find Your Partner" |
| PartnerLinkScreen | "Get a Code" section | "Share This Code With Your Partner" |
| GameScreen waiting | "Waiting for partner..." | "Waiting for [Partner Name]..." |
| CategorySelectionScreen | "Select a Category" | "What do you want to explore?" |

---

## 8. Phase 6: Frontend Error Handling

### 8.1 Global Axios Error Interceptor

Update `OnlyYoursApp/src/services/apiClient.js` (or equivalent):

```javascript
apiClient.interceptors.response.use(
  response => response,
  async error => {
    const { status } = error.response || {};
    
    if (status === 401) {
      // Token expired — force logout
      await AsyncStorage.removeItem('userToken');
      // Navigate to sign-in (via AuthContext)
    } else if (status >= 500) {
      Alert.alert('Server Error', 'Something went wrong. Please try again.');
    } else if (!error.response) {
      // Network error (no response at all)
      Alert.alert('No Connection', 'Check your internet connection.');
    }
    
    return Promise.reject(error);
  }
);
```

### 8.2 WebSocket Reconnection Banner

Create `OnlyYoursApp/src/components/ReconnectionBanner.js`:

```jsx
const ReconnectionBanner = ({ visible }) => (
  <Animated.View style={[styles.banner, { opacity: visible ? 1 : 0 }]}>
    <ActivityIndicator size="small" color="white" />
    <Text style={styles.text}>Reconnecting...</Text>
  </Animated.View>
);
```

Update `WebSocketService.js` to:
- Track connection state (`connected`, `disconnected`, `reconnecting`)
- Expose an `onConnectionStateChange` callback
- Emit state changes when the socket connects/disconnects

Update `AuthContext.js` to:
- Subscribe to WebSocket state changes
- Expose `wsConnected` boolean through context

Update `App.js` to:
- Render `<ReconnectionBanner visible={!wsConnected} />` at the top of the screen stack

### 8.3 Error Boundaries

Add a React error boundary component for catastrophic JS errors:

```jsx
class AppErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return <ErrorScreen onReset={() => this.setState({ hasError: false })} />;
    return this.props.children;
  }
}
```

---

## 9. Phase 7: Automated Test Suite Execution

After implementation, run:

### Backend Tests
```bash
cd backend && ./gradlew test
```
**Target:** 91+ tests (70 existing + 12+ new integration tests), 0 failures

### Frontend Tests
```bash
cd OnlyYoursApp && yarn test --passWithNoTests
```
**Target:** 25+ tests (21 existing + 4+ new component tests), 0 failures

### Docker Build Verification
```bash
cd backend && docker build -t only-yours-backend:latest .
docker run --rm -e JWT_SECRET=test -e GOOGLE_CLIENT_ID=test only-yours-backend:latest
```

---

## 10. Implementation Checklist

### Phase 1: Backend Integration Testing
- [ ] Create `backend/src/test/java/com/onlyyours/integration/` package
- [ ] Create `BaseIntegrationTest.java` with shared setup (SpringBootTest, helper methods)
- [ ] Create `AuthFlowIntegrationTest.java` (5 tests)
- [ ] Create `CoupleFlowIntegrationTest.java` (5 tests)
- [ ] Create `ContentIntegrationTest.java` (2 tests)
- [ ] All 12 new integration tests pass

### Phase 2: Logging & Monitoring
- [ ] Add `spring-boot-starter-actuator` to `build.gradle`
- [ ] Configure Actuator in `application.properties` (expose health, metrics, info)
- [ ] Update `SecurityConfig.java` to permit `/actuator/health` publicly
- [ ] Add `@Slf4j` and structured logging to `AuthService.java`
- [ ] Add `@Slf4j` and structured logging to `CoupleService.java`
- [ ] Review/enhance logging in `JwtService.java`
- [ ] Verify `GameService.java` logging is complete

### Phase 3: Configuration Hardening
- [ ] Update `application.properties` to use `${ENV_VAR:default}` syntax for all secrets
- [ ] Create `.env.example` with all required environment variable names
- [ ] Create `application-prod.properties` with production-specific settings
- [ ] Verify `.gitignore` covers `.env` and `.env.*` files

### Phase 4: Containerization
- [ ] Create `backend/Dockerfile` with multi-stage build
- [ ] Create `backend/.dockerignore`
- [ ] Create `docker-compose.yml` at project root
- [ ] Test Docker build locally: `docker build -t only-yours-backend .`
- [ ] Document Docker usage in README

### Phase 5: Frontend UI/UX Polish
- [ ] Create `OnlyYoursApp/src/components/LoadingSpinner.js`
- [ ] Create `OnlyYoursApp/src/components/EmptyState.js`
- [ ] Update `DashboardScreen.js` with loading state
- [ ] Update `CategorySelectionScreen.js` with loading + empty state
- [ ] Update `ProfileScreen.js` with loading state
- [ ] Update `PartnerLinkScreen.js` with operation loading states

### Phase 6: Frontend Error Handling
- [ ] Update `apiClient.js` (or service file) with global Axios response interceptor
- [ ] Create `OnlyYoursApp/src/components/ReconnectionBanner.js`
- [ ] Update `WebSocketService.js` with connection state tracking + callback
- [ ] Update `AuthContext.js` to expose `wsConnected` state
- [ ] Update `App.js` to render ReconnectionBanner
- [ ] Create `AppErrorBoundary` component

### Phase 7: Test Execution & Verification
- [ ] Run `./gradlew test` → all backend tests pass (91+ total)
- [ ] Run `yarn test` → all frontend tests pass (25+ total)
- [ ] Run `docker build` → image builds successfully
- [ ] Update `DEVELOPMENT_PLAN.md` to mark Sprint 6 tasks complete
- [ ] Create `SPRINT_6_IMPLEMENTATION.md` with full report

---

## 11. Files to Create / Modify

### New Files

| File | Type | Purpose |
|------|------|---------|
| `backend/src/test/java/com/onlyyours/integration/BaseIntegrationTest.java` | Java | Shared integration test base class |
| `backend/src/test/java/com/onlyyours/integration/AuthFlowIntegrationTest.java` | Java | Auth flow integration tests (5 tests) |
| `backend/src/test/java/com/onlyyours/integration/CoupleFlowIntegrationTest.java` | Java | Couple linking integration tests (5 tests) |
| `backend/src/test/java/com/onlyyours/integration/ContentIntegrationTest.java` | Java | Content endpoint integration tests (2 tests) |
| `backend/Dockerfile` | Docker | Multi-stage Docker build for backend |
| `backend/.dockerignore` | Docker | Files to exclude from Docker context |
| `docker-compose.yml` | Docker | Local development orchestration |
| `.env.example` | Config | Template for environment variables |
| `backend/src/main/resources/application-prod.properties` | Config | Production profile overrides |
| `OnlyYoursApp/src/components/LoadingSpinner.js` | React Native | Reusable loading spinner |
| `OnlyYoursApp/src/components/EmptyState.js` | React Native | Reusable empty state component |
| `OnlyYoursApp/src/components/ReconnectionBanner.js` | React Native | WebSocket reconnection indicator |
| `OnlyYoursApp/src/components/AppErrorBoundary.js` | React Native | Global JS error boundary |
| `SPRINT_6_IMPLEMENTATION.md` | Markdown | Implementation report (created at end) |

### Modified Files

| File | Changes |
|------|---------|
| `backend/build.gradle` | Add `spring-boot-starter-actuator` |
| `backend/src/main/resources/application.properties` | Environment variable substitution for secrets |
| `backend/src/main/java/com/onlyyours/security/SecurityConfig.java` | Permit `/actuator/health` |
| `backend/src/main/java/com/onlyyours/service/AuthService.java` | Add `@Slf4j` + structured logging |
| `backend/src/main/java/com/onlyyours/service/CoupleService.java` | Add `@Slf4j` + structured logging |
| `backend/src/main/java/com/onlyyours/service/JwtService.java` | Review/add debug logging |
| `OnlyYoursApp/src/services/apiClient.js` (or equivalent) | Global Axios error interceptor |
| `OnlyYoursApp/src/services/WebSocketService.js` | Connection state tracking + callback |
| `OnlyYoursApp/src/state/AuthContext.js` | Expose `wsConnected` state |
| `OnlyYoursApp/App.js` | Render ReconnectionBanner + ErrorBoundary wrapper |
| `OnlyYoursApp/src/screens/DashboardScreen.js` | Loading state |
| `OnlyYoursApp/src/screens/CategorySelectionScreen.js` | Loading + empty state |
| `OnlyYoursApp/src/screens/ProfileScreen.js` | Loading state |
| `OnlyYoursApp/src/screens/PartnerLinkScreen.js` | Operation loading states |
| `DEVELOPMENT_PLAN.md` | Mark Sprint 6 tasks complete |

---

## 12. Out of Scope (Infrastructure)

These items from the Sprint 6 specification require live production infrastructure and **cannot be automated** programmatically. They are documented here for human follow-through:

### Production Database
- **Task:** Provision a PostgreSQL 15+ instance (AWS RDS or Google Cloud SQL)
- **Why deferred:** Requires cloud account, billing, and IAM configuration
- **When to do:** Before first real user sign-in

### Container Orchestration
- **Task:** Deploy Docker image to AWS ECS, Google Cloud Run, or similar
- **Why deferred:** Requires cloud account + Dockerfile to be complete first (✅ done in Phase 4)
- **When to do:** After Dockerfile is verified locally

### HTTPS / TLS
- **Task:** Configure load balancer (AWS ALB, GCP Load Balancer) to terminate SSL
- **Why deferred:** Requires domain name + cloud setup
- **When to do:** After container deployment

### E2E Testing on Physical Devices
- **Task:** Test full user journey on 2 physical Android devices simultaneously
- **Why deferred:** Requires 2 phones with Google accounts
- **Test cases to run manually:**
  1. Sign in → Link partner → Play full game → View results
  2. Invitation declined flow
  3. App backgrounded during game
  4. Network loss during game
  5. Simultaneous answer submission

### Signed APK / Play Store
- **Task:** Generate signed release APK using a keystore
- **Why deferred:** Requires Android keystore file (signing key) and Google Play account
- **Docs to follow:** React Native release guide at https://reactnative.dev/docs/signed-apk-android

---

## Success Criteria

Sprint 6 is complete when:
- [ ] All backend tests pass: **103+ tests (91 existing + 12 new integration tests)**
- [ ] All frontend tests pass: **25+ tests (21 existing + 4 new)**
- [ ] `docker build` succeeds locally for the backend
- [ ] `/actuator/health` returns `{"status":"UP"}` when app runs
- [ ] All secrets are externalized to environment variables
- [ ] All frontend screens have loading states
- [ ] WebSocket reconnection banner is implemented
- [ ] Global axios error handling is in place
- [ ] `SPRINT_6_IMPLEMENTATION.md` documents all changes
- [ ] `DEVELOPMENT_PLAN.md` Sprint 6 checkboxes are marked complete
