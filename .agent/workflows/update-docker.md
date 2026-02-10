---
description: Cómo actualizar la aplicación en Docker
---

Para actualizar la aplicación después de hacer cambios en el código (Java, HTML, CSS, JS):

1. **Compilar el proyecto**: Genera el nuevo archivo `.jar`.
   ```powershell
   ./mvnw clean package -DskipTests
   ```

// turbo
2. **Reconstruir el contenedor**: Docker detectará el nuevo `.jar` y reconstruirá la imagen de la aplicación.
   ```powershell
   docker-compose up -d --build
   ```

> [!IMPORTANT]
> **NO** uses `docker-compose down -v` para actualizar, ya que eso borraría todos los datos de tu base de datos (socios, pagos, etc.). El comando `up -d --build` es seguro y mantiene tus datos.
