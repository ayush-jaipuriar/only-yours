# Sprint 6 Implementation Report

**Sprint:** 6 - Testing, Polish & MVP Release Prep  
**Completed:** February 21, 2026  
**Status:** ✅ COMPLETE  
**Backend Tests:** 96 (0 failures) — 70 existing + 26 new integration tests  
**Frontend Tests:** 21 (0 failures)  

---

## 1. Overview

Sprint 6 is the final sprint of the MVP development cycle. It focuses on making the application production-ready through four pillars:

1. **Comprehensive Testing** — 26 new backend integration tests exposing and fixing a real bug
2. **Observability** — Spring Boot Actuator + structured `@Slf4j` logging across all services
3. **Configuration Hardening** — All secrets externalized to environment variables
4. **Containerization** — Multi-stage Docker build ready for cloud deployment

Additionally, the frontend received UI/UX polish (loading states, empty states, error boundaries) and global error handling (Axios interceptor, WebSocket reconnection banner).

---

## 2. Phase 1: Backend Integration Testing

### 2.1 What Are Integration Tests?

**Unit tests** (what we already had — 70 tests) test individual methods in isolation using mocks. They verify business logic but cannot catch:
- Misconfigured Spring Security URL patterns
- JPA relationship issues (only visible with real SQL)
- Beans not properly wired together
- HTTP response shape mismatches

**Integration tests** boot the full Spring application context with a real (H2 in-memory) database. Every HTTP request flows through the actual filter chain: JwtAuthFilter → SecurityConfig → Controller → Service → JPA → H2.

### 2.2 Test Architecture

Created a `BaseIntegrationTest.java` superclass with `@SpringBootTest + @AutoConfigureMockMvc + @Transactional`:
- `@SpringBootTest` boots the full application context
- `@AutoConfigureMockMvc` wires MockMvc into the real filter chain
- `@Transactional` rolls back each test's database changes automatically (clean slate per test)
- Helper methods: `createTestUser()`, `createJwtFor()`, `bearerHeader()`

### 2.3 New Integration Test Classes

| Class | Tests | Scenarios Covered |
|-------|-------|------------------|
| `AuthFlowIntegrationTest` | 11 | No token, valid token, malformed token, expired JWT, public endpoints |
| `CoupleFlowIntegrationTest` | 10 | Code generation, valid redemption, self-link rejection, double-redemption, partner lookup |
| `ContentIntegrationTest` | 5 | Auth required, response shape, sensitive flag, required fields |

### 2.4 Bug Found and Fixed

**Bug:** `CoupleController.link()` did not catch `IllegalArgumentException` or `IllegalStateException` thrown by `CoupleService`. When a user tried to redeem:
- An invalid/non-existent code → `IllegalArgumentException("Invalid code")` → **ServletException (500)**
- Their own code → `IllegalArgumentException("Cannot redeem own code")` → **ServletException (500)**
- An already-used code → `IllegalArgumentException("Invalid code")` → **ServletException (500)**

**Fix:** Added `try/catch (IllegalArgumentException | IllegalStateException e)` in `CoupleController.link()`, returning `400 Bad Request` with the error message.

**Why this slipped through:** The existing `RestControllerTest` only tested the happy path (valid code) and empty code. None of the unit tests for `CoupleService` tested the controller layer. This is precisely why integration tests are valuable — they test the seams between layers.

### 2.5 Expired JWT Test

A particularly interesting test is `testExpiredToken`:
```java
String expiredToken = Jwts.builder()
    .setSubject(testUser.getEmail())
    .setIssuedAt(new Date(System.currentTimeMillis() - 7_200_000))   // 2 hours ago
    .setExpiration(new Date(System.currentTimeMillis() - 3_600_000)) // expired 1 hour ago
    .signWith(SignatureAlgorithm.HS256, jwtSecret)
    .compact();
```
We hand-craft an expired token using the same secret as the application — this is only possible in tests because we have access to the secret via `@Value("${jwt.secret}")`. This verifies that `JwtAuthFilter` properly catches `ExpiredJwtException` and returns 401 (not 500).

