# # ---------- BUILD STAGE ----------
# FROM maven:3.9.6-eclipse-temurin-17 AS build

# WORKDIR /app

# # Copy pom first (cache dependencies)
# COPY backend/pom.xml .
# RUN mvn dependency:go-offline

# # Copy source
# COPY backend/src ./src

# # Build jar
# RUN mvn clean package -DskipTests


# # ---------- RUN STAGE ----------
# FROM eclipse-temurin:17-jdk

# WORKDIR /app

# # Copy jar from build stage
# COPY --from=build /app/target/broPay-api-0.0.1-SNAPSHOT.jar app.jar

# EXPOSE 8080

# # Spring Boot reads env vars automatically
# ENTRYPOINT ["java", "-jar", "app.jar"]

# ---------- BUILD STAGE ----------
FROM maven:3.9.6-eclipse-temurin-17 AS build

WORKDIR /app

# Copy pom first (cache dependencies)
COPY pom.xml .
RUN mvn dependency:go-offline

# Copy source
COPY src ./src

# Build jar
RUN mvn clean package -DskipTests


# ---------- RUN STAGE ----------
FROM eclipse-temurin:17-jdk

WORKDIR /app

# Copy jar from build stage
COPY --from=build /app/target/broPay-api-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
