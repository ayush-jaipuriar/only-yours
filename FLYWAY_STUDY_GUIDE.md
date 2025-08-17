# Flyway Study Guide: Database Migrations in the "Only Yours" Project

This document provides a comprehensive overview of how we use Flyway for managing our application's database schema. It explains the core concepts, our specific implementation, and the best practices we follow.

---

## 1. What is Flyway and Why Do We Use It?

**What is Flyway?**
Flyway is an open-source database migration tool. It helps you manage and version-control your database schema with the same discipline you use for your source code. Instead of manually applying SQL scripts to a database and trying to track who ran what and when, Flyway automates the process.

**Why do we use it in "Only Yours"?**
1.  **Version Control for the Database:** Our database schema is a critical part of the application. Flyway allows us to treat schema changes as "migrations," which are versioned and tracked in Git alongside our Java and JavaScript code. This creates a single source of truth.
2.  **Automation & Consistency:** Flyway automatically checks which migrations have been applied to a database and applies only the new ones. This ensures that every developer's local database and the production database have the exact same schema, eliminating "it works on my machine" problems.
3.  **Simplified Setup:** When a new developer joins the project, they don't need manual instructions to set up their database. They just run the application, and Flyway automatically migrates their fresh database to the latest version.
4.  **Clear History:** It provides a clear, linear history of every change ever made to the database schema, which is invaluable for debugging and understanding the application's evolution.

---

## 2. Core Concepts

### a. Migrations
A migration is a script (usually SQL) that represents a single change to the database schema. In our project, these are the `.sql` files found in `backend/src/main/resources/db/migration`.

### b. Migration Naming Convention
Flyway discovers migrations by scanning the classpath. It requires a strict naming convention to determine the version and order of execution:
`V<VERSION>__<DESCRIPTION>.sql`

-   **`V`**: Stands for "Versioned" migration.
-   **`<VERSION>`**: The version number (e.g., `1`, `2`, `1.1`). Migrations are applied in order based on this number.
-   **`__`**: Two underscores separate the version from the description.
-   **`<DESCRIPTION>`**: Text that describes what the migration does (e.g., `Initial_Schema`).
-   **`.sql`**: The file extension.

**Example from our project:** `V1__Initial_Schema.sql`
-   **Version**: 1
-   **Description**: Initial Schema

### c. The Schema History Table (`flyway_schema_history`)
This is a special table that Flyway creates in your database automatically. It's the brain of Flyway. For every migration it applies, Flyway adds a row to this table containing the version, description, timestamp, and a success flag. Before running, Flyway checks this table to know the database's current state and which new migrations to apply.

---

## 3. How We've Implemented Flyway

### a. Dependencies
We include the necessary Flyway dependencies in our `backend/build.gradle` file. Spring Boot's dependency management handles the versions for us.

```groovy
// in backend/build.gradle
dependencies {
    // ...
    implementation 'org.flywaydb:flyway-core'
    implementation 'org.flywaydb:flyway-database-postgresql'
    // ...
}
```

### b. Spring Boot Auto-Configuration
We don't need much manual configuration because Spring Boot has excellent Flyway integration. By default:
-   It detects Flyway on the classpath and enables it.
-   It configures Flyway to use the same `DataSource` as the main application.
-   It automatically triggers Flyway to run its migrations **before** the main application (and JPA/Hibernate) fully starts up. This is critical because it ensures the database schema is ready before our code tries to use it.
-   It looks for migrations in the default location: `src/main/resources/db/migration`.

### c. Our Migration Files

#### `V1__Initial_Schema.sql`
This is our foundational migration. Its purpose is to define the entire database structure from scratch. It contains all the `CREATE TABLE` statements for `users`, `couples`, `questions`, etc. This ensures that a new, empty database can be brought to a known, usable state instantly.

#### `V2__Seed_Initial_Data.sql`
Once the tables exist, we need some initial data to make the application functional. This migration's purpose is to **seed** the database. It uses `INSERT` statements to populate the `question_categories` table and add some sample questions. This is considered a schema change because the initial data is part of the application's required starting state.

---

## 4. The Critical Interaction: Flyway vs. Hibernate

One of the most important concepts in our setup is how Flyway interacts with Spring Data JPA (and its provider, Hibernate). Both tools can manage database schemas, and if configured incorrectly, they will conflict.

### The Problem: `spring.jpa.hibernate.ddl-auto`
Hibernate has a property, `spring.jpa.hibernate.ddl-auto`, which can automatically generate schema from your `@Entity` classes. Common values are:
-   `create`: Drops and recreates the schema on startup.
-   `create-drop`: Drops and recreates on startup, then drops again on shutdown.
-   `update`: Attempts to "diff" the entities and the schema and add missing things.
-   `validate`: Checks if the schema matches the entities and throws an error if they don't match.
-   `none`: Does nothing.

Using `create`, `create-drop`, or `update` with Flyway is a **major problem**. It creates a race condition where two different tools are trying to control the database schema, leading to unpredictable results.

### Our Solution: Flyway is the Source of Truth
In our project, we have established a clear rule:
**Flyway, and only Flyway, is responsible for managing the database schema.**

To enforce this, we have set the following in `backend/src/main/resources/application.properties`:

`spring.jpa.hibernate.ddl-auto=validate`

