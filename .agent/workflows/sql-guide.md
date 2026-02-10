---
description: Cómo ejecutar SQL en Docker
---

Tienes varias formas de interactuar con la base de datos:

### 1. Desde la Terminal (Recomendado para comandos rápidos)
Ejecuta esto en tu PowerShell para entrar a la consola de PostgreSQL:
```powershell
docker exec -it gestion_db psql -U admin -d gestion
```
*(Si te pide contraseña, usa la que definiste en `.env`, por defecto: `secretpassword`)*

### 2. Usando un programa externo (DBeaver, pgAdmin, etc.)
Es lo más cómodo para ver tablas y datos. Usa estos datos de conexión:
- **Host**: `localhost`
- **Puerto**: `5432`
- **Base de Datos**: `gestion`
- **Usuario**: `admin`
- **Contraseña**: `secretpassword` (o la de tu `.env`)

### 3. Crear usuario Administrador inicial
Si quieres crear el primer usuario para entrar a la web, una vez dentro de `psql` (método 1), pega esto:
```sql
INSERT INTO usuario (username, password, rol, activo, empleado_dni) 
VALUES ('admin', '$2a$10$8.06qKPTn5OM5bzaz1S8PuzvNV09OVD.Y7Xj6B3FzW.0S.S5m8yK.', 'ADMIN', true, NULL);
```
*(Nota: La contraseña es `admin123` encriptada)*
