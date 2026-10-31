# ==============================================================================
# Multi-Stage Production Dockerfile for Spring Boot Microservice
# Stage 1: Build Application Artifact with Maven
# Stage 2: Minimal, Secure JRE Runtime with Non-Root User
# ==============================================================================

# --- Stage 1: Build stage ---
FROM maven:3.9.6-eclipse-temurin-17-alpine AS builder

WORKDIR /build

# Copy Maven descriptor first to leverage Docker layer caching for dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and package application (tests executed in CI pipeline)
COPY src ./src
RUN mvn clean package -DskipTests -B

# --- Stage 2: Production Runtime stage ---
FROM eclipse-temurin:17-jre-alpine AS runner

# Metadata
LABEL maintainer="DevOps Team <devops@example.com>"
LABEL project="End-to-End DevOps Pipeline"
LABEL version="1.0.0"

# Set working directory
WORKDIR /app

# Create a non-root group and user for security compliance (Least Privilege Principle)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy compiled JAR artifact from builder stage
COPY --from=builder /build/target/devops-java-app-1.0.0.jar app.jar

# Set file ownership to non-root user
RUN chown -R appuser:appgroup /app

# Switch from root to non-root user
USER appuser

# Expose internal container port
EXPOSE 8080

# Configure JVM flags optimized for container environments (CGroup memory limits)
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom"

# Healthcheck definition for container monitoring
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/v1/health || exit 1

# Execute Spring Boot Application
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
