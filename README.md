# Gestión Nexo – Sistema de gestión para gimnasio

**Proyecto real desarrollado para un gimnasio local.**  
Sistema web diseñado para reemplazar el uso de planillas Excel y centralizar la gestión diaria del negocio.

El foco principal del proyecto está en la **consistencia de los datos**, la **obtención de métricas financieras** y la **automatización de procesos administrativos**.

---

## Sobre el proyecto

**Cliente:** Nexo (gimnasio local)  
**Estado:**  En desarrollo avanzado – Próximo a implementación productiva

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

## 📸 Capturas del Sistema

### 🔗 API – Documentación Swagger (SOCIOS Y PAGOS)
<img width="1392" height="753" alt="endpoints-socios" src="https://github.com/user-attachments/assets/ec66724f-fb82-458b-9226-37203feb6ba9" />
<img width="1403" height="749" alt="endpoints-pagos" src="https://github.com/user-attachments/assets/005429a4-bc47-4411-881d-8e25903bfef1" />


### 🗄️ Diagrama entidad–relación + modelo logico de la base de datos
<img width="2367" height="1232" alt="derGym" src="https://github.com/user-attachments/assets/1ee53a5a-7c6f-4975-a67f-cf5c03871caf" />

### 📊 Métricas y KPIs
<img width="1919" height="912" alt="kpis" src="https://github.com/user-attachments/assets/7a98fe85-0cbd-4b7e-affa-fb14bef365e1" />
<img width="1919" height="909" alt="kpi-asistencias" src="https://github.com/user-attachments/assets/738914d6-51a6-4bfe-8a38-60a11a8258de" />
<img width="972" height="851" alt="finanzas-kpis" src="https://github.com/user-attachments/assets/9c86fda6-2131-4b20-a0fe-933a3a47d3df" />


### 🖥️ Interfaz del Sistema
<img width="1919" height="910" alt="panel-nexo" src="https://github.com/user-attachments/assets/d61e7562-65fa-473f-91ba-012336ff5143" />


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
