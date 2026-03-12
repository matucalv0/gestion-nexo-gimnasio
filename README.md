# Nexo - Aplicación web para gestion de un gimnasio local

![Java](https://img.shields.io/badge/Java-17-orange?logo=openjdk)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.5-brightgreen?logo=springboot)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue?logo=postgresql)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker)

> **API REST desarrollada para un cliente real** que necesitaba migrar su operación diaria desde planillas Excel a un sistema centralizado, auditable y escalable.

---

##  Tabla de Contenidos

- [Contexto del Proyecto](#-contexto-del-proyecto)
- [Características Principales](#-características-principales)
- [Arquitectura y Decisiones Técnicas](#-arquitectura-y-decisiones-técnicas)
- [Stack Tecnológico](#-stack-tecnológico)
- [Instalación y Ejecución](#-instalación-y-ejecución)
- [Endpoints de la API](#-endpoints-de-la-api)
- [Tests](#-tests)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Capturas del Sistema](#-capturas-del-sistema)

---

## Contexto del Proyecto

**Cliente:** Nexo (gimnasio local)  
**Estado:** En desarrollo avanzado – Próximo a implementación productiva

### Problema

El gimnasio gestionaba su operación diaria con **planillas Excel**, lo que generaba:
- Errores e inconsistencias en registros de pagos y asistencias
- Imposibilidad de obtener métricas financieras en tiempo real
- Falta de control centralizado sobre socios, membresías y empleados
- Riesgo de pérdida de datos y duplicación de información

### Solución

Sistema web con **API REST** que centraliza toda la operación:
- Gestión completa de socios y membresías
- Control de asistencias con validación de membresía activa
- Registro de ingresos y egresos con categorización
- Dashboard de métricas financieras (diarias, semanales, mensuales)
- Sistema de roles y permisos (ADMIN, EMPLEADO, SOCIO)

---

##  Características Principales

### Seguridad
- ✅ Autenticación stateless con **JWT** (tokens en cookies HttpOnly)
- ✅ Autorización basada en roles con **Spring Security** y `@PreAuthorize`
- ✅ **Rate limiting** en endpoint de login (5 intentos / 5 minutos por IP)
- ✅ Contraseñas hasheadas con **BCrypt**

### Validaciones de Negocio
- ✅ Gestion de asistencias pendientes si el socio quiere ingresar sin membresía activa
- ✅ Control de asistencias disponibles según tipo de membresía
- ✅ Un socio no puede tener más de una membresía activa simultáneamente
- ✅ Validación de datos con **Hibernate Validator** (Bean Validation)

---

## Arquitectura y Decisiones Técnicas

### Arquitectura en Capas

```
┌─────────────────────────────────────────────────────────┐
│                    Controllers                          │
│         (REST endpoints + validación de entrada)        │
├─────────────────────────────────────────────────────────┤
│                     Services                            │
│           (Lógica de negocio + transacciones)           │
├─────────────────────────────────────────────────────────┤
│                   Repositories                          │
│              (Acceso a datos con JPA)                   │
├─────────────────────────────────────────────────────────┤
│                    PostgreSQL                           │
│         (Persistencia + integridad referencial)         │
└─────────────────────────────────────────────────────────┘
```

### Patrones y Buenas Prácticas

| Aspecto | Implementación |
|---------|----------------|
| **Manejo de errores** | `GlobalExceptionHandler` con `@RestControllerAdvice` – respuestas consistentes con códigos HTTP semánticos |
| **DTOs** | Separación completa entre entidades JPA y objetos de transferencia (57 DTOs para diferentes casos de uso) |
| **Excepciones de dominio** | Excepciones personalizadas (`MembresiaVencidaException`, `SocioInactivoException`, etc.) |
| **Seguridad** | Filtros encadenados: `RateLimitFilter` → `JwtAuthFilter` → Spring Security |
| **Migraciones** | Versionado incremental con Flyway (`V1__schema_inicial.sql`, `V2__indices_rendimiento.sql`) |

---

##  Stack Tecnológico

| Tecnología | Versión | Uso |
|------------|---------|-----|
| **Java** | 17 | Lenguaje principal (LTS) |
| **Spring Boot** | 3.3.5 | Framework base |
| **Spring Security** | 6.x | Autenticación y autorización |
| **Spring Data JPA** | - | Persistencia y repositorios |
| **Hibernate Validator** | - | Validaciones de entrada |
| **PostgreSQL** | 15 | Base de datos relacional |
| **Flyway** | - | Migraciones de base de datos |
| **jjwt** | 0.11.5 | Generación y validación de JWT |
| **SpringDoc OpenAPI** | 2.2.0 | Documentación Swagger |
| **Docker** | - | Containerización |


---

## Instalación y Ejecución

### Requisitos Previos

- Java 17+
- Docker y Docker Compose (recomendado)
- O PostgreSQL 15+ instalado localmente

### Opción 1: Con Docker (Recomendado)

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/gestion-nexo.git
cd gestion-nexo

# 2. Crear archivo .env con las variables necesarias
cat > .env << EOF
DB_NAME=<nombre_de_tu_base_de_datos>
DB_USER=<tu_usuario>
DB_PASSWORD=<tu_password>
JWT_SECRET=<tu_clave_secreta>
COOKIE_SECURE=false
EOF

# 3. Levantar los servicios
docker-compose up -d

# 4. La aplicación estará disponible en http://localhost:8080
```

### Opción 2: Ejecución Local

```bash
# 1. Configurar variables de entorno
export DB_URL=jdbc:postgresql://localhost:5432/gestion_nexo
export DB_USER=tu_usuario
export DB_PASS=tu_password
export JWT_SECRET=tu_clave_secreta

# 2. Compilar y ejecutar
./mvnw spring-boot:run
```

### Variables de Entorno

| Variable | Descripción | Ejemplo                                                |
|----------|-------------|--------------------------------------------------------|
| `DB_URL` | URL de conexión JDBC | `jdbc:postgresql://localhost:5432/<nombre_de_tu_base>` |
| `DB_USER` | Usuario de PostgreSQL | `<tu_usuario>`                                         |
| `DB_PASS` | Contraseña de PostgreSQL | `<tu_password>`                                        |
| `JWT_SECRET` | Clave para firmar tokens JWT (min 256 bits) | `<tu_clave_secreta>`                                   |
| `COOKIE_SECURE` | `true` en producción (HTTPS) | `false`                                                |

---

## Endpoints de la API

La documentación completa está disponible en `/swagger-ui.html` al ejecutar la aplicación.

### Autenticación

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/auth/login` | Iniciar sesión (devuelve cookie con JWT) |
| `POST` | `/auth/logout` | Cerrar sesión (invalida token) |

### Socios

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/socios` | Listar socios (paginado, filtros) |
| `GET` | `/socios/{dni}` | Obtener socio por DNI |
| `POST` | `/socios` | Registrar nuevo socio |
| `PATCH` | `/socios/{dni}` | Actualizar datos de socio |
| `POST` | `/socios/{dni}/asistencias` | Registrar asistencia |
| `GET` | `/socios/{dni}/membresia-vigente` | Consultar membresía activa |
| `GET` | `/socios/inactivos` | Socios sin actividad reciente |

### Finanzas

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/finanzas` | Movimientos financieros (paginado) |
| `GET` | `/finanzas/ganancias-hoy` | Balance del día |
| `GET` | `/finanzas/ganancias-semana` | Balance semanal |
| `GET` | `/finanzas/ganancias-mes` | Balance mensual |
| `GET` | `/finanzas/balance-semanal` | Ingresos/egresos por día |
| `GET` | `/finanzas/estadisticas/mes-completo` | KPIs del mes |

### Ejemplo de Request/Response

```bash
# Registrar asistencia de un socio
curl -X POST http://localhost:8080/socios/12345678/asistencias \
  -H "Cookie: jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

```json
// Response 200 OK
{
  "dni": "12345678",
  "fechaHora": "2025-02-13T10:30:00"
}

// Response 409 Conflict (membresía vencida)
{
  "error": "El socio tiene la membresía vencida"
}
```

---

##  Tests

El proyecto incluye tests de integración que validan los flujos principales:

```bash
# Ejecutar todos los tests
./mvnw test

# Ejecutar tests con reporte detallado
./mvnw test -Dtest=SocioTest,PagoTest,AsistenciaTest
```

### Tests Incluidos

| Archivo | Cobertura |
|---------|-----------|
| `SocioTest.java` | Alta de socios, asignación de membresías, registro de asistencias |
| `PagoTest.java` | Registro de pagos, cálculo de montos |
| `AsistenciaTest.java` | Validaciones de membresía vigente |
| `FinanzaTest.java` | Cálculo de balances y métricas |
| `ProductoTest.java` | Gestión de inventario |
| `RutinaTest.java` | Asignación de rutinas a socios |

---

##  Estructura del Proyecto

```
src/main/java/com/nexo/gestion/
├── config/                    # Configuración (Security, Beans)
│   ├── SecurityConfig.java
│   └── DataInitializer.java
├── controller/                # REST Controllers (17 controllers)
│   ├── SocioController.java
│   ├── PagoController.java
│   ├── FinanzaController.java
│   └── ...
├── dto/                       # Data Transfer Objects (57 DTOs)
│   ├── SocioDTO.java
│   ├── PagoCreateDTO.java
│   └── ...
├── entity/                    # Entidades JPA (23 entidades)
│   ├── Socio.java
│   ├── Membresia.java
│   └── ...
├── exceptions/                # Excepciones de dominio
│   ├── GlobalExceptionHandler.java
│   ├── MembresiaVencidaException.java
│   └── ...
├── repository/                # Repositorios Spring Data
├── security/                  # JWT, Filtros, Rate Limiting
│   ├── JwtAuthFilter.java
│   ├── JwtService.java
│   └── RateLimitFilter.java
└── services/                  # Lógica de negocio (17 servicios)

src/main/resources/
├── db/migration/              # Migraciones Flyway
│   ├── V1__schema_inicial.sql
│   └── V2__indices_rendimiento.sql
├── application.properties
└── application-prod.properties
```

---

## Capturas del Sistema

### Documentación Swagger
<img width="1392" alt="endpoints-socios" src="https://github.com/user-attachments/assets/ec66724f-fb82-458b-9226-37203feb6ba9" />
<img width="1403" alt="endpoints-pagos" src="https://github.com/user-attachments/assets/005429a4-bc47-4411-881d-8e25903bfef1" />

### Modelo de Datos (DER)
<img width="2367" alt="derGym" src="https://github.com/user-attachments/assets/1ee53a5a-7c6f-4975-a67f-cf5c03871caf" />

### Interfaz del Sistema
<img width="1440" height="900" alt="localhost_8080_home html Desktop HD (2026-02-14 00 46 46)" src="https://github.com/user-attachments/assets/785a996f-0a01-4e92-85d8-daa10cd5bcca" />

### Dashboard de Métricas
<img width="1440" height="900" alt="localhost_8080_finanzas html Desktop HD (2026-02-14 01 04 22)" src="https://github.com/user-attachments/assets/748511fb-6082-452a-8034-27b336d55b31" />
<img width="1440" height="900" alt="localhost_8080_asistencias html Desktop HD (2026-02-14 01 04 55)" src="https://github.com/user-attachments/assets/5b3c2cdd-080c-4bb8-a8da-059934354476" />
<img width="1440" height="900" alt="localhost_8080_pagos html Desktop HD (2026-02-14 01 03 24)" src="https://github.com/user-attachments/assets/9235736c-4e43-4919-a052-709676ee7fb5" />




---

---

##  Autor

**Mateo Calvo**

- LinkedIn: [matucalvo](https://www.linkedin.com/in/matucalvo/)
- GitHub: [matucalv0](https://github.com/matucalv0)

---

> *Este proyecto fue desarrollado para resolver un problema real de negocio. El código refleja decisiones pragmáticas orientadas a mantenibilidad, seguridad y escalabilidad.*