This configuration creates the perfect workflow:
1.  **App Starts:** The application begins to boot.
2.  **Flyway Runs:** Spring Boot runs Flyway first. Flyway connects to the database, checks its `flyway_schema_history` table, and applies any pending migrations (`V1`, `V2`, etc.). The schema is now guaranteed to be correct and up-to-date.
3.  **Hibernate Runs:** After Flyway succeeds, Hibernate initializes. With `ddl-auto=validate`, it does **not** try to change the schema. It simply checks that our `@Entity` classes (like `User.java`, `Question.java`) correctly map to the tables and columns that Flyway created. If there's a mismatch (e.g., you add a new field to an entity but forget to add a migration for the new column), the application will fail to start with a clear error, which is exactly what we want.

This approach gives us safe, predictable, and version-controlled schema management.

---

## 5. Project-Level Deep Dive: File by File

Let's trace the exact implementation of Flyway across the "Only Yours" backend codebase.

### a. The Dependencies (`backend/build.gradle`)

This is the entry point. For Flyway to be part of our project, we must declare it as a dependency.

**The Change:** We added two specific lines to the `dependencies` block.

```groovy
dependencies {
	// ... other dependencies
	implementation 'org.flywaydb:flyway-core'
	implementation 'org.flywaydb:flyway-database-postgresql'
	// ... other dependencies
}
```

-   `flyway-core`: This is the main Flyway library. It contains the core engine for checking the schema history, parsing migrations, and applying them.
-   `flyway-database-postgresql`: This library contains PostgreSQL-specific code that allows Flyway's core engine to understand and interact with our database dialect (e.g., how to create and manage the schema history table, what types of locks to use, etc.).

### b. The Trigger (`backend/src/main/java/com/onlyyours/OnlyYoursBackendApplication.java`)

You might expect to see code that explicitly calls Flyway, but we don't need any. The magic happens via Spring Boot's auto-configuration.

**The "Change":** No change was needed, which is the key point. The `main` method here is the trigger.

```java
@SpringBootApplication
public class OnlyYoursBackendApplication {
    public static void main(String[] args) {
        SpringApplication.run(OnlyYoursBackendApplication.class, args);
    }
}
```

When `SpringApplication.run()` is executed:
1.  Spring Boot scans the project's classpath.
2.  It finds the `flyway-core` dependency we added in `build.gradle`.
3.  This discovery triggers `FlywayAutoConfiguration`, an internal Spring Boot class.
4.  This auto-configuration automatically sets up a `Flyway` bean for us and, more importantly, a `FlywayMigrationInitializer` bean. This initializer is responsible for calling `flyway.migrate()` upon startup. It's specifically ordered to run **before** the JPA entity manager factories are initialized, which is what enforces our desired "migrate then validate" sequence.

### c. The Configuration (`backend/src/main/resources/application.properties`)

This is where we fine-tune the interaction between Flyway and Hibernate.

**The Change:** We explicitly set the `ddl-auto` property to `validate`.

```properties
spring.jpa.hibernate.ddl-auto=validate
```

As detailed in the previous section, this line is the lynchpin of our strategy. It effectively tells Hibernate, "Your job is not to build the house, just to inspect it." Flyway builds the schema, and Hibernate validates that our `@Entity` classes are a correct blueprint for that schema.

### d. The Migrations (`backend/src/main/resources/db/migration/`)

This directory is the heart of our Flyway implementation. It's the default location where the auto-configured `Flyway` bean looks for scripts.

#### File: `V1__Initial_Schema.sql`

This file laid the entire foundation. It contains the Data Definition Language (DDL) for every table.

**Example Snippet:**
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    google_user_id VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES question_categories(id),
    text TEXT NOT NULL,
    option_a VARCHAR(255) NOT NULL,
    option_b VARCHAR(255) NOT NULL,
    option_c VARCHAR(255) NOT NULL,
    option_d VARCHAR(255) NOT NULL
);
```

#### File: `V2__Seed_Initial_Data.sql`

This file demonstrates how we evolve the database by adding essential data. It also contains a real-world example of a defensive migration we added to fix a startup error.

**Example Snippet (Seeding):**
```sql
-- Seed initial categories
INSERT INTO question_categories (name, description, is_sensitive) VALUES
('Getting to Know You', 'Light prompts to learn more about each other', FALSE),
('Daily Habits', 'Routines, preferences, and quirks', FALSE);
```

**Example Snippet (Defensive Fix):**
This block was added after we discovered that on some developer machines, Hibernate had previously created columns with names like `optiona` instead of `option_a`. The `V2` migration would fail because the `INSERT` statement used the correct `option_a` name, and the database would complain that the `optiona` column (which had a `NOT NULL` constraint) was not being given a value.

```sql
-- Tolerate older schemas where Hibernate may have created camelCase columns
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'questions' AND column_name = 'optiona'
    ) THEN
        -- If the old, incorrect column exists, temporarily relax its constraint
        -- so the main INSERT statement (which uses the correct column names) can proceed.
        ALTER TABLE questions ALTER COLUMN optiona DROP NOT NULL;
    END IF;
    -- ... (repeated for optionb, optionc, optiond)
END
$$ LANGUAGE plpgsql;
```
This demonstrates an advanced but practical use of Flyway: writing migrations that are robust enough to run on schemas with slight historical differences, ensuring a smooth migration path for all team members.
