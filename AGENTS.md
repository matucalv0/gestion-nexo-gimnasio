# AGENTS.md – Nexo Gym Management API

## Project Overview

**Nexo** is a production-grade Spring Boot 3.3.5 REST API for gym management, replacing Excel-based operations. Migrates real client data (members, memberships, attendance, payments, finances).

- **Stack**: Java 17, Spring Boot 3.3.5, PostgreSQL 15, Flyway, JWT, Docker
- **Architecture**: Layered (Controller → Service → Repository)
- **Scale**: 17 controllers, 23 JPA entities, 57 DTOs, 17 services, 14 integration test classes
- **Status**: Advanced development, ready for production deployment

---

## Critical Setup & Environment

### Database & Environment Variables

Tests and dev runtime **require** these variables in `.env` or shell:

```
DB_URL=jdbc:postgresql://localhost:5432/gimnasiov2
DB_USER=postgres
DB_PASS=admin
JWT_SECRET=<base64-encoded-256-bit-key>
COOKIE_SECURE=false  # true in prod (HTTPS only)
```

**Do not commit `.env`** – it's in `.gitignore` and contains secrets.

### Flyway Migrations

Flyway is **mandatory**:
- Located: `src/main/resources/db/migration/`
- Currently at V7 (7 migration files)
- `spring.flyway.baseline-on-migrate=true` allows clean-slate starts
- Tests run Flyway to ensure schema exists
- **If adding a column/table**: create new `V{N}__description.sql` file (N = next version)

---

## Build & Run Commands

### Local Development

```bash
# Uses ./mvnw (Maven wrapper – preferred over system maven)
./mvnw spring-boot:run
# App runs on http://localhost:8080
# Press Ctrl+C to stop (Spring DevTools enabled for auto-reload)
```

### Production Build (Docker)

```bash
# Build multi-stage image (build stage with JDK, runtime with JRE)
docker-compose build

# Start with PostgreSQL + app
docker-compose up -d

# View logs
docker-compose logs -f app
```

### Compilation Only

```bash
./mvnw clean compile
```

---

## Testing

### Run All Tests

```bash
./mvnw test
```

Tests use **real PostgreSQL** (not H2), so `DB_*` variables must be set. Test database is separate from dev.

### Test Structure & Conventions

- **Location**: `src/test/java/com/nexo/gestion/`
- **14 test classes**:
  - `SocioControllerTest`, `PagoControllerTest`, `AsistenciaControllerTest`, `AuthControllerTest` – controller layer (MockMvc)
  - `SocioTest`, `PagoTest`, `AsistenciaTest`, `FinanzaTest`, etc. – service/integration tests
- **Framework**: JUnit 5 (Jupiter), Mockito, Spring Test MockMvc, `@SpringBootTest`, `@AutoConfigureMockMvc`
- **Auth mocking**: Use `@WithMockUser(roles = "ADMIN")` for role-based tests
- **CSRF**: Add `.with(csrf())` to POST/PATCH requests in MockMvc tests

### Test Configuration

Test-specific settings in `src/test/resources/application.properties`:
- Uses same PostgreSQL as dev (configured via `DB_*` env vars)
- Flyway enabled to auto-create schema
- JWT secret hardcoded (different from prod)
- Reduced logging (Hibernate at WARN level)

### Important Testing Quirks

- **No H2 fallback**: Tests require live PostgreSQL; they will fail if DB is unreachable
- **Flyway baseline**: Tests clean/rebuild schema on first run; subsequent runs reuse it
- **JWT expiration in tests**: 1 hour (vs. 4 hours in dev)

---

## Architecture & Package Structure

```
src/main/java/com/nexo/gestion/
├── config/              Security, Beans, DataInitializer
├── controller/          17 REST controllers (endpoints)
├── service/             17 service classes (business logic, transactions)
├── repository/          Spring Data JPA repositories (data access)
├── entity/              23 JPA @Entity classes (ORM)
├── dto/                 57 DTOs (request/response objects)
├── security/            JWT (JwtService, JwtAuthFilter), RateLimitFilter
├── exceptions/          Custom domain exceptions + GlobalExceptionHandler
```

