# Multi-stage build for Java 21 Spring Boot application
FROM eclipse-temurin:21-jdk-alpine AS builder

# Set working directory
WORKDIR /app

# Copy Maven wrapper and pom files
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
COPY exam-shared/pom.xml exam-shared/
COPY exam-domain/pom.xml exam-domain/
COPY exam-application/pom.xml exam-application/
COPY exam-infrastructure/pom.xml exam-infrastructure/
COPY exam-adapter-rest/pom.xml exam-adapter-rest/
COPY exam-adapter-scheduler/pom.xml exam-adapter-scheduler/
COPY exam-bootstrap/pom.xml exam-bootstrap/

# Download dependencies
RUN ./mvnw dependency:go-offline -B

# Copy source code
COPY exam-shared/src exam-shared/src
COPY exam-domain/src exam-domain/src
COPY exam-application/src exam-application/src
COPY exam-infrastructure/src exam-infrastructure/src
COPY exam-adapter-rest/src exam-adapter-rest/src
COPY exam-adapter-scheduler/src exam-adapter-scheduler/src
COPY exam-bootstrap/src exam-bootstrap/src

# Build application
RUN ./mvnw clean package -DskipTests -B

# Runtime stage
FROM eclipse-temurin:21-jre-alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Create non-root user
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

# Set working directory
WORKDIR /app

# Copy JAR from builder stage
COPY --from=builder /app/exam-bootstrap/target/exam-bootstrap-*.jar app.jar

# Change ownership to non-root user
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/api/actuator/health || exit 1

# JVM optimization for containers
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:+UseG1GC -XX:+UseStringDeduplication"

# Run application
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