---

## 3. Phase 2: Logging & Monitoring

### 3.1 Spring Boot Actuator

Added `spring-boot-starter-actuator` to `build.gradle`. Configured in `application.properties`:
```properties
management.endpoints.web.exposure.include=health,metrics,info
management.endpoint.health.show-details=when-authorized
```

**Why Actuator?** In production, infrastructure components (load balancers, Kubernetes) need health check endpoints to know when the app is ready to receive traffic. Without `/actuator/health`, there's no way to automate deployment readiness checks.

**Security:** `/actuator/health` is permitted publicly (for load balancers); other actuator endpoints require authentication.

### 3.2 Structured Logging

Added `@Slf4j` to `AuthService` and `CoupleService` with a clear log level strategy:
- `log.info()` — Key business events: user registered, couple linked, game started
- `log.warn()` — Expected failure cases: invalid code, self-link attempt, token rejection
- `log.error()` — Unexpected failures (reserved for unhandled exceptions)
- `log.debug()` — Diagnostic details disabled in production

Example log output:
```
INFO  AuthService - New user registered: email=alice@example.com
INFO  AuthService - Returning user authenticated: userId=abc-123
WARN  CoupleService - Self-link attempt rejected for userId=xyz-456
INFO  CoupleService - Couple linked successfully: coupleId=..., user1Id=..., user2Id=...
```

---

## 4. Phase 3: Configuration Hardening

### 4.1 Environment Variable Externalization

Updated `application.properties` to use Spring's `${VARIABLE_NAME:default}` syntax:
```properties
spring.datasource.url=${DATABASE_URL:jdbc:postgresql://localhost:5432/onlyyours}
spring.datasource.password=${DATABASE_PASSWORD:root}
jwt.secret=${JWT_SECRET:your_super_secret_key_which_should_be_long_and_random}
google.client.id=${GOOGLE_CLIENT_ID:...}
```

**Why this matters (12-Factor App):** Hardcoded credentials in source code are a critical security vulnerability. If the repo is ever made public or a developer's machine is compromised, all secrets are exposed. Environment variables are injected at runtime and are never part of the codebase.

### 4.2 Production Profile (`application-prod.properties`)

Activated with `--spring.profiles.active=prod` or env var `SPRING_PROFILES_ACTIVE=prod`. Contains:
- Stricter security (`show-details=never` for health endpoint)
- Reduced log noise (`logging.level.root=WARN`)
- Disables DevTools

### 4.3 `.env.example`

A template file documenting all required environment variables — never committed, acts as developer onboarding guide.

---

## 5. Phase 4: Containerization

### 5.1 Multi-Stage Dockerfile

```
Stage 1 (builder): eclipse-temurin:17-jdk-alpine
  - Compiles with ./gradlew bootJar --no-daemon -x test
  - Full JDK (~600MB) needed to compile

Stage 2 (runtime): eclipse-temurin:17-jre-alpine
  - Copies only the compiled JAR from Stage 1
  - JRE-only (~150MB) — no compiler, no source code
  - Non-root user (spring:spring) for security hardening
```

**Multi-stage benefit:** Final image is ~150MB instead of ~600MB. Smaller images pull faster, consume less storage, and have a smaller attack surface.

**JVM Flags:**
- `-XX:+UseContainerSupport` — Makes JVM respect Docker memory limits (not host RAM)
- `-XX:MaxRAMPercentage=75.0` — Use 75% of container memory for heap
- `-Djava.security.egd=file:/dev/./urandom` — Faster startup by using `/dev/urandom`

### 5.2 docker-compose.yml

Orchestrates the full local development stack:
- `postgres:15-alpine` with healthcheck (`pg_isready`)
- `backend` depends on `postgres.service_healthy` — prevents Spring trying to connect before DB is ready
- Named volume `postgres_data` — data persists across restarts

---

## 6. Phase 5 & 6: Frontend Polish & Error Handling

### 6.1 Reusable Components Created