### Design Patterns

- **DTOs**: Strict separation from entities; one DTO per use case (e.g., `SocioCreateDTO`, `SocioUpdateDTO`)
- **Exception handling**: `@RestControllerAdvice` + custom exceptions (`MembresiaVencidaException`, `SocioInactivoException`, etc.)
- **Filter chain**: `RateLimitFilter` → `JwtAuthFilter` → Spring Security filters
- **Validation**: Hibernate Validator annotations on DTOs + business rules in services
- **Transactional**: `@Transactional` on service methods; JPA cascades configured

---

## Security & Authentication

### JWT Flow

1. `POST /auth/login` → returns JWT in HttpOnly cookie
2. Subsequent requests: JWT read from cookie, validated by `JwtAuthFilter`
3. `POST /auth/logout` → invalidates token

### JWT Secret Requirements

- **Minimum 256 bits** (base64-encoded ≈ 43 chars)
- Example in `.env`: `Wh0RopwA/QK01x4gEiH5g+HfzfQm0UC5z0RI327cCLk=`
- **Must match across dev, test, prod** or tokens become invalid

### Rate Limiting

- 5 login attempts per IP per 5 minutes
- Enforced by `RateLimitFilter` before auth

### Authorization

- **ADMIN**: Full access (create socios, record payments, view reports)
- **EMPLEADO**: Limited (record attendance/payments, view own data)
- **SOCIO**: Read-only (view own profile, memberships)
- Enforced via `@PreAuthorize` on controllers

---

## Key Business Rules (Domains)

Agents should be aware:

- **Socios**: Unique by DNI; can have only one active membership at a time
- **Memberships**: Validated at attendance; expired memberships block check-ins (unless pending attendance recorded)
- **Payments**: Amount validated; payment method must exist; category constraints
- **Attendance**: Requires active membership or pending attendance status
- **Discounts**: Applied at payment time; separate entity since V3 migration
- **Finances**: Daily/weekly/monthly aggregations (caching likely needed for production)

---

## Logging & Debugging

### Log Levels

Development (default profile):
```
Hibernate SQL:        DEBUG
Spring Security:      DEBUG
com.nexo.gestion:     DEBUG
Flyway:               INFO
```

Tests:
```
Hibernate SQL:        WARN (reduced noise)
```

Production (prod profile):
```
Reduced; see application-prod.properties
```

### View Live Logs (Docker)

```bash
docker-compose logs -f app
docker-compose logs -f db
```

---

## Common Gotchas

1. **Missing `DB_*` variables**: Tests and app will fail immediately
2. **JWT secret < 256 bits**: Tokens cannot be signed; app will not start
3. **Flyway schema drift**: If you manually edit DB and don't create a V migration, Flyway will fail on next startup
4. **H2 assumption in tests**: Do not add H2 or switch to H2 for tests; tests require PostgreSQL
5. **DTO vs Entity confusion**: Never return entities in REST responses; always use DTOs
6. **Missing CSRF tokens in POST tests**: MockMvc tests will fail with 403 unless `.with(csrf())` is added
7. **Spring DevTools slow reload**: If seeing stale code, stop and restart `./mvnw spring-boot:run`
8. **Docker port conflicts**: If `:8080` or `:5432` already in use, modify docker-compose.yml
9. **Cascading deletes**: Some Flyway migrations (V6) adjust foreign key constraints; do not manually drop tables

---

## Quick Verification

Before committing, run:

```bash
./mvnw clean compile           # Ensure no syntax errors
./mvnw test                    # Run integration tests (requires PostgreSQL)
docker build -t nexo .         # Build image (should succeed)
```

If all pass, you're good.

---

## References

- **README.md**: Full API endpoint documentation, architecture diagrams
- **docker-compose.yml**: Service configuration (PostgreSQL, app memory limits)
- **pom.xml**: Dependency versions, Maven config
- **Swagger UI**: http://localhost:8080/swagger-ui.html (when running)
