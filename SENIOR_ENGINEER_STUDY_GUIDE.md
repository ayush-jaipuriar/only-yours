# Senior Engineer Study Guide: Only Yours — Complete Technical Reference

**Covers**: Sprints 0–5 (All phases of implementation)  
**Level**: Senior Software Engineer  
**Last Updated**: February 21, 2026  
**Purpose**: Every concept, pattern, decision, and subtlety from building this full-stack real-time mobile application — explained down to the metal.

---

## Table of Contents

1. [The Big Picture: System Architecture](#1-the-big-picture-system-architecture)
2. [Build Systems & Dependency Management](#2-build-systems--dependency-management)
3. [Spring Boot: Internals & Lifecycle](#3-spring-boot-internals--lifecycle)
4. [Dependency Injection & Inversion of Control](#4-dependency-injection--inversion-of-control)
5. [JPA & Hibernate: The Full Picture](#5-jpa--hibernate-the-full-picture)
6. [Flyway: Database Version Control](#6-flyway-database-version-control)
7. [Repository Pattern & Spring Data JPA](#7-repository-pattern--spring-data-jpa)
8. [The DTO Pattern](#8-the-dto-pattern)
9. [OAuth 2.0 & OpenID Connect](#9-oauth-20--openid-connect)
10. [JSON Web Tokens (JWT): Every Detail](#10-json-web-tokens-jwt-every-detail)
11. [Spring Security: The Full Filter Chain](#11-spring-security-the-full-filter-chain)
12. [WebSocket Protocol: From TCP to STOMP](#12-websocket-protocol-from-tcp-to-stomp)
13. [Spring WebSocket & STOMP Message Broker](#13-spring-websocket--stomp-message-broker)
14. [WebSocket Security: Channel Interceptors](#14-websocket-security-channel-interceptors)
15. [Game State Machine & Concurrent Synchronization](#15-game-state-machine--concurrent-synchronization)
16. [Lombok: Reducing Boilerplate](#16-lombok-reducing-boilerplate)
17. [PostgreSQL: Relational Database Design](#17-postgresql-relational-database-design)
18. [Transaction Management & @Transactional](#18-transaction-management--transactional)
19. [Testing: The Full Pyramid](#19-testing-the-full-pyramid)
20. [React Native Architecture](#20-react-native-architecture)
21. [React Hooks: Deep Dive](#21-react-hooks-deep-dive)
22. [Context API & State Management](#22-context-api--state-management)
23. [React Navigation](#23-react-navigation)
24. [HTTP Client: Axios & Interceptors](#24-http-client-axios--interceptors)
25. [WebSocket Client: STOMP.js & SockJS](#25-websocket-client-stompjs--sockjs)
26. [Google Sign-In on React Native](#26-google-sign-in-on-react-native)
27. [AsyncStorage: Secure Local Persistence](#27-asyncstorage-secure-local-persistence)
28. [React Native New Architecture](#28-react-native-new-architecture)
29. [Frontend Testing: Jest & React Native Testing Library](#29-frontend-testing-jest--react-native-testing-library)
30. [System Design Concepts Applied](#30-system-design-concepts-applied)
31. [Security Hardening & Common Pitfalls](#31-security-hardening--common-pitfalls)
32. [Performance Profiling & Benchmarks](#32-performance-profiling--benchmarks)
33. [Key Bug Post-Mortems](#33-key-bug-post-mortems)
34. [Architectural Decision Records (ADRs)](#34-architectural-decision-records-adrs)

---

## 1. The Big Picture: System Architecture

### 1.1 Layered Architecture

The application follows the **n-tier layered architecture** pattern on the backend. Each layer has a single responsibility and communicates only with the layer directly below it.

```
┌────────────────────────────────────┐
│  Presentation Layer (Controller)   │  ← Handles HTTP/WS I/O only
├────────────────────────────────────┤
│  Service Layer (Business Logic)    │  ← All business rules live here
├────────────────────────────────────┤
│  Repository Layer (Data Access)    │  ← Database CRUD only
├────────────────────────────────────┤
│  Persistence Layer (JPA Entities)  │  ← Maps Java objects to DB rows
└────────────────────────────────────┘
```

**Why layers matter for a senior engineer:**
- **Testability**: Each layer can be tested in isolation by mocking the layer below (e.g., test a service with a mocked repository — no database needed).
- **Replaceability**: You can swap PostgreSQL for another database by only changing the repository layer. Services know nothing about SQL.
- **Responsibility clarity**: If a bug exists in a security rule, you know to look in `SecurityConfig`. If a bug exists in link-code generation, you look in `CoupleService`. This is the **Single Responsibility Principle** at the architectural level.

### 1.2 Two Communication Channels

The application exposes two distinct real-time communication channels to clients:

| Channel | Protocol | Used For | Auth Mechanism |
|---------|----------|----------|----------------|
| **REST API** | HTTP/1.1 | CRUD operations, authentication | `Authorization: Bearer <JWT>` header |
| **WebSocket** | WS/WSS (STOMP over SockJS) | Game events, real-time sync | JWT in STOMP `CONNECT` frame header |

This dual-channel design is critical: HTTP is stateless and request-response, ideal for profile fetches and couple linking. WebSocket is stateful and bidirectional, ideal for the game where the server needs to push data to clients asynchronously without them polling.

### 1.3 Data Flow for a Game Round

```
[Player A Phone]  →  HTTP POST /api/auth/google/signin  →  [Backend]  →  [PostgreSQL]
                  ←  JWT                                ←
                  →  WS CONNECT (JWT in header)         →  [WebSocket broker]
                  →  /app/game.invite {categoryId}       →  [GameController]
                                                            → creates GameSession in DB
                  ←  /user/queue/game-events (invitation sent)
[Player B Phone]  ←  /user/queue/game-events (invitation received)
                  →  /app/game.accept {sessionId}        →  [GameController]
                                                            → shuffles questions
                  ←  /topic/game/{sessionId} (Question 1)
[Player A Phone]  ←  /topic/game/{sessionId} (Question 1)
                  →  /app/game.answer {sessionId, questionId, answer}
                  ←  /user/queue/game-status (ANSWER_RECORDED)
[Player B Phone]  →  /app/game.answer {sessionId, questionId, answer}
                                                            → both answered → next Q
                  ←  /topic/game/{sessionId} (Question 2)
[Player A Phone]  ←  /topic/game/{sessionId} (Question 2)
```

---

## 2. Build Systems & Dependency Management

### 2.1 Gradle with Kotlin DSL

The backend uses **Gradle** as its build tool with the **Kotlin DSL** (`build.gradle.kts`) instead of the traditional Groovy DSL (`build.gradle`).

**Why Kotlin DSL over Groovy DSL?**
- **Type safety**: The Kotlin DSL is statically typed. Your IDE can auto-complete dependency names and flag typos at compile time. Groovy is dynamically typed, so errors only surface at runtime.
- **Refactoring support**: IDEs like IntelliJ can safely rename functions and variables in `.kts` files. In Groovy, refactoring is fragile.
- **Consistency**: If you're already a Kotlin/Java developer, reading Kotlin DSL feels natural.

**Anatomy of `build.gradle.kts`:**

```kotlin
plugins {
    id("org.springframework.boot") version "3.5.0"  // Spring Boot plugin
    id("io.spring.dependency-management") version "1.1.4"  // BOM management
    kotlin("jvm") version "1.9.24"  // Kotlin support
    java  // Java support
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    // "implementation" = compile + runtime (not exposed to downstream consumers)
    // "api" = compile + runtime + exposed (for library projects)
    // "testImplementation" = only in test classpath
    // "runtimeOnly" = only at runtime (e.g., JDBC driver)
    
    annotationProcessor("org.projectlombok:lombok")
    // Annotation processors run at compile time to generate code
    // Without this, Lombok's @Getter/@Setter won't generate methods
}
```

**The `io.spring.dependency-management` plugin** reads Spring Boot's **Bill of Materials (BOM)**. A BOM is a special Maven POM file that declares tested-and-compatible versions of all dependencies in an ecosystem. By importing the BOM, you don't specify versions for most Spring dependencies — they're all managed together, eliminating version conflicts.

### 2.2 Gradle Wrapper

The project uses the **Gradle Wrapper** (`gradlew` script). This is a shell script that downloads the exact version of Gradle specified in `gradle/wrapper/gradle-wrapper.properties` if it's not already cached locally.

**Why it matters:** Without the wrapper, "works on my machine" problems arise when different developers have different Gradle versions installed globally. The wrapper pins the build to an exact version, ensuring reproducible builds.

### 2.3 Yarn 4 (PnP Mode) on Frontend

The frontend uses **Yarn 4** (formerly Yarn Berry). The key difference from Yarn 1 / npm is **Plug'n'Play (PnP)**:

- **Traditional `node_modules`**: npm and Yarn 1 install packages by copying files into a flat (or nested) `node_modules` directory. This results in thousands of files, slow installs, and subtle dependency resolution issues.
- **Yarn PnP**: Instead of copying files to `node_modules`, Yarn generates a single `.pnp.cjs` file that maps package names to their locations in Yarn's cache. Node's module resolution is patched to use this map. This means:
  - Zero `node_modules` directory (or a small one for native modules)
  - Near-instant installs (packages are read from cache, not copied)
  - Strict dependency isolation (you can't accidentally import unlisted dependencies)

**The Metro bundler challenge with PnP**: React Native's Metro bundler doesn't natively understand Yarn PnP. This required configuring `metro.config.js` with a custom resolver that bridges between PnP's module map and Metro's file watching system.

---

## 3. Spring Boot: Internals & Lifecycle

### 3.1 Auto-Configuration: The Magic Explained

Spring Boot's central promise is "convention over configuration." When you add `spring-boot-starter-data-jpa` to your dependencies, Spring Boot auto-configures:
- A `DataSource` (connection pool) from your `application.properties`
- A `JpaTransactionManager`
- An `EntityManagerFactory`
- Hibernate as the JPA provider
- All `@Entity`-annotated classes registered with Hibernate

**How does auto-configuration work mechanically?**

1. `@SpringBootApplication` meta-annotates `@EnableAutoConfiguration`.
2. `@EnableAutoConfiguration` triggers `AutoConfigurationImportSelector`.
3. This reads the file `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` from every JAR on the classpath.
4. Each entry is a configuration class annotated with conditions like `@ConditionalOnClass(DataSource.class)` — meaning "only apply this configuration if `DataSource` is on the classpath."
5. Since you added `spring-boot-starter-data-jpa`, `DataSource` is on the classpath → `DataSourceAutoConfiguration` fires → creates a `HikariCP` connection pool from your properties.

**The application entry point:**

```java
@SpringBootApplication  // = @Configuration + @EnableAutoConfiguration + @ComponentScan
public class OnlyYoursBackendApplication {
    public static void main(String[] args) {
        SpringApplication.run(OnlyYoursBackendApplication.class, args);
        // This:
        // 1. Creates an ApplicationContext (the IoC container)
        // 2. Loads all @Configuration classes
        // 3. Runs auto-configuration
        // 4. Starts the embedded Tomcat server
        // 5. Deploys the Spring DispatcherServlet to handle HTTP
    }
}
```

### 3.2 The Bean Lifecycle

A **Spring Bean** is an object managed by Spring's IoC container. The lifecycle:

1. **Instantiation**: Spring calls the constructor.
2. **Dependency Injection**: Spring injects `@Autowired` fields/constructor params.
3. **`@PostConstruct`**: Any method annotated with `@PostConstruct` runs (e.g., initializing a cache).
4. **Ready**: The bean is available for use.
5. **`@PreDestroy`**: When the context shuts down, `@PreDestroy` methods run (cleanup).

**Bean Scopes:**
- `@Scope("singleton")` (default): One instance per ApplicationContext. This is why our services are singletons — they're stateless and thread-safe.
- `@Scope("prototype")`: New instance every time the bean is requested.
- `@Scope("request")` / `@Scope("session")`: One instance per HTTP request/session (web-aware contexts only).

**Why singletons are safe in our app:** `AuthService`, `GameService`, etc., are stateless — they hold no mutable state. They take inputs via method parameters, read/write the database, and return results. Multiple threads can call methods on the same instance simultaneously with no conflicts.

### 3.3 Embedded Server: Tomcat

Spring Boot embeds a **Tomcat** servlet container directly in the JAR. This is why you run a Spring Boot app with `java -jar app.jar` instead of deploying a WAR file to an external Tomcat. The embedded Tomcat:
- Listens on port 8080 (configurable via `server.port`)
- Registers Spring's `DispatcherServlet` as the front controller
- Handles HTTP connection management, thread pooling, request parsing

### 3.4 `application.properties`: Externalized Configuration

Spring Boot's `application.properties` (or `application.yml`) externalizes configuration so the same code runs in different environments:

```properties
# Datasource — HikariCP uses these to create the connection pool
spring.datasource.url=jdbc:postgresql://localhost:5432/onlyyours
spring.datasource.username=postgres
spring.datasource.password=secret

# JPA/Hibernate
spring.jpa.hibernate.ddl-auto=validate
# validate: Hibernate checks that the DB schema matches the entities. Fails startup if mismatch.
# create: Creates schema from entities on startup (DESTROYS DATA on restart).
# create-drop: Creates on startup, drops on shutdown (good for tests).
# update: Alters schema to match entities (DANGEROUS in production — can't rollback).
# none: Does nothing.

spring.jpa.show-sql=true  # Logs all SQL (useful for development, disable in production)

# Custom application properties
app.jwt.secret=mySecretKey
app.jwt.expiration=86400000  # 24 hours in milliseconds
app.google.client-id=your-google-client-id
```

**The `@Value` annotation** reads properties at bean initialization:

```java
@Value("${app.jwt.secret}")
private String jwtSecret;
```

**Why `validate` is important in production:** Using `ddl-auto=validate` with Flyway means Flyway controls the schema (via SQL migrations) and Hibernate just verifies that your Java entities match. This prevents accidental schema corruption from Hibernate's `update` mode, which can add columns but never removes them, leading to schema drift.

---

## 4. Dependency Injection & Inversion of Control

### 4.1 The Problem DI Solves

Without DI, creating an `AuthController` would look like:

```java
// Hard-coded instantiation — tightly coupled, impossible to test
public class AuthController {
    private AuthService authService = new AuthService(
        new UserRepository(...),
        new JwtService(...),
        new GoogleIdTokenVerifier(...)
    );
}
```

This is impossible to unit test because you can't swap the real `UserRepository` for a mock.

### 4.2 Constructor Injection (Preferred)

```java
@RestController
@RequiredArgsConstructor  // Lombok: generates constructor for final fields
public class AuthController {
    private final AuthService authService;  // Spring injects this automatically
}
```

**Why constructor injection over field injection (`@Autowired` on fields)?**
- **Testability**: You can instantiate `AuthController` directly in tests by passing a mock: `new AuthController(mockAuthService)`.
- **Immutability**: `final` fields can't be changed after construction.
- **Explicitness**: Dependencies are visible in the constructor signature, making them obvious.
- **No reflection**: Field injection (`@Autowired private AuthService authService`) requires Spring to use reflection to set private fields, which is slower and hides dependencies.

### 4.3 Spring's Component Scan

Spring scans for classes annotated with stereotypes:
- `@Component`: Generic bean
- `@Service`: Service layer bean (functionally identical to `@Component`, but communicates intent)
- `@Repository`: Data access bean (adds PersistenceException translation)
- `@Controller` / `@RestController`: Web controller bean

`@SpringBootApplication` includes `@ComponentScan`, which scans the annotated class's package and all sub-packages. This is why all our classes under `com.onlyyours.*` are discovered automatically.

---

## 5. JPA & Hibernate: The Full Picture

### 5.1 What JPA Is vs. What Hibernate Is

**JPA (Jakarta Persistence API)** is a **specification** — a set of interfaces and annotations defined by the Jakarta EE standard. It defines how Java objects should map to relational database tables.

**Hibernate** is the most popular **implementation** of JPA. It provides the actual logic for translating JPA annotations into SQL queries, managing the persistence context, and handling database connection pooling (via delegation to HikariCP).

Think of it like this: JPA is the interface (`List<T>`), and Hibernate is the implementation (`ArrayList<T>`). Your code uses JPA annotations — `@Entity`, `@Column`, `@ManyToOne` — so theoretically you could swap Hibernate for EclipseLink without changing your entity classes.

### 5.2 Entity Mapping Deep Dive

```java
@Entity
@Table(name = "users")  // Maps to "users" table in the database
@Data  // Lombok: generates getters, setters, equals, hashCode, toString
@NoArgsConstructor  // JPA requires a no-arg constructor for entity instantiation
@AllArgsConstructor // Lombok: constructor for all fields
@Builder  // Lombok: builder pattern for clean instantiation
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    // AUTO: JPA provider chooses strategy. With PostgreSQL and UUID type,
    // Hibernate uses a UUID generator.
    private UUID id;
    
    @Column(name = "google_user_id", nullable = false, unique = true)
    // nullable = false → NOT NULL constraint in DB (plus Hibernate validates before insert)
    // unique = true → UNIQUE constraint in DB
    private String googleUserId;
    
    @Column(name = "name", nullable = false)
    private String name;
    
    @Column(name = "email", nullable = false, unique = true)
    private String email;
}
```

**Critical Gotcha: Field Naming vs. Column Naming**

JPA's default naming strategy converts camelCase fields to snake_case columns:
- `googleUserId` → `google_user_id`
- `categoryId` → `category_id`

However, if you define the column in Flyway SQL with a different name (or if there's any ambiguity), Hibernate might not match correctly. The safest practice: **always use explicit `@Column(name = "...")`** on fields whose column names differ from the default conversion.

In Sprint 3, this caused a critical bug: `option_a` through `option_d` columns in SQL were being mapped to `optionA`–`optionD` in Java without explicit `@Column` annotations. After Flyway created the table with `option_a`, Hibernate tried to create `optiona` (concatenated, no underscore), causing a schema mismatch at startup.

### 5.3 Relationship Mappings

#### `@ManyToOne` (Many GameAnswers → One GameSession)

```java
@Entity
public class GameAnswer {
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "game_session_id", nullable = false)
    // @JoinColumn defines the foreign key column in THIS table
    // FetchType.LAZY: Don't load the GameSession object until you actually access it
    // FetchType.EAGER: Load GameSession immediately with every GameAnswer query (n+1 risk)
    private GameSession gameSession;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
}
```

**The N+1 Query Problem**: If you load 10 `GameAnswer` objects with `EAGER` fetching, and each has a `GameSession`, Hibernate executes:
- 1 query: `SELECT * FROM game_answers WHERE ...` (10 answers returned)
- 10 queries: `SELECT * FROM game_sessions WHERE id = ?` (one per answer)

Total: **11 queries**. This kills performance. `LAZY` fetching delays the join query until the relationship is actually accessed in code.

**Fix for N+1**: Use JPQL with `JOIN FETCH`:
```java
@Query("SELECT ga FROM GameAnswer ga JOIN FETCH ga.gameSession WHERE ga.id = :id")
GameAnswer findWithSession(@Param("id") UUID id);
```

#### Repository Method Naming for Relationships

This is a common source of confusion. JPA-derived method names must follow the **entity field paths**, not the database column names.

```java
// The entity has: private Question question; (an object, not questionId)
// WRONG: findByQuestionId(Integer questionId)  ← JPA looks for a field named "questionId"
// RIGHT: findByQuestion_Id(Integer questionId) ← JPA traverses: question → id
// The underscore in "Question_Id" tells JPA to navigate the "question" field then access "id"
List<GameAnswer> findByGameSession_IdAndQuestion_Id(UUID sessionId, Integer questionId);
```

This was one of the Sprint 4 bugs: `findByQuestionId()` compiled fine but caused a runtime error because JPA couldn't find a `questionId` field on `GameAnswer` (it has `question`, not `questionId`).

### 5.4 The Persistence Context (First-Level Cache)

Every JPA operation happens within a **persistence context** (a unit of work managed by `EntityManager`). Within a single transaction:

1. When you call `repository.findById(id)`, Hibernate queries the DB and caches the result in the persistence context.
2. If you call `repository.findById(id)` again in the same transaction, Hibernate returns the **cached object** — no DB query.
3. When you modify a managed entity object and the transaction commits, Hibernate **automatically** detects the change (via "dirty checking") and issues an `UPDATE` SQL.

```java
@Transactional
public void updateSessionStatus(UUID sessionId, String status) {
    GameSession session = sessionRepository.findById(sessionId).orElseThrow();
    session.setStatus(status);
    // No explicit save() needed! Hibernate dirty-checks the entity at commit.
    // But calling sessionRepository.save(session) is also fine (and more explicit).
}
```

### 5.5 `ddl-auto=validate` in Production

With Flyway managing the schema and `ddl-auto=validate`:
- Spring Boot startup validates that every `@Entity` class has a corresponding table with matching columns.
- If you add a new field to a Java entity but forget to write a Flyway migration, startup fails with: `Schema-validation: missing column [new_field] in table [table_name]`
- This is a safety net that catches schema drift before bad SQL executes in production.

### 5.6 JPQL vs Native SQL

**JPQL (Jakarta Persistence Query Language)** operates on entity objects, not tables:

```java
// JPQL: refers to entity class name (Question) and field path (q.category.id)
@Query("SELECT q FROM Question q WHERE q.category.id = :categoryId ORDER BY RANDOM()")
List<Question> findByCategoryIdRandom(@Param("categoryId") Integer categoryId);

// Native SQL: refers to actual table name and column name
@Query(value = "SELECT * FROM questions WHERE category_id = :categoryId ORDER BY RANDOM()", 
       nativeQuery = true)
List<Question> findByCategoryIdRandomNative(@Param("categoryId") Integer categoryId);
```

**When to use which:**
- JPQL: When you need entity relationships navigated automatically, and database portability.
- Native SQL: When using database-specific features (e.g., PostgreSQL's `RANDOM()` function, `JSONB` operators, window functions).

In our case, `RANDOM()` is a PostgreSQL-specific function. When running tests with H2 in-memory database, this breaks — H2 doesn't know `RANDOM()`. The fix: set H2 to `MODE=PostgreSQL` in the test datasource URL (`jdbc:h2:mem:testdb;MODE=PostgreSQL`).

---

## 6. Flyway: Database Version Control

### 6.1 The Philosophy of Database Migration Tools

Imagine your application is deployed to production. The database has data. Now you need to add a column. You can't just change the `@Entity` — the database still has the old schema. You need a controlled, versioned, repeatable way to alter the live database schema. Flyway solves this.

**Core Concept: Versioned Migrations**

Flyway scans the `src/main/resources/db/migration/` directory for SQL files named `V{version}__{description}.sql`. It maintains a `flyway_schema_history` table that records which migrations have been applied.

```
V1__Initial_Schema.sql   ← Creates all 6 tables
V2__Seed_Initial_Data.sql ← Seeds categories and questions
V3__Add_Game_Session_Fields.sql ← Adds columns to game_sessions
V4__Seed_Additional_Questions.sql ← More question data
```

On startup, Flyway:
1. Reads `flyway_schema_history` to see which migrations have run.
2. Finds any migration files not yet in the history table.
3. Executes them in version order within a transaction.
4. Records the migration in `flyway_schema_history` with a checksum.

### 6.2 Checksum Immutability: The Cardinal Rule

After a migration has been applied, **Flyway stores a CRC32 checksum of the SQL file**. If you ever modify an already-applied migration file, Flyway will detect the checksum mismatch at next startup and **refuse to start the application**:

```
Validate failed: Migration V1__Initial_Schema.sql
  -> Checksum mismatch for migration version 1
     -> Applied to database : 1234567890
     -> Resolved locally    : 9876543210
```

**This is intentional and good.** It prevents you from silently changing a migration that has already run in production. 

**The Sprint 3 Lesson**: When we added `INSERT` statements to `V2__Seed_Initial_Data.sql` after it had already been applied locally, Flyway rejected the application on startup. The fix: drop and recreate the local database (safe in development), or create a `V3__` migration for the new inserts. **In production: never drop the database — always write a new migration.**

### 6.3 Flyway with Spring Boot

Spring Boot auto-configures Flyway when it's on the classpath. Flyway runs **before Hibernate validation** on startup, ensuring the schema is up-to-date before Hibernate checks it.

**Execution order:**
1. Flyway applies pending migrations (schema reaches correct state)
2. Hibernate validates `@Entity` classes against the schema
3. Application begins serving requests

### 6.4 Flyway in Tests

The test `application.properties` sets `spring.jpa.hibernate.ddl-auto=create-drop` and uses H2 in-memory database. Flyway still runs its migrations on the H2 database, giving tests a schema identical to production. This validates that the migrations themselves are correct (they run on H2's PostgreSQL-compatibility mode).

---

## 7. Repository Pattern & Spring Data JPA

### 7.1 The Repository Abstraction

The **Repository pattern** (from Domain-Driven Design) defines an in-memory-collection-like interface for accessing domain objects. Spring Data JPA materializes this pattern by generating SQL from interface method signatures at runtime — no implementation class needed.

```java
public interface UserRepository extends JpaRepository<User, UUID> {
    // JpaRepository<Entity, PrimaryKeyType> provides:
    // save(entity), findById(id), findAll(), delete(entity),
    // count(), existsById(id), saveAll(list), deleteAll(), etc.
    
    // Custom derived methods — Spring Data reads the method name and generates JPQL:
    Optional<User> findByEmail(String email);
    // Generated: SELECT u FROM User u WHERE u.email = :email
    
    Optional<User> findByGoogleUserId(String googleUserId);
    // Generated: SELECT u FROM User u WHERE u.googleUserId = :googleUserId
}
```

**How Spring Data generates implementations:** At startup, Spring scans for interfaces extending `Repository<T, ID>`. For each, it creates a **JDK dynamic proxy** — an `InvocationHandler` that intercepts method calls and routes them to the appropriate JPQL or native query. This means zero boilerplate SQL for common operations.

### 7.2 Query Method Derivation Vocabulary

Spring Data parses method names using a vocabulary of keywords:

| Keyword | Meaning | Example |
|---------|---------|---------|
| `findBy` | SELECT WHERE | `findByEmail(String email)` |
| `findAllBy` | SELECT all matching | `findAllByStatus(String status)` |
| `countBy` | COUNT | `countByRound2GuessIsNotNull()` |
| `existsBy` | EXISTS | `existsByEmail(String email)` |
| `deleteBy` | DELETE | `deleteBySessionId(UUID id)` |
| `And` | AND condition | `findBySessionIdAndUserId(UUID, UUID)` |
| `Or` | OR condition | `findByUser1_IdOrUser2_Id(UUID, UUID)` |
| `IsNotNull` | IS NOT NULL | `findByRound2GuessIsNotNull()` |
| `IsNull` | IS NULL | `findByUser2IdIsNull()` |
| `In` | IN clause | `findByStatusIn(List<String>)` |
| `OrderBy` | ORDER BY | `findAllOrderByCreatedAtDesc()` |

### 7.3 Custom JPQL Queries

When derived methods aren't expressive enough:

```java
@Query("SELECT q FROM Question q WHERE q.category.id = :categoryId")
List<Question> findByCategoryId(@Param("categoryId") Integer categoryId);
```

**Named parameters** (`:categoryId`) are preferred over positional parameters (`?1`) for readability and maintainability.

### 7.4 `JpaRepository` vs `CrudRepository` vs `PagingAndSortingRepository`

| Interface | Provides |
|-----------|----------|
| `CrudRepository<T, ID>` | Basic CRUD operations |
| `PagingAndSortingRepository<T, ID>` | CRUD + `findAll(Pageable)` + `findAll(Sort)` |
| `JpaRepository<T, ID>` | All of above + JPA-specific (flush, batch delete, reference retrieval) |

We extend `JpaRepository` throughout for maximum flexibility.

---

## 8. The DTO Pattern

### 8.1 Why Expose DTOs, Not Entities

**Never return JPA entities directly from REST controllers.** Here's why:

1. **Security**: Entities may contain sensitive fields (e.g., `password`, internal IDs, audit flags) that should never be sent to clients.
2. **Circular references**: If `User` references `Couple`, and `Couple` references `User`, Jackson's JSON serializer will infinitely recurse and throw a `StackOverflowError`.
3. **Lazy loading pitfalls**: Returning an entity outside of a transaction causes `LazyInitializationException` when Jackson tries to serialize a lazily-loaded relationship.
4. **API coupling**: If you rename an entity field, your API contract breaks. DTOs decouple the internal model from the external contract.
5. **Schema evolution**: You can add columns to the database entity without changing the API response shape.

### 8.2 DTO Design in This Project

```java
// Entity (internal — maps to DB)
@Entity
@Table(name = "users")
public class User {
    private UUID id;
    private String googleUserId;  // Internal — never expose to client
    private String name;
    private String email;
}

// DTO (external — safe to send to client)
@Data
@Builder
public class UserDto {
    private UUID id;
    private String name;   // Only expose what's needed
    private String email;
}
```

**Mapping strategy**: In this project, mapping is done manually in the service layer:

```java
UserDto dto = UserDto.builder()
    .id(user.getId())
    .name(user.getName())
    .email(user.getEmail())
    .build();
```

At scale, a mapping library like **MapStruct** (compile-time code generation) or **ModelMapper** (reflection-based, runtime) would reduce boilerplate.

### 8.3 Request vs Response DTOs

| DTO Role | Direction | Example |
|----------|-----------|---------|
| `GoogleSignInRequestDto` | Client → Server | Incoming Google ID token |
| `AnswerRequestDto` | Client → Server | Player's selected answer (via WebSocket) |
| `UserDto` | Server → Client | Safe user profile |
| `QuestionPayloadDto` | Server → Client | Question text + options (broadcast) |
| `GuessResultDto` | Server → Client | Private per-guess feedback |
| `GameResultsDto` | Server → Client | Final scores broadcast |

---

## 9. OAuth 2.0 & OpenID Connect

### 9.1 OAuth 2.0: Authorization vs. Authentication

**OAuth 2.0 is an authorization protocol, not an authentication protocol.** It answers: "Does this user consent to app X accessing their data on service Y?" It does NOT answer: "Is this really user Alice?"

**Four OAuth 2.0 Roles:**
- **Resource Owner**: The user who owns the data (our user)
- **Client**: Our application (the React Native app)
- **Authorization Server**: Google's OAuth server (issues tokens)
- **Resource Server**: Google's API servers (serve user data)

**The four grant types:**
1. **Authorization Code** (most secure, used by web apps with a backend)
2. **Implicit** (deprecated — access token in URL, insecure)
3. **Client Credentials** (server-to-server, no user involved)
4. **Resource Owner Password** (deprecated — user gives app their password)

### 9.2 OpenID Connect: Adding Identity on Top

OIDC extends OAuth 2.0 with the **ID Token** — a JWT that proves who the user is. The `id_token` contains:
- `sub`: Subject — a stable, unique Google user ID (does not change even if email changes)
- `email`: The user's email
- `name`: Display name
- `aud`: Audience — our app's client ID (prevents using tokens issued to other apps)
- `iat`: Issued at timestamp
- `exp`: Expiration timestamp
- `iss`: Issuer — `accounts.google.com` (proves the token came from Google)

### 9.3 The Sign-In Flow Step by Step

```
1. User taps "Sign in with Google"
   → React Native calls Google Sign-In SDK
   
2. Google presents consent screen (if first time)
   → User approves
   
3. Google returns to the app:
   → access_token (to call Google APIs — we don't use this)
   → id_token (JWT proving user's identity — THIS is what we need)
   
4. App sends id_token to our backend:
   POST /api/auth/google/signin
   { "idToken": "eyJhbGci..." }
   
5. Backend verifies id_token using GoogleIdTokenVerifier:
   - Fetches Google's public keys from: https://www.googleapis.com/oauth2/v3/certs
   - Verifies the token's RSA signature (proves Google signed it, not a forger)
   - Verifies 'aud' == our Google Client ID (token was for our app, not stolen from another)
   - Verifies 'exp' > current time (token hasn't expired)
   - Verifies 'iss' == 'accounts.google.com' (came from real Google)
   
6. If valid: extract sub, email, name
   → Check if user exists in DB (findByGoogleUserId)
   → If not: create new User, save to DB
   → If yes: optionally update name/email
   
7. Generate our own app JWT (see next section)
   → Return { token: "eyJhbGci..." } to app
   
8. App stores JWT in AsyncStorage
   → Uses it for all subsequent API calls
```

### 9.4 Why We Generate Our Own JWT (Not Use Google's)

Google's `id_token` expires in **1 hour**. We don't want users to have to sign in again every hour. We issue our own JWT with a longer expiry (e.g., 24 hours, configurable). Also:
- Our JWT can contain our internal user ID (UUID), not just Google's ID.
- We control the secret — only our servers can issue and verify our JWTs.
- We can invalidate all tokens by rotating the secret (emergency revocation).

---

## 10. JSON Web Tokens (JWT): Every Detail

### 10.1 Structure

A JWT is three Base64URL-encoded JSON objects separated by dots:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
.
eyJzdWIiOiJ1c2VyLWlkLTEyMyIsImVtYWlsIjoiYWxpY2VAZ21haWwuY29tIiwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjE2MDAwODY0MDB9
.
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

**Header** (decoded):
```json
{
  "alg": "HS256",   // HMAC-SHA256 — symmetric signing algorithm
  "typ": "JWT"
}
```

**Payload** (decoded):
```json
{
  "sub": "user-id-123",          // Subject = our internal user ID
  "email": "alice@gmail.com",    // Custom claim
  "iat": 1600000000,             // Issued at (Unix timestamp)
  "exp": 1600086400              // Expires at (iat + 24h)
}
```

**Signature** (how it's computed):
```
HMAC_SHA256(
  base64url(header) + "." + base64url(payload),
  secret_key
)
```

The signature **binds the header and payload together** with the secret key. If anyone modifies even a single character of the header or payload, the signature no longer matches — verification fails.

### 10.2 Why HMAC-SHA256 (Symmetric) vs RSA (Asymmetric)

| Algorithm | Type | Key | Use Case |
|-----------|------|-----|----------|
| `HS256` | Symmetric | Single shared secret | When the same server signs and verifies |
| `RS256` | Asymmetric | Private key (sign), Public key (verify) | When multiple services need to verify |

We use `HS256` because we have a single backend server. If we had multiple microservices that needed to verify tokens without sharing a secret, we'd switch to `RS256` (sign with private key, each service verifies with the public key).

### 10.3 JJWT Library Implementation

```java
// JwtService.java
@Service
public class JwtService {
    
    @Value("${app.jwt.secret}")
    private String secretKeyString;
    
    @Value("${app.jwt.expiration}")
    private Long expirationMs;
    
    private SecretKey getSigningKey() {
        // The secret must be at least 256 bits (32 bytes) for HS256
        byte[] keyBytes = Decoders.BASE64.decode(secretKeyString);
        return Keys.hmacShaKeyFor(keyBytes);
    }
    
    public String generateToken(User user) {
        return Jwts.builder()
            .setSubject(user.getId().toString())  // Set "sub" claim
            .claim("email", user.getEmail())       // Custom claim
            .setIssuedAt(new Date())               // "iat"
            .setExpiration(new Date(System.currentTimeMillis() + expirationMs))  // "exp"
            .signWith(getSigningKey())             // Signs with HS256
            .compact();                            // Produces the "header.payload.signature" string
    }
    
    public Claims validateAndExtractClaims(String token) {
        return Jwts.parserBuilder()
            .setSigningKey(getSigningKey())        // Know the secret to verify
            .build()
            .parseClaimsJws(token)                 // Validates signature, expiry
            .getBody();                            // Returns the claims payload
        // Throws: ExpiredJwtException, MalformedJwtException, SignatureException
    }
    
    public String extractUserId(String token) {
        return validateAndExtractClaims(token).getSubject();
    }
    
    public boolean isTokenValid(String token) {
        try {
            validateAndExtractClaims(token);
            return true;
        } catch (JwtException e) {
            return false;
        }
    }
}
```

### 10.4 JWT Secret Key Length

The HMAC-SHA256 algorithm requires a key that is at least **256 bits = 32 bytes**. If the key is shorter, JJWT throws a `WeakKeyException`. This was Sprint 4's test bug R13: the test `application.properties` had a short JWT secret.

The secret should be:
- **Random**: Generated with a cryptographically secure random number generator
- **Private**: Never committed to source control (use environment variables)
- **Long enough**: ≥32 bytes for HS256, ≥48 for HS384, ≥64 for HS512

---

## 11. Spring Security: The Full Filter Chain

### 11.1 How Spring Security Works: The Filter Chain

Spring Security works as a **chain of servlet filters** that every incoming HTTP request must pass through. Think of it as a series of checkpoints at a border:

```
Incoming HTTP Request
        │
        ▼
┌──────────────────────┐
│ SecurityFilterChain  │
│                      │
│  Filter 1: CORS      │  ← Handles Cross-Origin Resource Sharing headers
│  Filter 2: CSRF      │  ← We disabled CSRF (not needed for stateless APIs)
│  ...                 │
│  Filter N: JwtAuth   │  ← Our custom filter — validates Bearer token
│  ...                 │
│  Filter Z: Auth      │  ← Checks if the request is authenticated
└──────────────────────┘
        │
        ▼
   DispatcherServlet
        │
        ▼
   @RestController
```

### 11.2 `SecurityConfig.java` Explained

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    private final JwtAuthFilter jwtAuthFilter;
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            // 1. Disable CSRF (Cross-Site Request Forgery protection)
            // CSRF attacks exploit session cookies. Since we use stateless JWTs
            // (not cookies), CSRF is irrelevant. Keeping it enabled would require
            // a CSRF token on every non-GET request, complicating the API.
            .csrf(csrf -> csrf.disable())
            
            // 2. Stateless session management
            // Spring Security normally creates an HttpSession to track authenticated users.
            // With JWTs, each request is self-contained — we don't need server-side sessions.
            // STATELESS tells Spring to never create or use HttpSession.
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            
            // 3. Authorization rules (evaluated top-to-bottom, first match wins)
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()  // Public: auth endpoints
                .requestMatchers("/ws/**").permitAll()         // Public: WS handshake
                .anyRequest().authenticated()                 // Everything else: needs JWT
            )
            
            // 4. Add our JWT filter BEFORE the standard UsernamePasswordAuthenticationFilter
            // UsernamePasswordAuthenticationFilter handles form-based login (username + password).
            // We add JwtAuthFilter before it so JWT validation happens first.
            // If JWT is valid, the user is already authenticated when UsernamePassword runs.
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            
            .build();
    }
}
```

### 11.3 `JwtAuthFilter`: The Heart of Stateless Security

```java
@Component
public class JwtAuthFilter extends OncePerRequestFilter {
    // OncePerRequestFilter guarantees this filter runs exactly once per request,
    // even in complex filter chains where the same request might go through
    // multiple servlet dispatches.
    
    private final JwtService jwtService;
    private final UserRepository userRepository;
    
    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        
        // 1. Extract the Authorization header
        String authHeader = request.getHeader("Authorization");
        
        // 2. Check it's a Bearer token
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);  // No token — pass through (might hit 403 later)
            return;
        }
        
        String token = authHeader.substring(7);  // Remove "Bearer " prefix
        
        try {
            // 3. Validate the JWT and extract user ID
            String userId = jwtService.extractUserId(token);
            
            // 4. Only authenticate if not already authenticated (optimization)
            if (userId != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                
                // 5. Load user from DB (verifies the user still exists)
                User user = userRepository.findById(UUID.fromString(userId)).orElseThrow();
                
                // 6. Create an Authentication object
                // UsernamePasswordAuthenticationToken is Spring Security's standard Authentication impl.
                // Parameters: principal (the user object), credentials (null for JWT), authorities (roles)
                UsernamePasswordAuthenticationToken authToken =
                    new UsernamePasswordAuthenticationToken(user, null, List.of());
                
                // 7. Attach request details (IP, session ID) — used by some security features
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                
                // 8. Set Authentication in SecurityContextHolder
                // This is THE key action: it tells Spring Security "this request is authenticated as this user"
                // All downstream code can call SecurityContextHolder.getContext().getAuthentication()
                // to get the current user.
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        } catch (JwtException | IllegalArgumentException e) {
            // Malformed token, expired token, invalid signature
            // Don't throw — just don't set authentication. The request will fail with 403 Forbidden.
            // Before Sprint 4 bug fix, this threw a 500 Internal Server Error.
        }
        
        // 9. ALWAYS call doFilter — pass control to the next filter in the chain
        // Even if authentication failed, let Spring Security handle the 403 response.
        filterChain.doFilter(request, response);
    }
}
```

### 11.4 The `SecurityContextHolder`

`SecurityContextHolder` is a **thread-local storage** mechanism. Each request runs on its own thread, and `SecurityContextHolder` stores the `Authentication` object for that thread. This means:
- Thread A (User Alice's request) → `SecurityContextHolder` holds Alice's authentication
- Thread B (User Bob's request) → `SecurityContextHolder` holds Bob's authentication
- No cross-contamination between concurrent requests

**In controllers, get the current user:**
```java
@GetMapping("/me")
public UserDto getCurrentUser() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    User user = (User) auth.getPrincipal();  // The User object we set in JwtAuthFilter
    return UserDto.from(user);
}
```

Or using `@AuthenticationPrincipal`:
```java
@GetMapping("/me")
public UserDto getCurrentUser(@AuthenticationPrincipal User user) {
    return UserDto.from(user);
}
```

Or in `UserController.java` via `Principal`:
```java
@GetMapping("/me")
public UserDto getCurrentUser(Principal principal) {
    // principal.getName() returns what was set as the "name" in the Authentication
    // In our JwtAuthFilter, the principal is a User object, so getName() calls user.getName()
    // OR Spring Security treats the principal's name as the username from UserDetails
    String email = principal.getName();
    User user = userRepository.findByEmail(email).orElseThrow();
    return UserDto.from(user);
}
```

### 11.5 Why CSRF Is Disabled

**CSRF (Cross-Site Request Forgery)**: An attack where a malicious website causes a logged-in user's browser to send a request to your app. It works because browsers automatically include cookies with cross-origin requests.

**Why it doesn't apply to JWT auth:** JWTs are stored in AsyncStorage and explicitly added to the `Authorization` header in code. A malicious website can't access AsyncStorage, and browsers don't auto-include `Authorization` headers in cross-origin requests. So CSRF protection is unnecessary and we safely disable it.

---

## 12. WebSocket Protocol: From TCP to STOMP

### 12.1 The HTTP Problem: Request-Response Only

HTTP is inherently one-directional: the client sends a request, the server responds. The server cannot push data to the client without the client asking first. For a game where the server needs to notify both players simultaneously that the next question is ready, polling would require:
- Client polls `GET /game/nextQuestion` every 500ms
- Server returns "nothing yet" 98% of the time
- Wasted bandwidth, wasted battery, high latency

### 12.2 WebSocket: Full-Duplex Communication

WebSocket starts as HTTP but upgrades to a persistent TCP connection:

```
Client → Server: HTTP GET /ws
Headers:
  Upgrade: websocket
  Connection: Upgrade
  Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
  Sec-WebSocket-Version: 13

Server → Client: HTTP 101 Switching Protocols
Headers:
  Upgrade: websocket
  Connection: Upgrade
  Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=

[HTTP connection is now upgraded to WebSocket]
[Both parties can send frames at any time]
```

Once upgraded:
- The TCP connection stays open (no handshake overhead per message)
- Either party can send a **frame** (message) at any time
- Latency is minimal (no HTTP overhead, no connection setup per message)

### 12.3 The STOMP Protocol

Raw WebSocket gives you a raw byte stream. STOMP (Simple Text Oriented Messaging Protocol) adds structure:

```
SEND
destination:/app/game.answer
content-type:application/json

{"sessionId":"uuid","questionId":1,"answer":"B"}
^@
```

A STOMP frame has:
- **Command**: `SEND`, `SUBSCRIBE`, `UNSUBSCRIBE`, `CONNECT`, `DISCONNECT`, etc.
- **Headers**: Key-value pairs (destination, content-type, authorization)
- **Body**: Arbitrary payload (we use JSON)
- **Null byte** (`^@`): Frame terminator

**STOMP Commands:**
| Command | Direction | Purpose |
|---------|-----------|---------|
| `CONNECT` | C→S | Establish STOMP session (sends credentials here) |
| `CONNECTED` | S→C | Server confirms connection |
| `SEND` | C→S | Client sends a message to a destination |
| `SUBSCRIBE` | C→S | Client subscribes to a destination |
| `MESSAGE` | S→C | Server delivers a message to subscriber |
| `UNSUBSCRIBE` | C→S | Client stops listening |
| `DISCONNECT` | C→S | Client terminates cleanly |
| `ERROR` | S→C | Server reports an error |

### 12.4 SockJS: WebSocket with Fallback

Not all networks allow WebSocket. Corporate firewalls, some mobile networks, and certain proxies block WS connections. **SockJS** provides a transparent fallback mechanism:

1. **First attempt**: Try native WebSocket
2. **Fallback 1**: WebSocket over XHR streaming (HTTP long-polling with chunked transfer)
3. **Fallback 2**: iframe-based long-polling
4. **Fallback 3**: JSONP polling

From the application's perspective, SockJS presents the same API as a native WebSocket. The fallback is transparent — your code doesn't need to change.

In our `WebSocketConfig.java`:
```java
registry.addEndpoint("/ws")
    .setAllowedOriginPatterns("*")
    .withSockJS();  // Enables SockJS fallback
```

The client connects to `http://localhost:8080/ws` (not `ws://`) because SockJS uses the HTTP URL and handles the protocol switch internally.

---

## 13. Spring WebSocket & STOMP Message Broker

### 13.1 `WebSocketConfig.java` Explained

```java
@Configuration
@EnableWebSocketMessageBroker
// @EnableWebSocketMessageBroker enables Spring's STOMP message broker
// This switches Spring from basic WebSocket to the full STOMP message routing system
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")  // WebSocket/SockJS endpoint URL
            .setAllowedOriginPatterns("*")  // Allow any origin (tighten in production)
            .withSockJS();  // Enable SockJS fallback
    }
    
    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Simple broker (in-memory) serves destinations starting with:
        registry.enableSimpleBroker("/topic", "/queue");
        // /topic: broadcast (one message → all subscribers)
        // /queue: typically user-specific (one message → one subscriber)
        
        // App destination prefix: client sends to /app/something
        // → routed to @MessageMapping("/something") in @Controller
        registry.setApplicationDestinationPrefixes("/app");
        
        // User destination prefix: /user/queue/something
        // → delivered only to a specific user's session
        // SimpMessagingTemplate.convertAndSendToUser() uses this internally
        registry.setUserDestinationPrefix("/user");
    }
}
```

### 13.2 Message Routing: Three Paths

**Path 1: Client → Application (`/app/...` → `@MessageMapping`)**
```
Client: SEND destination:/app/game.invite
→ Spring routes to: @MessageMapping("/game.invite") in GameController
→ Business logic runs
→ Controller sends to broker
```

**Path 2: Broadcast (`/topic/...` → all subscribers)**
```java
// In GameController:
messagingTemplate.convertAndSend(
    "/topic/game/" + sessionId,  // Destination
    questionPayload               // Payload (auto-serialized to JSON)
);
// → Every client subscribed to /topic/game/{sessionId} receives the message
```

**Path 3: Private (`/user/...` → one specific user)**
```java
// In GameController:
messagingTemplate.convertAndSendToUser(
    partnerEmail,                     // User identifier (the "name" in their Authentication)
    "/queue/game-events",             // Destination suffix (full path: /user/partnerEmail/queue/game-events)
    invitationPayload
);
// → Only the client authenticated as partnerEmail receives this message
// → The client subscribes to /user/queue/game-events (the /user/ prefix is implicit for the subscriber)
```

### 13.3 `@MessageMapping` vs `@RequestMapping`

| Annotation | Transport | Used In |
|------------|-----------|---------|
| `@RequestMapping` (or `@GetMapping` etc.) | HTTP | `@RestController` |
| `@MessageMapping` | WebSocket STOMP | `@Controller` (without `@Rest`) |

```java
@Controller  // NOT @RestController — WebSocket controllers use @Controller
public class GameController {
    
    @MessageMapping("/game.invite")
    // Client sends to /app/game.invite (the /app prefix is stripped by Spring)
    public void handleInvite(
        @Payload GameInvitationDto invitation,  // Deserializes the JSON body
        Principal principal                      // The authenticated user (set by WebSocket security)
    ) {
        // Business logic...
    }
}
```

### 13.4 `SimpMessagingTemplate` vs `@SendTo`

**`@SendTo`** — declarative, sends the return value to a destination:
```java
@MessageMapping("/game.invite")
@SendTo("/topic/game/{sessionId}")  // Sends return value to this destination
public QuestionPayloadDto handleInvite(GameInvitationDto invitation) {
    return gameService.createInvitation(invitation);
}
```

**`SimpMessagingTemplate`** — programmatic, gives full control:
```java
@Autowired
private SimpMessagingTemplate messagingTemplate;

@MessageMapping("/game.invite")
public void handleInvite(@Payload GameInvitationDto invitation, Principal principal) {
    // Send to different users based on logic
    messagingTemplate.convertAndSendToUser(partner.getEmail(), "/queue/game-events", dto);
    messagingTemplate.convertAndSend("/topic/game/" + sessionId, questionDto);
}
```

We use `SimpMessagingTemplate` throughout because:
- We need to send to **different** destinations from the same handler (to inviter AND partner)
- We need to send to dynamic destinations (session ID in the topic path)
- We need error responses to a private error queue

---

## 14. WebSocket Security: Channel Interceptors

### 14.1 The Problem

Spring Security's `JwtAuthFilter` runs on HTTP requests. But when a client connects via WebSocket, the initial HTTP handshake is authenticated, but subsequent STOMP frames (SEND, SUBSCRIBE) are not HTTP — they're WebSocket frames. The `JwtAuthFilter` doesn't run for them.

**Without WebSocket security**: Any client could open a WebSocket connection (even without a valid JWT) and send messages to `/app/game.invite`.

### 14.2 The Solution: `ChannelInterceptor`

```java
@Configuration
public class WebSocketSecurityConfig implements WebSocketMessageBrokerConfigurer {
    
    private final JwtService jwtService;
    private final UserRepository userRepository;
    
    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        // Register an interceptor on the "inbound channel"
        // (the channel that carries messages FROM clients TO the broker/handlers)
        registration.interceptors(new ChannelInterceptor() {
            
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                // This method is called for EVERY message from any client
                
                StompHeaderAccessor accessor =
                    MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                
                // Only authenticate on CONNECT frames (not every SEND/SUBSCRIBE)
                // The user identity set here persists for the entire session
                if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                    String authHeader = accessor.getFirstNativeHeader("Authorization");
                    
                    if (authHeader != null && authHeader.startsWith("Bearer ")) {
                        String token = authHeader.substring(7);
                        try {
                            String userId = jwtService.extractUserId(token);
                            User user = userRepository.findById(UUID.fromString(userId)).orElseThrow();
                            
                            // Set the authenticated user on the STOMP session
                            // This is what Principal principal in @MessageMapping resolves to
                            UsernamePasswordAuthenticationToken auth =
                                new UsernamePasswordAuthenticationToken(user, null, List.of());
                            accessor.setUser(auth);
                        } catch (Exception e) {
                            throw new MessagingException("Invalid JWT token");
                        }
                    } else {
                        throw new MessagingException("Missing authorization header");
                    }
                }
                return message;
            }
        });
    }
}
```

### 14.3 The Critical Bug: Mutable vs Immutable Accessor

Sprint 4's Bug R7: Using `StompHeaderAccessor.wrap(message)` created an immutable accessor. `accessor.setUser(auth)` called on an immutable accessor silently did nothing, so `Principal` in `@MessageMapping` methods was always `null`.

**Fix**: Use `MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class)` which returns the **mutable** accessor already attached to the message object:

```java
// WRONG: Creates a new accessor wrapper — changes don't propagate to the message
StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);

// RIGHT: Gets the existing mutable accessor from the message
StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
```

---

## 15. Game State Machine & Concurrent Synchronization

### 15.1 State Machine Design

A **state machine** is a computational model where the system can be in exactly one of a finite number of states at any time, and transitions between states are triggered by events.

```
States: INVITED → ROUND1 → ROUND2 → COMPLETED (or DECLINED)

Transitions:
  INVITED  + accept()   → ROUND1
  INVITED  + decline()  → DECLINED
  ROUND1   + both_answered_last_question() → ROUND2
  ROUND2   + both_guessed_last_question()  → COMPLETED
```

This is stored in `game_sessions.status` as a VARCHAR (e.g., `"ROUND1"`, `"ROUND2"`), mapped to a Java enum in the `GameSession` entity.

**Why a state machine matters for correctness:**

Every service method validates the current state before accepting an action:
```java
public void submitAnswer(UUID sessionId, String answer) {
    GameSession session = sessionRepository.findById(sessionId).orElseThrow();
    
    if (!session.getStatus().equals("ROUND1")) {
        throw new IllegalStateException("Cannot submit answer: game is not in ROUND1");
    }
    // ... proceed
}
```

This prevents:
- Answering in ROUND2 (should be guessing, not answering)
- Accepting an invitation to an already-declined game
- Double-completion

### 15.2 The Synchronization Problem

In a two-player game, both players submit independently. The server must:
1. Record each player's submission
2. Wait until **both** have submitted before advancing
3. Handle the case where submissions arrive milliseconds apart (concurrently)

**The race condition scenario:**
```
T=0ms: Player A submits. Server: count = 1. Not both answered yet.
T=1ms: Player B submits. Server (different thread): count = 1. Not both answered yet.
[Both threads think only 1 player has answered. Game never advances.]
```

**Our solution: Counting committed DB rows with `@Transactional`**

```java
@Transactional  // Wraps the entire method in a DB transaction
public void submitAnswer(UUID sessionId, UUID userId, String answer, Integer questionId) {
    // Within this transaction, the session row is LOCKED for updates
    GameSession session = sessionRepository.findByIdWithLock(sessionId); // Pessimistic lock
    
    // Check deduplication (idempotency)
    GameAnswer existing = gameAnswerRepository
        .findByGameSession_IdAndQuestion_IdAndUser_Id(sessionId, questionId, userId);
    if (existing != null && existing.getRound1Answer() != null) return; // Ignore duplicate
    
    // Record the answer
    GameAnswer answer = GameAnswer.builder()
        .gameSession(session)
        .question(questionRepository.findById(questionId).orElseThrow())
        .user(userRepository.findById(userId).orElseThrow())
        .round1Answer(answer)
        .build();
    gameAnswerRepository.save(answer);
    
    // Count answers for this question — within the same transaction
    long count = gameAnswerRepository
        .countByGameSession_IdAndQuestion_Id(sessionId, questionId);
    
    if (count >= 2) {
        // Both players answered — advance the game
        session.setCurrentQuestionIndex(session.getCurrentQuestionIndex() + 1);
        sessionRepository.save(session);
        // Broadcast next question AFTER transaction commits
    }
}
// Transaction commits here — all changes become visible atomically
```

**Why counting DB rows (not in-memory counters) is correct:**
- DB transactions with proper isolation levels guarantee that count reflects the true state
- In-memory counters on a singleton service would require synchronized blocks and would break with multiple server instances
- The database is the single source of truth

**Note on `@Transactional` isolation**: By default, Spring uses `READ_COMMITTED` isolation. This means the count query sees committed rows from other transactions. If Player A's transaction commits (saving answer) before Player B counts, the count is accurate. At high scale, a pessimistic lock (`SELECT FOR UPDATE`) on the game session row would prevent race conditions entirely.

### 15.3 Idempotency

**Idempotency** means applying an operation multiple times has the same result as applying it once. This is critical in distributed systems where network retries can cause duplicate requests.

```java
// Before inserting, check if the answer already exists
GameAnswer existing = gameAnswerRepository
    .findByGameSession_IdAndQuestion_IdAndUser_Id(sessionId, questionId, userId);

if (existing != null && existing.getRound1Answer() != null) {
    return; // Already recorded — ignore the duplicate
}
```

This handles:
- User tapping "Submit" twice before the first response arrives
- Network retry resending the message
- WebSocket duplicate delivery (rare but possible)

---

## 16. Lombok: Reducing Boilerplate

### 16.1 How Lombok Works

Lombok is an **annotation processor** — it hooks into the Java compiler pipeline and generates bytecode at compile time. It doesn't use reflection at runtime. The generated code is as if you had hand-written it.

**Annotation processors** run during `javac`'s annotation processing phase (before compilation), reading source annotations and generating new source or class files.

### 16.2 Key Annotations Used

| Annotation | Generates |
|------------|-----------|
| `@Getter` | `getX()` for all fields |
| `@Setter` | `setX()` for all fields |
| `@Data` | `@Getter` + `@Setter` + `@ToString` + `@EqualsAndHashCode` + `@RequiredArgsConstructor` |
| `@NoArgsConstructor` | Public no-argument constructor |
| `@AllArgsConstructor` | Constructor with all fields |
| `@RequiredArgsConstructor` | Constructor with `final` and `@NonNull` fields |
| `@Builder` | Builder pattern: `MyClass.builder().field(value).build()` |
| `@Builder.Default` | Sets a default value for a field in the builder |
| `@Slf4j` | Creates `private static final Logger log = LoggerFactory.getLogger(...)` |

### 16.3 The `@Builder.Default` Pitfall

Sprint 4 Bug R11: When using `@Builder` and a field has a default value (e.g., `private int count = 0;`), the builder **ignores** the default. The field is `0` even if the builder doesn't set it, BUT the builder sets it to `null` for object types.

Fix: Use `@Builder.Default`:
```java
@Builder
public class QuestionPayloadDto {
    private String round;
    
    @Builder.Default
    private int questionNumber = 1;  // Builder respects this default
    
    @Builder.Default
    private List<String> options = new ArrayList<>();  // Not null when using builder
}
```

### 16.4 `@Data` on JPA Entities: A Warning

Using `@Data` on JPA entities is controversial because:
- `@EqualsAndHashCode` uses all fields by default. If two entities have the same data but different DB-generated IDs, they won't be equal — which is usually correct. But if you rely on `hashCode` in a `Set` before the entity is saved (ID is null), you get unstable behavior.
- `@ToString` can trigger lazy-loaded relationships, causing `LazyInitializationException` when printing entities outside of transactions.

**Best practice for JPA entities**: Use explicit `@Getter`, `@Setter`, `@NoArgsConstructor`, `@AllArgsConstructor`, and implement `equals`/`hashCode` based on the primary key only:
```java
@Override
public boolean equals(Object o) {
    if (this == o) return true;
    if (!(o instanceof User)) return false;
    User user = (User) o;
    return id != null && id.equals(user.id);
}

@Override
public int hashCode() {
    return getClass().hashCode();  // Consistent before and after save
}
```

---

## 17. PostgreSQL: Relational Database Design

### 17.1 Why PostgreSQL

| Feature | PostgreSQL | MySQL | MongoDB |
|---------|------------|-------|---------|
| ACID compliance | Full | Full (InnoDB) | Limited |
| JSON support | Excellent (JSONB) | Limited | Native |
| Full-text search | Built-in | Limited | Atlas Search |
| UUID support | Native `uuid` type | varchar only | ObjectId |
| Array types | Native | None | Native |
| Flyway support | Excellent | Good | Limited |

For our structured, relational data model (users → couples → game sessions → answers), PostgreSQL's strong referential integrity and ACID guarantees are essential.

### 17.2 UUID as Primary Key

```sql
id UUID PRIMARY KEY
```

**UUID (Universally Unique Identifier)** advantages:
- **Globally unique**: Can be generated on the client without a DB roundtrip (no sequence contention in distributed systems)
- **Unpredictable**: Sequential integer IDs (1, 2, 3...) let users enumerate resources. UUIDs are opaque.
- **Merge-safe**: No ID conflicts when merging data from multiple databases

**UUID disadvantages**:
- **Storage**: 16 bytes vs 4 bytes for integer
- **Index performance**: UUID indexes are less cache-friendly than sequential integers because UUIDs are random — inserts cause B-tree rebalancing across random pages. **UUIDv7** (sequential UUIDs) mitigates this.
- **Readability**: Debug logs with UUIDs are harder to scan

For our scale, UUID's advantages outweigh the disadvantages.

### 17.3 `SERIAL` for Category and Question IDs

```sql
id SERIAL PRIMARY KEY  -- Auto-incrementing integer
```

`SERIAL` is PostgreSQL shorthand for `INTEGER NOT NULL DEFAULT nextval('sequence_name')`. Categories and questions use integer IDs because:
- They're seeded by the application (not user-generated), so sequential IDs are fine
- Performance: joining `INTEGER` foreign keys is faster than `UUID` joins
- They're internal to the game engine

### 17.4 Foreign Keys and Referential Integrity

```sql
CREATE TABLE game_answers (
    game_session_id UUID NOT NULL REFERENCES game_sessions(id),
    question_id     INTEGER NOT NULL REFERENCES questions(id),
    user_id         UUID NOT NULL REFERENCES users(id)
);
```

`REFERENCES` creates a **foreign key constraint**. The DB enforces:
- You can't insert a `game_answer` with a `game_session_id` that doesn't exist in `game_sessions`
- You can't delete a `game_session` that has `game_answers` (without `ON DELETE CASCADE`)

This is the database-level enforcement of business rules, independent of application code.

### 17.5 The `question_ids VARCHAR(500)` Design Decision

For `game_sessions.question_ids`, we store the selected question IDs as a comma-separated string (`"1,5,12,3,22,8,15,9"`) rather than a separate junction table.

**Why this was chosen (pragmatic tradeoff):**
- **Simplicity**: No extra table, no complex query
- **Reproducibility**: The server can reconstruct the exact question order at any time
- **Sprint scope**: A proper many-to-many junction table (`game_session_questions`) with an ordering column would be more correct but adds implementation complexity

**Why a senior engineer might push back:**
- Breaks 1NF (First Normal Form) — data in a cell should be atomic
- Hard to query (you can't `JOIN` on comma-separated strings easily)
- `VARCHAR(500)` could overflow for very many questions
- Makes it harder to add per-question metadata (e.g., `answered=true`, `display_order`)

At scale, a proper `game_session_questions` table is the right solution.

### 17.6 Connection Pooling: HikariCP

Spring Boot auto-configures **HikariCP** (Hikari Connection Pool) as the default JDBC connection pool. Why connection pooling matters:

Opening a PostgreSQL connection takes ~50-100ms (TCP handshake, auth, protocol setup). For a web server handling 100 requests/second, opening a new connection per request is catastrophically slow.

HikariCP maintains a pool of pre-opened connections. When a request needs a DB connection, it "borrows" one from the pool (takes ~microseconds), uses it, and returns it. Key settings:
- `maximumPoolSize`: Max connections to maintain (default 10). Set based on `max_connections` in PostgreSQL.
- `minimumIdle`: Minimum idle connections kept ready
- `connectionTimeout`: How long to wait for a connection before throwing an exception

---

## 18. Transaction Management & `@Transactional`

### 18.1 ACID Properties

**Atomicity**: All operations in a transaction succeed, or none do. If `submitAnswer()` saves the answer but then fails on the count query, the save is rolled back — no partial state.

**Consistency**: A transaction brings the database from one valid state to another valid state. Foreign key constraints, NOT NULL constraints — all are enforced at commit time.

**Isolation**: Concurrent transactions don't see each other's intermediate states (extent depends on isolation level).

**Durability**: Once committed, data persists even if the server crashes immediately after.

### 18.2 Isolation Levels

| Level | Dirty Read | Non-Repeatable Read | Phantom Read |
|-------|------------|---------------------|--------------|
| `READ_UNCOMMITTED` | Possible | Possible | Possible |
| `READ_COMMITTED` | Not possible | Possible | Possible |
| `REPEATABLE_READ` | Not possible | Not possible | Possible |
| `SERIALIZABLE` | Not possible | Not possible | Not possible |

**Dirty Read**: Reading data that another transaction has changed but not yet committed.  
**Non-Repeatable Read**: Reading the same row twice in a transaction and getting different values (another transaction committed a change in between).  
**Phantom Read**: A query run twice in a transaction returns different rows (another transaction inserted rows).

Spring's default is `READ_COMMITTED` (matches PostgreSQL's default). For our `countByGameSession_IdAndQuestion_Id` synchronization, this is acceptable because each answer is saved in its own committed transaction before the count runs.

### 18.3 `@Transactional` Propagation

```java
@Transactional  // Default: REQUIRED
public void methodA() {
    // Runs in a transaction
    methodB();  // Runs in the SAME transaction (REQUIRED propagation reuses existing)
}

@Transactional(propagation = Propagation.REQUIRES_NEW)
public void methodB() {
    // Suspends the existing transaction and starts a NEW one
    // Changes committed even if methodA's transaction rolls back
}
```

**Common propagation types:**
| Propagation | Behavior |
|-------------|----------|
| `REQUIRED` (default) | Join existing transaction or create new one |
| `REQUIRES_NEW` | Always create a new transaction (suspend existing) |
| `SUPPORTS` | Join existing or run without transaction |
| `NOT_SUPPORTED` | Always run without transaction (suspend existing) |
| `NEVER` | Throw exception if transaction exists |
| `MANDATORY` | Throw exception if no transaction exists |

### 18.4 `@Transactional` in Tests

```java
@Transactional
@Test
public void testSomeDatabaseOperation() {
    // Data saved here is automatically rolled back after the test
    // No need to clean up test data!
    userRepository.save(testUser);
    assertEquals(1, userRepository.count());
}
// After test method: transaction is rolled back — testUser is gone
```

This is how test isolation works without truncating tables between tests. Each `@Test` method runs in a transaction that Spring rolls back, leaving the database in its original state.

---

## 19. Testing: The Full Pyramid

### 19.1 The Testing Pyramid

```
            /\
           /  \    ← E2E Tests (few, slow, test whole system)
          /────\
         /      \  ← Integration Tests (moderate, test component interaction)
        /────────\
       /          \ ← Unit Tests (many, fast, test single unit in isolation)
      /────────────\
```

**Our test breakdown:**
- **Unit**: `JwtServiceTest` (9), `CoupleServiceTest` (9), `GameServiceTest` (30) — test service methods with mocked repositories
- **Integration (REST)**: `RestControllerTest` (12) — tests the full HTTP request pipeline with MockMvc + H2 DB
- **Integration (WebSocket)**: `GameControllerWebSocketTest` (6) — tests real WebSocket connections end-to-end
- **Performance**: `WebSocketPerformanceTest` (3) — measures latency under realistic conditions

### 19.2 Unit Testing with Mockito

```java
@ExtendWith(MockitoExtension.class)  // JUnit 5: use Mockito's extension
class GameServiceTest {
    
    @Mock
    private GameSessionRepository gameSessionRepository;
    // Creates a mock (fake) that records method calls and returns configured responses
    
    @Mock
    private GameAnswerRepository gameAnswerRepository;
    
    @InjectMocks
    private GameService gameService;
    // Creates a real GameService and injects the mocks (via constructor/setter/field)
    
    @Test
    void testSubmitAnswer_FirstPlayer() {
        // ARRANGE: Define what the mocks should return
        UUID sessionId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        
        GameSession session = GameSession.builder()
            .id(sessionId)
            .status("ROUND1")
            .currentQuestionIndex(0)
            .questionIds("1,2,3,4,5,6,7,8")
            .build();
        
        when(gameSessionRepository.findById(sessionId))
            .thenReturn(Optional.of(session));
        
        when(gameAnswerRepository.countByGameSession_IdAndQuestion_Id(sessionId, 1))
            .thenReturn(1L);  // Only 1 player answered (this player)
        
        when(gameAnswerRepository
            .findByGameSession_IdAndQuestion_IdAndUser_Id(sessionId, 1, userId))
            .thenReturn(null);  // Not a duplicate
        
        // ACT: Call the method under test
        gameService.submitAnswer(sessionId, userId, "A", 1);
        
        // ASSERT: Verify the mocks were called correctly
        verify(gameAnswerRepository).save(any(GameAnswer.class));
        verify(gameSessionRepository, never()).save(any());  // Game shouldn't advance yet (only 1 answer)
    }
}
```

**Key Mockito methods:**
- `when(mock.method()).thenReturn(value)` — stub a method call
- `when(mock.method()).thenThrow(exception)` — stub to throw
- `verify(mock).method(args)` — assert a method was called
- `verify(mock, times(2)).method()` — assert called exactly N times
- `verify(mock, never()).method()` — assert never called
- `any(ClassName.class)` — argument matcher for "any instance of this class"
- `eq(value)` — argument matcher for exact value
- `ArgumentCaptor<T>` — capture what arguments were passed to a mock

### 19.3 Spring MVC Testing with MockMvc

```java
@SpringBootTest  // Loads the full Spring ApplicationContext
@AutoConfigureMockMvc  // Creates MockMvc (doesn't start real HTTP server)
@ActiveProfiles("test")  // Loads test application.properties
class RestControllerTest {
    
    @Autowired
    private MockMvc mockMvc;  // The test HTTP client
    
    @Autowired
    private JwtService jwtService;
    
    @Test
    void testGetCurrentUser_WithValidJwt() throws Exception {
        // Create a JWT for the test user
        String token = jwtService.generateToken(testUser);
        
        mockMvc.perform(
            get("/api/user/me")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
        )
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.email").value("alice@example.com"))
        .andExpect(jsonPath("$.name").value("Alice"));
        // jsonPath: uses JSONPath expressions to navigate the JSON response
    }
    
    @Test
    void testGetCurrentUser_WithoutJwt() throws Exception {
        mockMvc.perform(get("/api/user/me"))
            .andExpect(status().isForbidden());  // 403 — no authentication
    }
}
```

**`MockMvc` vs starting a real server**: `MockMvc` dispatches requests directly to the `DispatcherServlet` without binding to an actual network port. This is faster, more deterministic, and doesn't require port availability. The full Spring context (security, controllers, services) is loaded — only the network layer is skipped.

### 19.4 WebSocket Integration Testing

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
// RANDOM_PORT: Starts the embedded Tomcat on a random available port
// Required for WebSocket testing — WebSockets need a real running server
class GameControllerWebSocketTest {
    
    @LocalServerPort
    private int port;  // Spring injects the randomly chosen port
    
    @Autowired
    private JwtService jwtService;
    
    @Test
    void testFullGameFlow() throws Exception {
        // Create JWTs for two players
        String tokenA = jwtService.generateToken(player1);
        String tokenB = jwtService.generateToken(player2);
        
        // Create blocking queues to receive async messages
        BlockingQueue<GameInvitationDto> invitationQueue = new LinkedBlockingQueue<>();
        
        // Connect player B (who will receive the invitation)
        StompSession sessionB = connectWebSocket(tokenB);
        sessionB.subscribe("/user/queue/game-events", new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) {
                return GameInvitationDto.class;
            }
            
            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                invitationQueue.add((GameInvitationDto) payload);
            }
        });
        
        // Connect player A and send invitation
        StompSession sessionA = connectWebSocket(tokenA);
        sessionA.send("/app/game.invite", new GameInvitationDto(categoryId));
        
        // Wait for player B to receive the invitation (with timeout)
        GameInvitationDto invitation = invitationQueue.poll(5, TimeUnit.SECONDS);
        assertNotNull(invitation, "Player B should have received invitation");
        assertEquals("Fun Hypotheticals", invitation.getCategoryName());
    }
}
```

**Why `BlockingQueue`?** WebSocket message delivery is asynchronous. The test thread can't just check a variable immediately after sending — the message might not have arrived yet. `BlockingQueue.poll(timeout, unit)` blocks the test thread until either the message arrives or the timeout elapses. This is the standard pattern for testing async systems.

### 19.5 H2 In-Memory Database for Tests

**H2** is a Java-based in-memory relational database used exclusively for testing. Benefits:
- No PostgreSQL installation required to run tests
- Each test run starts with a clean state
- Tests run faster (in-memory vs disk I/O)
- Isolation: tests don't affect real data

**Compatibility mode**: H2 supports `MODE=PostgreSQL` which enables PostgreSQL-specific SQL syntax (like `RANDOM()`, `UUID`, etc.):
```
spring.datasource.url=jdbc:h2:mem:testdb;MODE=PostgreSQL;DB_CLOSE_DELAY=-1
```

**Limitation**: H2 doesn't support 100% of PostgreSQL's feature set. Advanced types (`JSONB`, arrays), extensions (`pg_trgm`), and some functions won't work in H2 mode. For those features, use a real PostgreSQL test container (Testcontainers library).

---

## 20. React Native Architecture

### 20.1 The JavaScript Bridge (Old Architecture)

In React Native's original architecture:
```
[JS Thread] ←──── JSON Bridge ────→ [Native Thread]
```

- JavaScript (React) runs on a **separate JS thread** (Hermes engine)
- Native UI is rendered on the **main/UI thread**
- Every communication between JS and native goes through a **JSON-serialized bridge**
- The bridge is **asynchronous and batched** — this caused UI jank for heavy animations

**Problems with the bridge:**
- Serialization/deserialization overhead for every native call
- Asynchronous: JS calls are batched and dispatched, not synchronous
- Can't share memory between JS and native
- Complex animation APIs (Animated) were slow because every frame update crosses the bridge

### 20.2 New Architecture: Fabric + TurboModules

React Native 0.75.4 ships with the **New Architecture** enabled, which replaces the bridge:

**Fabric (new renderer)**:
- Uses **JSI (JavaScript Interface)** for direct C++ calls from JS — no serialization
- Synchronous rendering possible for certain operations
- Concurrent rendering support (React 18's concurrent features)
- Shadow tree calculations happen directly in C++ (not through the bridge)

**TurboModules (new native modules)**:
- Native modules load lazily (only when first accessed) instead of all at startup
- Direct JS-to-C++ calls via JSI
- Typed interfaces via CodeGen (from TypeScript definitions)

**Hermes Engine**:
- Google's V8 and Apple's JavaScriptCore are general-purpose JS engines
- **Hermes** is Meta's JS engine optimized specifically for React Native:
  - Pre-compiles JS to bytecode at build time (faster startup)
  - Smaller memory footprint
  - Optimized garbage collector for mobile constraints

### 20.3 The Metro Bundler

**Metro** is React Native's JavaScript bundler (analogous to webpack in web development). It:
1. Resolves `import` statements, following the module graph
2. Transforms JSX and modern JS to compatible code (via Babel)
3. Bundles all modules into a single JS bundle
4. In development: watches for file changes and hot-reloads

**Why Metro instead of webpack?** Metro is optimized for React Native's module resolution, supports platform-specific extensions (`.android.js`, `.ios.js`), and integrates with Metro's fast refresh.

### 20.4 Android Build System for React Native

```
[React Native 0.75.4]
      ↕ requires
[Android Gradle Plugin 8.7.3]
      ↕ uses
[Gradle 8.10 Wrapper]
      ↕ compiles with
[Android SDK 34 + NDK]
      ↕ runs with
[JDK 17]
```

The **Android Gradle Plugin (AGP)** manages:
- Compiling Java/Kotlin source code
- Processing React Native's native modules
- Packaging APK/AAB
- Managing signing configurations

**Version alignment is critical**: React Native 0.75.4 requires AGP 8.x. Running AGP 7.x with RN 0.75.4 causes build failures. This is why the upgrade had to be coordinated:
- RN 0.72 → AGP 7.4.2, Gradle 7.6.1, SDK 33
- RN 0.75.4 → AGP 8.7.3, Gradle 8.10, SDK 34/35

---

## 21. React Hooks: Deep Dive

### 21.1 `useState`: Controlled State

```javascript
const [activeSession, setActiveSession] = useState(null);
// activeSession: current state value (immutable snapshot)
// setActiveSession: function to schedule a state update
// React will re-render the component after the update
```

**Why state updates are asynchronous:** `setActiveSession(newSession)` doesn't update `activeSession` immediately. React batches state updates and processes them before the next render. This means:

```javascript
// WRONG: currentQuestion is still null here (stale closure)
setCurrentQuestion(newQuestion);
console.log(currentQuestion); // null — not yet updated

// CORRECT: Use the functional update form to depend on latest state
setCurrentQuestion(prev => {
    console.log(prev); // This sees the latest state
    return newQuestion;
});
```

### 21.2 `useEffect`: Side Effects and Lifecycle

```javascript
// 1. Runs after EVERY render (no dependency array — rarely what you want)
useEffect(() => {
    console.log("Rendered");
});

// 2. Runs once on mount (empty dependency array = "run once")
useEffect(() => {
    fetchCategories();
    return () => {
        // Cleanup: runs on unmount
        // Use to: cancel subscriptions, clear timers, abort fetch requests
    };
}, []);

// 3. Runs when dependencies change
useEffect(() => {
    if (activeSession) {
        subscribeToGameTopic(activeSession.id);
    }
}, [activeSession]); // Re-runs whenever activeSession changes (by reference)
```

**The stale closure problem:**
```javascript
const [count, setCount] = useState(0);

useEffect(() => {
    const interval = setInterval(() => {
        // This closure captures 'count' at the time the effect ran
        // If count was 0 when effect ran, it's always 0 in this closure
        console.log(count); // Always 0 — stale closure!
    }, 1000);
    return () => clearInterval(interval);
}, []); // Empty deps — effect never re-runs, closure is stale

// FIX: Use functional state update (doesn't need the closure's 'count')
setCount(prev => prev + 1);
// OR: Add 'count' to dependencies (effect re-runs when count changes)
```

### 21.3 `useRef`: Mutable Values Without Re-renders

```javascript
// NavigationRef for programmatic navigation from non-component code
const navigationRef = useRef(null);

// Setting a ref does NOT trigger a re-render
navigationRef.current = navigation;

// The ref's current value is always up-to-date in event handlers/async code
// (unlike state, which requires re-rendering to see new values)
function handleInvitation() {
    navigationRef.current.navigate('GameScreen'); // Always uses latest navigation object
}
```

**When to use `useRef` vs `useState`:**
- `useRef`: Values that must be current in async callbacks but shouldn't trigger re-renders (navigation objects, WebSocket subscriptions, timers)
- `useState`: Values that should cause UI updates when changed

### 21.4 `useContext`: Consuming Context

```javascript
const { activeSession, submitAnswer } = useContext(GameContext);
// This component now re-renders whenever the GameContext value changes
```

**Performance consideration**: Every component using `useContext` re-renders when the **context value object** changes. If the context provider is at the root and updates frequently (e.g., WebSocket messages), all consumers re-render. Solutions:
- Split contexts (separate `AuthContext` from `GameContext`)
- Memoize the context value with `useMemo`
- Use `useReducer` for complex state to batch updates

### 21.5 `useCallback`: Memoizing Functions

```javascript
const submitAnswer = useCallback((answer) => {
    WebSocketService.sendMessage('/app/game.answer', {
        sessionId: activeSession.id,
        answer
    });
}, [activeSession]); // Only recreate when activeSession changes
```

Without `useCallback`, the function reference changes on every render, causing any child component that receives `submitAnswer` as a prop to re-render unnecessarily (even if the function behavior hasn't changed).

---

## 22. Context API & State Management

### 22.1 The Context API Pattern

React's Context API solves "prop drilling" — the need to pass props through many component layers to reach deeply nested components.

**Without Context (prop drilling):**
```
App → AppNavigator → MainStack → DashboardScreen → GameButton → [needs JWT]
```

**With Context:**
```javascript
// AuthContext.js — Provider wraps entire app
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    
    const login = useCallback(async (userData, jwt) => {
        await AsyncStorage.setItem('userToken', jwt);
        setToken(jwt);
        setUser(userData);
        setIsLoggedIn(true);
    }, []);
    
    const logout = useCallback(async () => {
        await AsyncStorage.removeItem('userToken');
        setToken(null);
        setUser(null);
        setIsLoggedIn(false);
    }, []);
    
    const value = useMemo(() => ({
        isLoggedIn, user, token, login, logout
    }), [isLoggedIn, user, token, login, logout]);
    
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Any component can access auth state directly:
export const useAuth = () => useContext(AuthContext);
```

### 22.2 Context vs Redux

| Aspect | Context API | Redux |
|--------|-------------|-------|
| Learning curve | Low | High |
| Boilerplate | Minimal | Significant (actions, reducers, selectors) |
| DevTools | Basic (React DevTools) | Excellent (Redux DevTools) |
| Performance | Re-renders all consumers on update | `useSelector` only re-renders if selected slice changed |
| Middleware | None native | Redux Thunk, Saga for async |
| Best for | Simple-moderate state | Complex state with many updates |

**We chose Context API** because our state is simple:
- `AuthContext`: Auth status (one-time changes)
- `GameContext`: Game state (changes ~8-16 times per game session)

At this complexity level, adding Redux would be over-engineering.

### 22.3 The GameContext: Complex State Management

```javascript
// GameContext.js — manages the entire real-time game state
export function GameProvider({ children }) {
    // Round 1 state
    const [activeSession, setActiveSession] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [myAnswer, setMyAnswer] = useState(null);
    const [waitingForPartner, setWaitingForPartner] = useState(false);
    const [gameStatus, setGameStatus] = useState(null);  // 'playing', 'waiting', 'round1_complete', 'completed'
    
    // Round 2 state
    const [round, setRound] = useState('round1');  // 'round1' | 'round2'
    const [guessResult, setGuessResult] = useState(null);
    const [scores, setScores] = useState(null);
    const [correctCount, setCorrectCount] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    
    // WebSocket subscription reference
    const gameSubscription = useRef(null);
    
    const startGame = useCallback((session, firstQuestion) => {
        setActiveSession(session);
        setCurrentQuestion(firstQuestion);
        setGameStatus('playing');
        setRound('round1');
        
        // Subscribe to the game topic for this session
        gameSubscription.current = WebSocketService.subscribe(
            `/topic/game/${session.id}`,
            (payload) => {
                // Handle incoming messages from the server
                if (payload.type === 'QUESTION') {
                    if (payload.round === 'ROUND2') {
                        setRound('round2');
                        setIsTransitioning(false);
                    }
                    setCurrentQuestion(payload);
                    setMyAnswer(null);
                    setWaitingForPartner(false);
                    setGuessResult(null);
                } else if (payload.type === 'STATUS' && payload.status === 'ROUND1_COMPLETE') {
                    setIsTransitioning(true);
                    setCurrentQuestion(null);
                } else if (payload.type === 'GAME_RESULTS') {
                    setScores(payload);
                    setGameStatus('completed');
                }
            }
        );
    }, []);
    
    // ... more methods
}
```

### 22.4 Cross-Context Communication via Refs

`AuthContext` handles WebSocket invitation events (it connects to the WebSocket on login). When a game invitation arrives, it needs to:
1. Show an alert
2. If accepted: tell `GameContext` to start the game
3. Navigate to the `GameScreen`

The problem: `AuthContext` doesn't have access to `GameContext` (contexts can't directly access each other), and it can't import the navigation object directly.

**Solution: React Refs for imperative API access**

```javascript
// In AppNavigator.js:
export const navigationRef = createRef();  // Exported navigation ref
export const gameContextRef = createRef(); // Exported game context ref

// In App.js:
function App() {
    const gameValue = useGameContextValue(); // get the game context functions
    
    useEffect(() => {
        // Set the ref so AuthContext can call these functions
        gameContextRef.current = { startGame: gameValue.startGame };
    }, [gameValue.startGame]);
    
    return (
        <NavigationContainer ref={navigationRef}>
            <AuthProvider gameContextRef={gameContextRef}>
                <GameProvider>
                    <AppNavigator />
                </GameProvider>
            </AuthProvider>
        </NavigationContainer>
    );
}

// In AuthContext.js:
function handleInvitationAccepted(sessionId) {
    // Imperative call via ref — doesn't trigger any re-renders
    gameContextRef.current.startGame(session, firstQuestion);
    navigationRef.current.navigate('Game');
}
```

This is the **Ref pattern** — using `ref.current` to imperatively call functions across contexts without prop drilling or event emitters. React's official docs recommend refs for "escape hatches" in cases where you need to communicate with systems outside React's data flow.

---

## 23. React Navigation

### 23.1 Stack Navigator

A **Stack Navigator** maintains a navigation history as a stack (LIFO). Navigating to a screen pushes it onto the stack; pressing Back pops it.

```javascript
import { createStackNavigator } from '@react-navigation/stack';
const Stack = createStackNavigator();

function AppNavigator() {
    const { isLoggedIn } = useAuth();
    
    return (
        <NavigationContainer ref={navigationRef}>
            <Stack.Navigator>
                {isLoggedIn ? (
                    // Authenticated screens
                    <>
                        <Stack.Screen name="Dashboard" component={DashboardScreen} />
                        <Stack.Screen name="Profile" component={ProfileScreen} />
                        <Stack.Screen name="PartnerLink" component={PartnerLinkScreen} />
                        <Stack.Screen name="CategorySelection" component={CategorySelectionScreen} />
                        <Stack.Screen
                            name="Game"
                            component={GameScreen}
                            options={{
                                headerLeft: null,      // Disable back button
                                gestureEnabled: false  // Disable swipe-to-go-back
                                // These prevent accidentally leaving a game mid-session
                            }}
                        />
                        <Stack.Screen
                            name="Results"
                            component={ResultsScreen}
                            options={{ headerLeft: null, gestureEnabled: false }}
                        />
                    </>
                ) : (
                    // Unauthenticated screens
                    <Stack.Screen name="SignIn" component={SignInScreen} />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
```

### 23.2 Conditional Navigation Based on Auth State

The pattern of rendering different screens based on `isLoggedIn` is called **conditional rendering for navigation**. React Navigation re-evaluates the navigator structure whenever the component re-renders. When `isLoggedIn` changes:
- `true → false`: The authenticated screens are removed from the navigator → navigation resets to the login screen
- `false → true`: The unauthenticated screen is removed → navigation shows the dashboard

This is cleaner than imperative navigation (`navigate('Dashboard')`) because it's **declarative** — the UI derives from state, not from explicit navigation commands.

### 23.3 `useFocusEffect` vs `useEffect`

```javascript
import { useFocusEffect } from '@react-navigation/native';

// useFocusEffect: runs when screen COMES INTO FOCUS (becomes visible)
// and the cleanup runs when it LEAVES focus
useFocusEffect(
    useCallback(() => {
        fetchCoupleStatus(); // Re-fetch every time user returns to this screen
        return () => {
            // Cleanup when screen loses focus
        };
    }, [])
);
```

**Why `useFocusEffect` instead of `useEffect` for data fetching in navigated screens:**
- `useEffect` with `[]` runs once on mount. If you navigate away and back, data isn't refreshed.
- `useFocusEffect` re-fetches every time the screen becomes active — important for the Dashboard that shows partner connection status.

---

## 24. HTTP Client: Axios & Interceptors

### 24.1 Axios Instance with Interceptors

```javascript
// services/api.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://10.0.2.2:8080'; // 10.0.2.2 = localhost on Android emulator

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000, // 10 second timeout
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor: runs before every request
api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor: runs after every response
api.interceptors.response.use(
    (response) => response, // Pass through successful responses
    async (error) => {
        if (error.response?.status === 401) {
            // JWT expired or invalid — log out the user
            await AsyncStorage.removeItem('userToken');
            // Trigger navigation to sign-in screen (via auth context or navigation ref)
        }
        return Promise.reject(error);
    }
);

export default api;
```

### 24.2 Why a Singleton Axios Instance

Using `axios.create()` creates an instance with default configuration. All API calls in the app use this instance, so:
- JWT injection is automatic (no need to add the header in every call)
- Base URL is centralized (change the host in one place)
- Timeout is consistent
- Error handling logic (e.g., 401 → logout) is centralized

### 24.3 Android Emulator Networking

`localhost` in an Android emulator refers to the **emulator's own loopback interface**, not the development machine's localhost. The special IP `10.0.2.2` routes to the host machine's loopback, allowing the app to reach the Spring Boot server running on the dev machine.

For physical devices or deployed backends, use the actual IP/domain.

---

## 25. WebSocket Client: STOMP.js & SockJS

### 25.1 Singleton Service Pattern

```javascript
// services/WebSocketService.js
class WebSocketService {
    constructor() {
        this.stompClient = null;
        this.subscriptions = {};
        this.isConnected = false;
    }
    
    connect(token) {
        const socket = new SockJS('http://10.0.2.2:8080/ws');
        // SockJS wraps the WebSocket or fallback transport
        
        this.stompClient = new Client({
            webSocketFactory: () => socket,
            connectHeaders: {
                Authorization: `Bearer ${token}` // JWT in STOMP CONNECT frame
            },
            reconnectDelay: 5000, // Auto-reconnect after 5 seconds
            onConnect: () => {
                this.isConnected = true;
                this.resubscribeAll(); // Re-subscribe after reconnect
            },
            onDisconnect: () => {
                this.isConnected = false;
            },
            onStompError: (frame) => {
                console.error('STOMP error:', frame);
            }
        });
        
        this.stompClient.activate(); // Start connection
    }
    
    subscribe(destination, callback) {
        if (!this.isConnected) {
            // Queue subscription for after connection
            this.pendingSubscriptions[destination] = callback;
            return;
        }
        
        const sub = this.stompClient.subscribe(destination, (message) => {
            const payload = JSON.parse(message.body);
            callback(payload);
        });
        
        this.subscriptions[destination] = sub;
        return sub;
    }
    
    sendMessage(destination, payload) {
        this.stompClient.publish({
            destination,
            body: JSON.stringify(payload)
        });
    }
    
    disconnect() {
        if (this.stompClient) {
            this.stompClient.deactivate();
        }
        this.subscriptions = {};
        this.isConnected = false;
    }
}

// Export singleton instance
export default new WebSocketService();
```

**Why a singleton?** The WebSocket connection is expensive to establish. Using a singleton ensures:
- Only one connection exists at a time
- Subscriptions survive screen navigation (the connection doesn't disconnect when you leave a screen)
- Easy to reconnect after logout/login

### 25.2 STOMP Destination Patterns in Practice

```javascript
// Subscribe to broadcast game topic (both players get these)
WebSocketService.subscribe(`/topic/game/${sessionId}`, handleGameMessage);

// Subscribe to private user queue (only this user gets these)
WebSocketService.subscribe('/user/queue/game-events', handleGameEvent);
// React Native's WebSocketService sends: SUBSCRIBE /user/queue/game-events
// Spring Security on the server translates this to: /user/{email}/queue/game-events
// And the server sends to: /user/{email}/queue/game-events
// The client automatically receives messages on their resolved private path

// Send a message to the application layer
WebSocketService.sendMessage('/app/game.invite', { categoryId });
WebSocketService.sendMessage('/app/game.answer', { sessionId, questionId, answer });
WebSocketService.sendMessage('/app/game.guess', { sessionId, questionId, guess });
```

---

## 26. Google Sign-In on React Native

### 26.1 Native Module Architecture

`@react-native-google-signin/google-signin` is a **native module** — it bridges between JavaScript and platform-specific native code (Java/Kotlin on Android, Objective-C/Swift on iOS). The native code:
- Presents Google's Sign-In UI (a native bottom sheet on Android)
- Calls Google's SDK
- Returns the result to JavaScript

### 26.2 Configuration

```javascript
// App.js (root level — runs once at app startup)
import { GoogleSignin } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
    webClientId: 'your-web-client-id.apps.googleusercontent.com',
    // The webClientId from Google Cloud Console
    // This is the "Web Application" type OAuth client ID
    // (NOT the Android client ID)
    // Why the Web client ID? The ID token is verified on the backend (a "web" server)
    // The audience (aud) claim in the ID token must match this client ID
    offlineAccess: false, // true = get refresh token for server-side use
    scopes: ['profile', 'email'], // Request only what you need
});
```

**Why is it the "Web client ID" that matters?** When the backend verifies the `id_token` with `GoogleIdTokenVerifier.setAudience(googleWebClientId)`, it checks that the token's `aud` claim matches the web client ID. The ID token's audience is set to whichever client type initiated the sign-in. Since the backend server is a "web" application, use the web client ID as the audience.

### 26.3 The Sign-In Flow in Code

```javascript
async function handleSignIn() {
    try {
        await GoogleSignin.hasPlayServices(); // Checks Play Services availability
        const { user, idToken } = await GoogleSignin.signIn();
        // user: { id, name, email, photo } — Google user info
        // idToken: the JWT from Google (this is what we send to backend)
        
        const response = await api.post('/api/auth/google/signin', { idToken });
        const { token: appToken } = response.data;
        
        await login(user, appToken);
        // AuthContext.login stores the JWT and updates isLoggedIn → navigation auto-redirects
        
    } catch (error) {
        if (error.code === statusCodes.SIGN_IN_CANCELLED) {
            // User dismissed the sign-in dialog
        } else if (error.code === statusCodes.IN_PROGRESS) {
            // Sign-in already in progress
        } else {
            console.error('Sign-in error:', error);
        }
    }
}
```

---

## 27. AsyncStorage: Secure Local Persistence

### 27.1 What AsyncStorage Is

`@react-native-async-storage/async-storage` is a simple key-value store that persists data across app restarts. It stores data in:
- **Android**: SharedPreferences (XML files in the app's private storage)
- **iOS**: NSUserDefaults or the file system (in the app's sandboxed storage)

### 27.2 The JWT Persistence Pattern

```javascript
// On login: persist the token
await AsyncStorage.setItem('userToken', jwt);

// On app startup: restore session
const storedToken = await AsyncStorage.getItem('userToken');
if (storedToken && jwtService.isValid(storedToken)) {
    // Auto-login without showing the sign-in screen
    setToken(storedToken);
    setIsLoggedIn(true);
}

// On logout: clear the token
await AsyncStorage.removeItem('userToken');
```

### 27.3 Security Considerations

`AsyncStorage` is **not encrypted** by default. For highly sensitive data (passwords, payment tokens), use:
- `react-native-keychain` — stores in the device's secure keystore (Android Keystore, iOS Keychain)
- `react-native-encrypted-storage` — AES-encrypted AsyncStorage

For JWTs, AsyncStorage is considered acceptable in many apps because:
- The device must be unlocked to access the app
- App sandboxing prevents other apps from reading your storage
- If the device is rooted/jailbroken, security is already compromised at the OS level

The security-conscious decision would be to use the secure keychain. This is a technical debt item in our project.

---

## 28. React Native New Architecture

### 28.1 JSI: The Core of New Architecture

**JSI (JavaScript Interface)** is a lightweight C++ API that allows JavaScript to hold references to C++ host objects and call methods on them synchronously.

**Old bridge**: 
```
JS thread → JSON serialize → bridge → JSON deserialize → Native thread
```

**JSI**:
```
JS thread → Direct C++ call via JSI → Native
```

This enables:
- Synchronous calls (critical for animations that must stay in sync with scrolling)
- Shared memory (no serialization)
- Typed interfaces (CodeGen generates type-safe bindings)

### 28.2 Enabling New Architecture

In `android/gradle.properties`:
```properties
newArchEnabled=true   # Enables Fabric + TurboModules
hermesEnabled=true    # Use Hermes engine
```

### 28.3 Impact on Third-Party Libraries

New Architecture requires that native modules implement the new **TurboModule** interface and renderers implement the new **Fabric** specification. Libraries that haven't been updated to support New Architecture will fail or behave incorrectly. Before enabling New Architecture, you must verify all dependencies are compatible.

During the RN upgrade, we verified compatibility for:
- `@react-native-google-signin/google-signin`
- `@stomp/stompjs` (pure JS, no native — always compatible)
- `sockjs-client` (pure JS)
- `@react-native-async-storage/async-storage`
- `@react-navigation/*`

---

## 29. Frontend Testing: Jest & React Native Testing Library

### 29.1 Jest Configuration for React Native

```javascript
// jest.config.js
module.exports = {
    preset: 'react-native',  // Configures Jest for React Native
    // OR a custom setup (to avoid Metro preset issues):
    testEnvironment: 'node',
    transform: {
        '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
    },
    moduleNameMapper: {
        // Mock native modules that don't work in Jest's Node.js environment
        '^react-native$': '<rootDir>/jest/react-native-mock.js',
        '^@react-native-async-storage/async-storage$': 
            '<rootDir>/__mocks__/asyncStorage.js',
    },
    setupFilesAfterFramework: ['<rootDir>/jest.setup.js'],
};
```

**Why mocking is necessary**: Jest runs in Node.js, not in an Android/iOS runtime. Native modules (camera, Bluetooth, AsyncStorage, Google Sign-In) don't have Node.js implementations. We mock them to return predictable values in tests.

### 29.2 React Native Testing Library

```javascript
import { render, fireEvent, waitFor } from '@testing-library/react-native';

test('GameScreen shows waiting indicator after submit', async () => {
    const mockSubmitAnswer = jest.fn();
    
    render(
        <GameContext.Provider value={{
            currentQuestion: mockQuestion,
            submitAnswer: mockSubmitAnswer,
            waitingForPartner: false
        }}>
            <GameScreen />
        </GameContext.Provider>
    );
    
    // Select an option
    fireEvent.press(screen.getByText('Option A'));
    
    // Press submit
    fireEvent.press(screen.getByText('Submit Answer'));
    
    // Verify submit was called with 'A'
    expect(mockSubmitAnswer).toHaveBeenCalledWith('A');
});
```

**Testing philosophy**: Test behavior from the user's perspective, not implementation details. `getByText('Submit Answer')` finds the button the user sees, not `getByTestId('submit-btn')` which is tied to implementation. If you rename the button text, the test catches the regression. If you only test by `testId`, you can rename user-facing text without tests failing (false negative).

### 29.3 Mocking WebSocket Service

```javascript
// In tests, mock the entire WebSocketService module
jest.mock('../services/WebSocketService', () => ({
    connect: jest.fn(),
    subscribe: jest.fn().mockReturnValue({ unsubscribe: jest.fn() }),
    sendMessage: jest.fn(),
    disconnect: jest.fn(),
}));

// Now calls to WebSocketService.sendMessage() in the component are captured:
expect(WebSocketService.sendMessage).toHaveBeenCalledWith(
    '/app/game.answer',
    expect.objectContaining({ answer: 'B' })
);
```

---

## 30. System Design Concepts Applied

### 30.1 Stateless vs. Stateful Design

**Stateless (REST API layer)**: Each HTTP request contains all information needed to process it (JWT in header). The server doesn't remember previous requests. Advantages:
- Any server instance can handle any request (horizontal scalability)
- Simple load balancing (no sticky sessions)
- Easy to restart/deploy new versions

**Stateful (WebSocket layer)**: WebSocket connections are persistent. The server knows which WebSocket session belongs to which user (via the STOMP session's Principal). This stateful connection enables server-to-client push.

**The tension**: Stateless is better for scalability, but WebSockets are inherently stateful. At scale, you'd use a **message broker** (RabbitMQ, Redis Pub/Sub, Apache Kafka) to decouple WebSocket connections from application instances:
```
Client A → App Server 1 → RabbitMQ ← App Server 2 → Client B
```

Both app servers subscribe to the game topic in RabbitMQ. A message published to the topic on Server 1 is delivered to Client B connected to Server 2. This is why we documented "in-memory message broker is not production-ready" as technical debt.

### 30.2 The Publisher-Subscriber Pattern

STOMP's topic/subscription model is an implementation of **Pub/Sub**:
- **Publishers** (servers, clients) send messages to a topic
- **Subscribers** (clients) declare interest in a topic
- The **broker** handles delivery

Benefits:
- **Decoupling**: The publisher doesn't know who the subscribers are (or even if there are any)
- **Fanout**: One message automatically delivered to all subscribers
- **Async**: Publisher and subscribers are temporally decoupled

### 30.3 Event-Driven Architecture

The game's gameplay loop is entirely event-driven:

```
Event: Player A answers → Handler: submitAnswer() → Event emitted: ANSWER_RECORDED
Event: Both answered → Handler: advanceQuestion() → Event emitted: QUESTION (next)
Event: Last question answered → Handler: endRound1() → Event emitted: ROUND1_COMPLETE
Event: Player A guesses → Handler: submitGuess() → Event emitted: GUESS_RESULT (private)
...
```

This is **reactive**: the system responds to events, rather than the server polling "has someone answered yet?" every second. Event-driven systems have lower latency and use resources more efficiently.

### 30.4 API Design: REST vs WebSocket Choice

| Concern | REST (HTTP) | WebSocket (STOMP) |
|---------|-------------|-------------------|
| Authentication/authorization | ✅ Excellent | ✅ Good (CONNECT-time auth) |
| Caching | ✅ Standard (ETags, Cache-Control) | ❌ Not applicable |
| Error handling | ✅ HTTP status codes (400, 401, 404, 500) | ⚠️ Custom error frames |
| Load balancing | ✅ Easy (stateless) | ⚠️ Needs sticky sessions or external broker |
| Client push (server-initiated) | ❌ Not native (polling/SSE workarounds) | ✅ Native |
| Bidirectional real-time | ❌ Not native | ✅ Native |

**Decision rule**: Use REST for CRUD operations where request-response is natural. Use WebSocket for real-time events where either party needs to initiate communication.

---

## 31. Security Hardening & Common Pitfalls

### 31.1 CORS (Cross-Origin Resource Sharing)

**CORS** is a browser security mechanism that prevents JavaScript from making requests to a different origin (domain, port, or protocol) than the page's origin, unless the server explicitly allows it.

In development, the React Native app runs on a simulator/device and talks to `localhost:8080`. No browser is involved, so CORS doesn't apply. In production, if you have a web frontend talking to the API, you'd configure CORS:

```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(List.of("https://yourdomain.com")); // NOT "*" in production
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE"));
    config.setAllowedHeaders(List.of("Authorization", "Content-Type"));
    return source;
}
```

**Current technical debt**: We use `setAllowedOriginPatterns("*")` in WebSocket config, which allows any origin. In production, restrict this to known origins.

### 31.2 JWT Security Best Practices

| Practice | Status | Notes |
|----------|--------|-------|
| Short expiry | ⚠️ Configurable | 24h is long; consider 1h + refresh tokens |
| HTTPS only | ❌ Pending | Sprint 6 |
| Secret in env vars | ❌ Pending | Currently in application.properties |
| Token revocation | ❌ Not implemented | Would need a blocklist (Redis) |
| Refresh tokens | ❌ Not implemented | When access token expires, re-auth required |

**Token revocation problem**: JWTs are stateless — once issued, you can't "un-issue" them. If a JWT is stolen, the attacker can use it until it expires. Solutions:
- Short expiry (1 hour) with refresh tokens
- JWT blocklist (store revoked token IDs in Redis; check on every request — adds latency)
- Use stateful sessions instead (with Redis) for high-security apps

### 31.3 Input Validation

```java
// GuessRequestDto.java
public class GuessRequestDto {
    private UUID sessionId;
    private Integer questionId;
    
    @Pattern(regexp = "^[A-D]$", message = "Guess must be A, B, C, or D")
    // Jakarta validation — Spring Boot validates this before the method is called
    // Without validation, a user could send any string as an answer
    private String guess;
}
```

```java
// In @MessageMapping method:
@MessageMapping("/game.guess")
public void handleGuess(@Validated @Payload GuessRequestDto request, Principal principal) {
    // If @Pattern fails, MethodArgumentNotValidException is thrown
    // The @MessageExceptionHandler handles this and sends an error to the client
}
```

**Why validate at the API boundary?** Your service layer should never need to handle invalid data formats. Validation at the controller/WebSocket layer catches malformed input before it reaches business logic, preventing:
- SQL injection (if not using parameterized queries)
- Business logic bypass (e.g., submitting "Z" as an answer to break comparisons)
- Malicious data (XSS in stored strings)

### 31.4 Secrets Management

**Current state (Development):**
```properties
# application.properties — committed to git (BAD for production)
app.jwt.secret=myDevSecret
app.google.client-id=your-google-id
spring.datasource.password=postgres
```

**Production state (Sprint 6):**
```properties
# application.properties — uses ${ENV_VAR} syntax
app.jwt.secret=${JWT_SECRET}
app.google.client-id=${GOOGLE_CLIENT_ID}
spring.datasource.password=${DB_PASSWORD}
```

Environment variables are set in the deployment environment (Docker container, ECS task definition, Cloud Run service), not in the code. This prevents secrets from appearing in git history.

---

## 32. Performance Profiling & Benchmarks

### 32.1 Results from Sprint 4 Performance Tests

```
STOMP connection establishment:       6ms
WebSocket invitation round-trip:     58ms  (target: <200ms) ✅
Average answer submission latency:   56ms  (target: <200ms) ✅  
Full 8-question game completion:    2.4s   (very fast) ✅
JVM heap usage during gameplay:     58MB   (well within limits) ✅
```

### 32.2 Understanding WebSocket Latency

The 56ms round-trip breaks down approximately as:
- **Network (localhost)**: ~0ms (localhost in tests)
- **Spring Security/Authentication**: ~1-2ms
- **Message routing/deserialization**: ~1ms
- **Database query**: ~10-15ms (synchronous DB call in service)
- **Serialization/message dispatch**: ~1ms
- **Total**: ~15-20ms per direction ≈ ~30-40ms round-trip

The extra latency to 56ms includes JVM warm-up overhead in the test environment. In production with warm JVM and network, latency would be higher (dominated by actual network round-trip time).

### 32.3 Performance `@Test` Pattern

```java
// WebSocketPerformanceTest.java
@Test
void testAverageAnswerLatency() throws Exception {
    // Setup: connect two players, accept invitation, receive first question
    // ...
    
    List<Long> latencies = new ArrayList<>();
    
    for (int i = 0; i < 8; i++) {
        long start = System.currentTimeMillis();
        
        sessionA.send("/app/game.answer", answerDto);
        sessionB.send("/app/game.answer", answerDto);
        
        // Wait for next question (or ROUND1_COMPLETE)
        questionQueue.poll(5, TimeUnit.SECONDS);
        
        long latency = System.currentTimeMillis() - start;
        latencies.add(latency);
    }
    
    double avgLatency = latencies.stream()
        .mapToLong(Long::longValue)
        .average()
        .orElse(0);
    
    System.out.printf("Average answer latency: %.1fms%n", avgLatency);
    assertTrue(avgLatency < 200, "Answer latency exceeds 200ms threshold");
}
```

---

## 33. Key Bug Post-Mortems

Understanding bugs deeply is how senior engineers prevent them in the future. Here are the 13 bugs found and fixed during Sprint 4 testing:

### Bug R1: `javax.validation` → `jakarta.validation`

**Root Cause**: Spring Boot 3.x moved from the `javax.*` namespace to `jakarta.*` as part of the Jakarta EE 9+ migration. Spring Boot 2.x used `javax.validation.constraints.*`. Spring Boot 3.x uses `jakarta.validation.constraints.*`.

**Symptom**: Compilation failure — `javax.validation.constraints.NotNull` not found.

**Fix**: Change all `import javax.validation.*` to `import jakarta.validation.*`. Also add `spring-boot-starter-validation` dependency (validation is no longer included transitively by `spring-boot-starter-web` in SB 3.x).

**Lesson**: Always check the Spring Boot 3 migration guide when upgrading from 2.x. The `javax.*` → `jakarta.*` namespace change affects many imports.

### Bug R2: `UUID categoryId` Should Be `Integer`

**Root Cause**: The `question_categories.id` column is `SERIAL` (integer), not UUID. But somewhere in the development process, `GameInvitationDto.categoryId` was typed as `UUID`.

**Symptom**: Runtime `ClassCastException` when Spring tried to bind the `Integer` from the database to a `UUID` field.

**Chain of the bug**: `GameInvitationDto.categoryId` (UUID) → `GameController` passes it → `GameService.createInvitation(UUID categoryId)` → `questionCategoryRepository.findById(UUID)` but repository is `JpaRepository<QuestionCategory, Integer>`.

**Lesson**: Define the primary key types in your schema first, then make sure all Java types that reference it match. Create a single source of truth for type decisions.

### Bug R3: `setQuestionId()` vs `setQuestion()`

**Root Cause**: JPA `@ManyToOne` fields store the full entity, not just the ID. Calling `gameAnswer.setQuestionId(questionId)` fails because the field is `private Question question`, not `private Integer questionId`.

**Symptom**: Compilation error — no such method `setQuestionId()`.

**Fix**:
```java
// WRONG
gameAnswer.setQuestionId(questionId);

// RIGHT: Load the entity first, then set it
Question question = questionRepository.findById(questionId).orElseThrow();
gameAnswer.setQuestion(question);
```

**Lesson**: When using `@ManyToOne`, always remember you're dealing with entity objects, not primitive IDs.

### Bug R6: JwtAuthFilter 500 on Malformed Token

**Root Cause**: The `JwtAuthFilter.doFilterInternal()` method called `jwtService.extractUserId(token)` which could throw `JwtException` (for malformed/expired tokens). Without a try-catch, the exception propagated up to Spring's error handler, which returned a 500 Internal Server Error.

**Symptom**: Sending a request with `Authorization: Bearer garbage` returned 500 instead of 403.

**Fix**:
```java
try {
    String userId = jwtService.extractUserId(token);
    // ... authenticate
} catch (JwtException | IllegalArgumentException e) {
    // Don't propagate — just don't authenticate
    // Spring Security will return 403 Forbidden for the unauthenticated request
}
filterChain.doFilter(request, response); // ALWAYS proceed to next filter
```

**Lesson**: Filters should never let exceptions propagate uncaught. Always call `filterChain.doFilter()` in the `finally` block or after try-catch.

### Bug R7: Mutable vs Immutable `StompHeaderAccessor`

**Root Cause**: `StompHeaderAccessor.wrap(message)` creates a **read-only view** of the message headers. Calling `accessor.setUser(auth)` on it silently did nothing because the wrapper is immutable.

**Symptom**: `Principal principal` was always `null` in `@MessageMapping` methods, even after setting it in the `ChannelInterceptor`.

**Fix**: Use `MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class)` to get the **mutable** accessor that's actually attached to the message.

**Lesson**: The Spring STOMP API has subtle mutability distinctions. The mutable accessor is "attached" to the message and changes propagate to message processing. A wrapped accessor is a detached view.

### Bug R8: Missing `/queue` in Broker Destinations

**Root Cause**: `SimpMessagingTemplate.convertAndSendToUser()` sends to `/user/{name}/queue/game-events`. The broker must be configured to handle `/queue` destinations.

**Symptom**: `convertAndSendToUser()` was called without error, but clients never received the message.

**Fix**:
```java
registry.enableSimpleBroker("/topic"); // WRONG — missing /queue
registry.enableSimpleBroker("/topic", "/queue"); // RIGHT
```

**Lesson**: Always include `/queue` in the broker's destination list when using private user messages.

---

## 34. Architectural Decision Records (ADRs)

An **ADR (Architectural Decision Record)** documents the context, decision, and consequences of a significant architectural choice. Here are the 10 key decisions from this project:

### ADR-001: Frontend Framework — React Native

**Context**: Building a couples game for Android (and potentially iOS). Needed to evaluate cross-platform options.

**Decision**: React Native 0.75.4 with New Architecture.

**Alternatives considered**:
- **Jetpack Compose** (Android-only, high performance, Kotlin)
- **Flutter** (cross-platform, Dart, excellent performance)
- **KMP (Kotlin Multiplatform)** (shared business logic, native UI)

**Consequences**:
- Single codebase for Android and iOS
- JavaScript/React ecosystem available
- Hermes engine reduces memory vs V8
- New Architecture enables near-native performance

### ADR-002: Authentication — Stateless JWT

**Context**: Need to authenticate API requests without server-side sessions.

**Decision**: Google Sign-In for identity, app-issued JWT for session management.

**Alternatives**:
- **Firebase Auth**: Would handle token management but adds Firebase dependency
- **Server-side sessions (Redis)**: Stateful, requires session affinity in load balancing
- **OAuth 2.0 access token**: Google's tokens expire in 1 hour, difficult to control

**Consequences**:
- Stateless — any server can handle any request
- JWT expiry is a revocation challenge (no invalidation without blocklist)

### ADR-003: Real-time Transport — WebSocket/STOMP/SockJS

**Decision**: Spring WebSocket with STOMP protocol and SockJS fallback.

**Alternatives**:
- **Server-Sent Events (SSE)**: Server-to-client only (unidirectional), simpler to implement, works over HTTP
- **Long-Polling**: Simulates push by having client hold connections open; high latency
- **Firebase Realtime Database**: Would handle sync automatically but adds Firebase dependency and cost

**Consequences**:
- Bidirectional real-time communication
- SockJS handles restrictive network environments
- In-memory broker limits to single server instance

### ADR-007: Game Synchronization — Database Count

**Decision**: Count committed database rows to determine when both players have answered/guessed.

**Alternatives**:
- **In-memory map on server**: `Map<sessionId, AtomicInteger>`. Broken with multiple server instances.
- **Redis counter**: Atomic, distributed. Adds Redis dependency.
- **Optimistic locking**: Version field on GameSession, retry on conflict.

**Consequences**:
- Works correctly at single-server scale
- Requires database query per submission (adds latency)
- Won't work at horizontal scale without external coordination

### ADR-009: Frontend State — Context API

**Decision**: React's built-in Context API (`AuthContext`, `GameContext`) over Redux.

**Alternatives**:
- **Redux Toolkit**: Excellent DevTools, predictable, but significant boilerplate
- **Zustand**: Minimal, no boilerplate, but external dependency
- **MobX**: Reactive, observable — powerful but complex mental model
- **Jotai/Recoil**: Atomic state — great for fine-grained updates

**Consequences**:
- Simple to understand and implement
- Re-renders all consumers when context changes (manageable at this scale)
- No DevTools beyond React DevTools

---

## Summary: Concepts by Sprint

| Sprint | Backend Concepts | Frontend Concepts |
|--------|-----------------|-------------------|
| **0: Setup** | Spring Boot autoconfiguration, Gradle Kotlin DSL, JPA entity mapping, Flyway migrations, SecurityConfig skeleton, HikariCP | React Native project structure, Metro bundler, Yarn 4 PnP, Stack Navigator, Context API skeleton |
| **1: Auth** | OAuth 2.0 / OIDC, `GoogleIdTokenVerifier`, JWT (HS256), `JwtService`, `JwtAuthFilter`, `OncePerRequestFilter`, `SecurityContextHolder`, stateless session | `GoogleSignin.configure()`, `AsyncStorage`, Axios singleton with interceptors, conditional navigation |
| **2: Profile** | DTO pattern, `Principal.getName()` for user resolution, `CoupleService` code generation, derived repository methods (`findByLinkCode`, `findByUser1_IdOrUser2_Id`) | `useFocusEffect`, React Native `Share` API, screen composition |
| **3: WebSocket Foundation** | STOMP protocol, `@EnableWebSocketMessageBroker`, `WebSocketMessageBrokerConfigurer`, SockJS fallback, `ChannelInterceptor` for JWT validation, `SimpMessagingTemplate`, topic vs user queue | Singleton `WebSocketService`, `@stomp/stompjs`, SockJS client, pub/sub subscriptions |
| **4: Round 1** | `@MessageMapping`, game state machine, `@Transactional` synchronization, idempotency, Mockito unit tests, `MockMvc` integration tests, `BlockingQueue` for async WebSocket tests, H2 PostgreSQL mode | `GameContext`, `useRef` for imperative cross-context communication, `BlockingQueue` async pattern in tests, `jest.fn()` mocking |
| **5: Round 2 + Scoring** | `countByGameSession_IdAndQuestion_IdAndRound2GuessIsNotNull()` for guess sync, `calculateAndCompleteGame()` scoring logic, `GuessResultDto` private feedback pattern, `GameResultsDto` broadcast, tier-based scoring | Round-aware UI (round state machine in JS), transition screen, guess result overlay, animated score display, `ResultsScreen` with spring animation |

---

*This guide was written as a living reference to the "Only Yours" project. Every concept here was used in actual production code. The goal is that after studying this guide, you can implement, debug, and explain any part of this system at the level of a senior software engineer.*

**Related documents:**
- `DEVELOPMENT_PLAN.md` — Sprint checklist and task tracking
- `PROJECT_STATUS.md` — End-to-end implementation status
- `FLYWAY_STUDY_GUIDE.md` — Deep dive into Flyway specifically
- `SPRINT_4_PRD.md` — Technical specification for gameplay Round 1
- `SPRINT_5_PLAN.md` — Technical specification for gameplay Round 2
- `SPRINT_5_IMPLEMENTATION.md` — Implementation report for Round 2
