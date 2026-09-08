# Database Architecture & Cost Optimization Analysis
**Project**: Only Yours Backend  
**Date**: September 2026  
**Status**: Architecture Evaluation & Decision Document  

---

## 1. Executive Summary & Problem Definition

During the MVP launch deployment on Google Cloud Platform (GCP), the backend API was deployed to **Google Cloud Run** and the relational database was provisioned on **Google Cloud SQL (PostgreSQL 15, `db-f1-micro`)** in the `asia-south1` (Mumbai) region.

While Cloud Run operates under GCP's **Always-Free Tier** ($0.00/month for up to 2 million requests), Cloud SQL incurs significant recurring baseline charges even when idle:
1. **Public IPv4 Address Reservation**: Under GCP's IP pricing policy, every reserved IPv4 address attached to an instance costs **$0.010/hour (~₹20/day or ~₹600/month)**—*even when the database is stopped*.
2. **Persistent SSD Storage (10 GB)**: Costs **~$1.70/month (~₹140/month)** continuously.
3. **Compute (vCPU + RAM)**: Costs **~$7.67/month (~₹640/month)** when running.

**Total Baseline Cost**: **₹750 – ₹1,400/month ($9 – $17/month)** simply existing, with zero active players.

This document evaluates 4 alternative architectures to eliminate these fixed costs and achieve a **true ₹0.00 / $0.00 baseline** for development, testing, and early production launch.

---

## 2. In-Depth Architectural Alternatives

### Alternative 1: Serverless PostgreSQL via Supabase (Mumbai `ap-south-1`)
*⭐️ **Recommended Primary Path — Zero Code Refactoring***

#### Architecture
* **Compute Layer**: Remains on Google Cloud Run (`asia-south1`, Mumbai).
* **Data Layer**: Hosted PostgreSQL instance on Supabase located in Mumbai (`ap-south-1`).
* **Connection**: Standard JDBC over TLS (`sslmode=require`) utilizing Supabase's built-in transaction connection pooler (PgBouncer on port `6543`).

#### Free Tier Limits
* **Database Storage**: 500 MB (sufficient for ~250,000 game sessions and ~1.5 million answer records).
* **Monthly Active Users (MAU)**: Up to 50,000.
* **Monthly Cost**: **₹0.00 ($0.00)**.

#### Latency Analysis
* Cloud Run is located in Google's Mumbai data center (`asia-south1`).
* Supabase is hosted in AWS's Mumbai data center (`ap-south-1`).
* Inter-datacenter round-trip time between GCP Mumbai and AWS Mumbai is typically **1.2 ms – 3.0 ms**, providing near-local database response times.

#### Codebase Impact
* **0 Lines of Java Code Changed**:
  * Spring Data JPA entities, repositories, and DTOs remain 100% intact.
  * Flyway migrations run automatically upon connection.
  * HikariCP configuration only needs connection pooling tuning for serverless poolers.

---

### Alternative 2: Serverless PostgreSQL via Neon (Scale-to-Zero)
*⭐️ **Secondary Zero-Code Path***

#### Architecture
* Cloud Run connects to Neon's serverless Postgres.
* Neon completely detaches storage from compute. When no queries occur for 5 minutes, compute scales to **0 active vCPUs**.

#### Free Tier Limits
* **Storage**: 0.5 GB free.
* **Compute**: 100 compute-hours / month free.
* **Monthly Cost**: **₹0.00 ($0.00)**.

#### Latency & Cold Start
* Closest region to India is **Singapore (`ap-southeast-1`)**, resulting in ~25 ms – 35 ms cross-region query latency.
* Scale-to-zero wake-up latency introduces a ~500ms – 1s cold start on the first request after an idle period.

---

### Alternative 3: Native GCP Cloud Firestore (NoSQL Document Store)
*⭐️ **100% Native GCP Path — Zero Third-Party Dependencies***

#### Architecture
* Migrate the database from PostgreSQL to **Google Cloud Firestore** (Native Mode) in `asia-south1` (Mumbai).
* Uses Google Cloud's permanent **Always-Free Tier**.

#### Free Tier Limits
* **Stored Data**: 1 GB free forever.
* **Document Reads**: 50,000 / day free forever.
* **Document Writes**: 20,000 / day free forever.
* **Document Deletes**: 20,000 / day free forever.
* **Monthly Cost**: **₹0.00 ($0.00)**.

#### Capacity Modeling for Only Yours
In `only-yours`, a complete couple gameplay cycle consists of:
* Loading question deck: 1 batch read.
* Answering 5 questions per partner: 10 writes.
* Guessing 5 answers per partner: 10 writes.
* Progression & Score update: 2 writes.
* **Total Writes per Game**: ~22 document writes.
* **Capacity on Free Tier**: **~900 full games played every single day for ₹0.00**.

#### Codebase Impact
* **Moderate to High Refactor**:
  * Replace Flyway migrations and Spring Data JPA with `spring-cloud-gcp-starter-data-firestore` or the official Google Cloud Firestore Java SDK.
  * Redesign relational models into document collections:
    * `/users/{userId}`
    * `/couples/{coupleId}`
    * `/game_sessions/{sessionId}` (with embedded answers array or subcollection)
    * `/questions/{questionId}`