| Component | Purpose |
|-----------|---------|
| `LoadingSpinner.js` | Full-screen spinner with optional message, themed color |
| `EmptyState.js` | Empty/error state with icon, title, message, optional retry button |
| `ReconnectionBanner.js` | Animated slide-in banner when WebSocket disconnects |
| `AppErrorBoundary.js` | Class component catching unhandled React JS errors |

### 6.2 Global Axios Response Interceptor

Added to `api.js`:
```javascript
api.interceptors.response.use(
  response => response,
  async error => {
    if (status === 401) → force logout + alert
    if (status >= 500) → server error alert
    if (!error.response) → network error alert
    return Promise.reject(error); // propagate for local handling
  }
);
```

**Key design:** 401 handler calls `_logoutHandler` — a function registered by `AuthContext` to avoid circular imports (AuthContext → api → AuthContext would be circular).

### 6.3 WebSocket Connection State

`WebSocketService.js` now tracks `connectionState: 'connected' | 'disconnected' | 'reconnecting'` and emits state changes via `onConnectionStateChange` callback.

`AuthContext.js` registers as a listener and exposes `wsConnectionState` through context. `App.js` renders `<ReconnectionBanner connectionState={wsConnectionState} />` at the top of the component tree.

### 6.4 AppErrorBoundary

React class component using `getDerivedStateFromError` and `componentDidCatch`. The fallback UI gives users a "Try Again" button to recover from catastrophic JS errors without restarting the app.

---

## 7. Test Results Summary

### Backend: 96 tests, 0 failures

| Test Suite | Tests | Type |
|------------|-------|------|
| `JwtServiceTest` | 9 | Unit |
| `CoupleServiceTest` | 9 | Unit |
| `GameServiceTest` | 30 | Unit |
| `RestControllerTest` (4 nested classes) | 12 | Integration (existing) |
| `GameControllerWebSocketTest` | 6 | WebSocket Integration |
| `WebSocketPerformanceTest` | 3 | Performance |
| `OnlyYoursBackendApplicationTests` | 1 | Context Load |
| **AuthFlowIntegrationTest** (Sprint 6) | **11** | **Integration (new)** |
| **CoupleFlowIntegrationTest** (Sprint 6) | **10** | **Integration (new)** |
| **ContentIntegrationTest** (Sprint 6) | **5** | **Integration (new)** |
| **Total** | **96** | |

### Frontend: 21 tests, 0 failures

| Test Suite | Tests |
|------------|-------|
| `GameContext.test.js` | 11 |
| `GameScreen.test.js` | 2 |
| `ResultsScreen.test.js` | 8 |
| **Total** | **21** |

---

## 8. Bug Fixed During Sprint

| Bug | Root Cause | Fix |
|-----|-----------|-----|
| `CoupleController.link()` returned 500 for invalid/self-link codes | Service threw `IllegalArgumentException` uncaught by controller | Added `try/catch` in controller, returns 400 |

---

## 9. Known Limitations (Documented, Out of Scope)

- **Cloud deployment** — Requires AWS/GCP account + provisioning
- **HTTPS/TLS** — Requires load balancer + domain name
- **E2E testing** — Requires 2 physical Android devices with Google accounts
- **Signed APK** — Requires Android signing keystore

---

## 10. MVP Status After Sprint 6

| Feature | Status |
|---------|--------|
| Google Sign-In | ✅ Complete |
| JWT security | ✅ Complete |
| Couple linking | ✅ Complete |
| Real-time gameplay (Round 1 + Round 2) | ✅ Complete |
| Scoring & Results | ✅ Complete |
| Integration testing | ✅ Complete (Sprint 6) |
| Observability (Actuator + logging) | ✅ Complete (Sprint 6) |
| Configuration hardening | ✅ Complete (Sprint 6) |
| Containerization | ✅ Complete (Sprint 6) |
| Frontend polish & error handling | ✅ Complete (Sprint 6) |
| Cloud deployment | ⏸️ Deferred — requires infrastructure |
| E2E device testing | ⏸️ Deferred — requires 2 physical devices |
