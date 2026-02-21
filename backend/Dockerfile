# ─────────────────────────────────────────────────────────────────────────────
# Multi-Stage Docker Build for Only Yours Backend
#
# Why multi-stage?
# Stage 1 (builder): Uses a full JDK image (~600MB) to compile the application.
# Stage 2 (runtime): Uses a minimal JRE-only Alpine image (~150MB) to run it.
# The compiled JAR from Stage 1 is copied into Stage 2.
# Result: The final image is ~150MB instead of ~600MB — smaller attack surface
# and faster container startup.
#
# Why Alpine?
# Alpine Linux is a security-oriented, lightweight distro (~5MB base).
# Eclipse Temurin is the OpenJDK distribution from the Adoptium project —
# it's the recommended open-source JDK for production Docker use.
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM eclipse-temurin:17-jdk-alpine AS builder

WORKDIR /app

# Copy Gradle wrapper and dependency files first.
# Docker layer caching: these files change infrequently, so Docker caches this
# layer. The full source copy (below) busts the cache only when source changes.
COPY gradlew .
COPY gradle gradle
COPY build.gradle .
COPY settings.gradle .

# Grant execute permission to the Gradle wrapper script
RUN chmod +x gradlew

# Download dependencies (separate layer for cache efficiency)
RUN ./gradlew dependencies --no-daemon 2>/dev/null || true

# Copy source code (this layer changes most often)
COPY src src

# Build the fat JAR (includes all dependencies)
# --no-daemon: Prevent Gradle daemon from running (saves memory in containers)
# -x test: Skip tests — tests are run in CI, not during Docker build
RUN ./gradlew bootJar --no-daemon -x test

# ── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM eclipse-temurin:17-jre-alpine AS runtime

WORKDIR /app

# Create a non-root user for security hardening.
# Running as root inside a container is a security risk:
# if the app is compromised, an attacker would have root access to the container.
RUN addgroup -S spring && adduser -S spring -G spring

# Copy the compiled JAR from the builder stage
COPY --from=builder /app/build/libs/*.jar app.jar

# Switch to the non-root user
USER spring:spring

# Expose the default Spring Boot port
EXPOSE 8080

# JVM tuning flags for containerized environments:
# -XX:+UseContainerSupport: Makes JVM respect container memory limits (not host RAM)
# -XX:MaxRAMPercentage=75.0: Use up to 75% of container memory for JVM heap
# -Djava.security.egd: Faster startup by using /dev/urandom for entropy
ENTRYPOINT ["java", \
    "-XX:+UseContainerSupport", \
    "-XX:MaxRAMPercentage=75.0", \
    "-Djava.security.egd=file:/dev/./urandom", \
    "-jar", "app.jar"]