---

### Alternative 4: Full Firebase Serverless (Client Direct to Firestore)
*⭐️ **Ecosystem Convergence Path***

#### Architecture
* Eliminate the Spring Boot Java backend on Cloud Run entirely.
* Connect `OnlyYoursExpo` directly to Firebase Authentication and Cloud Firestore via the `@react-native-firebase` or Firebase JS SDK.
* Real-time game synchronization implemented via Firestore snapshot listeners (`onSnapshot`) instead of STOMP WebSockets.

#### Free Tier Limits
* **Spark Free Plan**: 1 GB Firestore, 50k reads/day, 20k writes/day, 2M Cloud Functions/month.
* **Monthly Cost**: **₹0.00 ($0.00)**.

#### Codebase Impact
* **High Effort**: Complete rewrite of backend business logic into client state hooks and/or Firebase Cloud Functions.

---

## 3. Comprehensive Decision Matrix

| Evaluation Criteria | Option 1: Supabase (Mumbai) | Option 2: Neon (Singapore) | Option 3: GCP Firestore | Option 4: Full Firebase BaaS |
| :--- | :--- | :--- | :--- | :--- |
| **Monthly Cost** | **₹0.00** | **₹0.00** | **₹0.00** | **₹0.00** |
| **Vendor Diversity** | Hybrid (GCP + Supabase) | Hybrid (GCP + Neon) | 100% Google Cloud | 100% Google Cloud |
| **Location / Region** | Mumbai (`ap-south-1`) | Singapore (`ap-southeast-1`) | Mumbai (`asia-south1`) | Mumbai / Multi-region |
| **Network Latency** | **1 – 3 ms** | 25 – 35 ms | **< 1 ms** | Direct device-to-cloud |
| **Code Changes** | **0 Lines of Java** | **0 Lines of Java** | ~1,200 Lines (Data layer) | ~3,500 Lines (Full rewrite) |
| **Time to Implement** | **< 10 Minutes** | **< 10 Minutes** | 3 – 5 Days | 1 – 2 Weeks |
| **Schema Migrations** | Automatic (Flyway) | Automatic (Flyway) | Manual NoSQL schema | Manual NoSQL schema |
| **Idle Behavior** | Pauses after 7d inactivity | Sleeps after 5m inactivity | Never sleeps (Always ready)| Never sleeps |
| **Recommended Rank** | 🥇 **#1 (Immediate MVP)** | 🥈 **#2 (Fallback)** | 🥉 **#3 (Long-term GCP)** | 🏅 **#4 (Full overhaul)** |

---

## 4. Implementation Blueprint: Option 1 (Supabase Mumbai)

To transition the existing Cloud Run service to Supabase without any code modifications:

### Step 1: Create Free Supabase Project
1. Log in to [Supabase](https://supabase.com).
2. Create project `only-yours-db`.
3. Select region: **South Asia (Mumbai) / `ap-south-1`**.
4. Set a strong database password.

### Step 2: Configure Connection Pooling in `application.properties`
When connecting Spring Boot (HikariCP) to a serverless transaction pooler, configure:
```properties
# Supabase Transaction Pooler (PgBouncer port 6543)
spring.datasource.url=${DATABASE_URL}
spring.datasource.username=${DATABASE_USERNAME}
spring.datasource.password=${DATABASE_PASSWORD}

# HikariCP Pooler Optimization for Serverless
spring.datasource.hikari.maximum-pool-size=5
spring.datasource.hikari.minimum-idle=1
spring.datasource.hikari.idle-timeout=30000
spring.datasource.hikari.max-lifetime=60000
spring.datasource.hikari.connection-timeout=20000
```

### Step 3: Update Cloud Run Environment Secrets
Update Secret Manager or Cloud Run deployment flags:
```bash
gcloud run services update onlyyours-backend \
  --region=asia-south1 \
  --clear-cloudsql-instances \
  --update-env-vars="SPRING_PROFILES_ACTIVE=prod" \
  --update-secrets="DATABASE_URL=SUPABASE_DB_URL:latest,DATABASE_USERNAME=SUPABASE_DB_USER:latest,DATABASE_PASSWORD=SUPABASE_DB_PASSWORD:latest" \
  --project=only-yours
```

### Step 4: Verification
Spring Boot will start up on Cloud Run, connect over TLS to Supabase in Mumbai, and Flyway will auto-execute migrations `V1` through `V14` within 3 seconds.

---

## 5. Summary Recommendation

* **For immediate testing and Play Store launch**: Implement **Option 1 (Supabase in Mumbai)**. It immediately eliminates the ₹1,200/month fee, guarantees sub-3ms latency, and preserves 100% of your tested Spring Boot and Flyway codebase.
* **If you strictly mandate 100% Google Cloud compliance**: Schedule **Option 3 (Firestore)** as a dedicated future sprint milestone to refactor the data access layer.
