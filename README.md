 **Arquitecturas y Patrones de Diseño Aplicados**

Este proyecto fue desarrollado aplicando buenas prácticas de diseño de software, utilizando los siguientes conceptos clave:

*  **MVC (Model–View–Controller)**
*  **Singleton**
*  **Inyección de Dependencias**
*  **Inversión de Control (implementada gracias a la Inyección de Dependencias)**
*  **SRP – Principio de Responsabilidad Única**
*  **Normalizacion sobre el modelado de la base de datos relacional**

---

 **Tecnologías Utilizadas**

*  **Java**
*  **Spring Framework**
*  **JPA**
*  **Hibernate**
*  **PostgreSQL**
*  **JWT**

---
##  Documentación de la API (Swagger)

La siguiente documentación muestra los principales controladores del sistema,
incluyendo autenticación JWT, gestión de usuarios, socios, empleados, pagos y productos.

### Vista general de controladores
<img width="1296" height="889" alt="controllers1" src="https://github.com/user-attachments/assets/08038d8c-d67b-47ad-8cbe-a42d25ada49e" />


### Gestión de usuarios, socios y productos
<img width="1335" height="889" alt="controllers2" src="https://github.com/user-attachments/assets/5c9bdc52-44c4-4b54-9b8f-f660c7e8bd87" />

---
##  Autenticación y Seguridad

El sistema implementa autenticación basada en JWT con Spring Security.

### Flujo de autenticación
1. Login con usuario y contraseña → devuelve JWT
2. Acceso denegado a endpoints protegidos sin token
3. Acceso autorizado enviando JWT como Bearer Token

### Prueba con Postman:
<img width="845" height="716" alt="auth" src="https://github.com/user-attachments/assets/7ccfd014-1acb-4ea6-8fc5-652c181ec981" />
<img width="796" height="627" alt="authNo" src="https://github.com/user-attachments/assets/1f1fad29-532b-4574-9b22-ded88f70957f" />
<img width="859" height="786" alt="authSi" src="https://github.com/user-attachments/assets/3615d53c-36a8-4af3-a4df-4507dfcde00d" />





