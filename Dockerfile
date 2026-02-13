# ===== Stage 1: build =====
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app

# Copiamos todo el proyecto
COPY . .

# Compilamos el jar
RUN ./mvnw clean package -DskipTests

# ===== Stage 2: runtime =====
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copiamos solo el jar final
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
