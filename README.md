# Gestión Nexo – Sistema de gestión para gimnasio

**Proyecto real desarrollado para un gimnasio local.**  
Sistema web diseñado para reemplazar el uso de planillas Excel y centralizar la gestión diaria del negocio.

El foco principal del proyecto está en la **consistencia de los datos**, la **obtención de métricas financieras** y la **automatización de procesos administrativos**.

---

## Sobre el proyecto

**Cliente:** Nexo (gimnasio local)  
**Estado:** 🚧 En desarrollo avanzado – Próximo a implementación productiva

### ¿Qué problemas soluciona?

- Gestión manual mediante planillas Excel  
- Errores e inconsistencias en pagos y asistencias  
- Dificultad para obtener métricas diarias, semanales y mensuales  
- Falta de control centralizado sobre socios y empleados  

### Solución

Sistema web con backend en **Spring Boot** que centraliza:

- Gestión de socios  
- Registro de pagos e ingresos  
- Control de asistencias  
- Métricas financieras y operativas  

---

## Funcionalidades principales

- Autenticación y autorización con JWT  
- Gestión de socios y empleados  
- Registro y consulta de pagos  
- Control de asistencias diarias  
- Cálculo de ingresos diarios, semanales y mensuales  
- Documentación automática de la API con Swagger  

---

## Arquitectura y decisiones de diseño

- **Spring Boot** para desacoplar la lógica de negocio y facilitar el mantenimiento y la escalabilidad  
- **Arquitectura MVC** para una correcta separación de responsabilidades  
- **PostgreSQL** como base de datos principal, priorizando integridad, modelado relacional y capacidad de análisis  
- **JPA + Hibernate** para el manejo de la persistencia  
- **JWT** para autenticación stateless y seguridad en entornos productivos  
- **Swagger** para facilitar el consumo, prueba y documentación de la API  

---

## Tecnologías utilizadas

- Java 17  
- Spring Boot  
- Spring Security  
- JPA / Hibernate  
- PostgreSQL  
- JWT  


Swagger / OpenAPI
