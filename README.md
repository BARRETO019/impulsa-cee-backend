# ⚙️ Impulsa Energía - API Backend (v0.1)

Servidor robusto basado en **Node.js** y **Express** que gestiona la lógica de negocio, autenticación y almacenamiento de datos para la App de Certificaciones Técnicas.

## 🛠️ Stack Tecnológico
* **Runtime:** Node.js (Express.js)
* **Base de Datos:** PostgreSQL alojada en **Neon.tech** con pool de conexiones.
* **Autenticación:** Seguridad mediante **JWT** (JSON Web Tokens) con control de roles (técnico, CEO, admin).
* **Almacenamiento:** Integración con **Google Drive API v3** para almacenamiento masivo de imágenes (2TB).
* **Gestión Externa:** Sincronización con **Airtable API** para la gestión de clientes y estados de visita.

## 📡 Endpoints Principales
* `POST /api/visits`: Registro de nueva inspección técnica.
* `PUT /api/visits/:id/building`: Persistencia de datos de envolvente y construcción.
* `POST /api/visits/:id/windows`: Gestión de huecos y subida automatizada de fotos a Google Drive.
* `DELETE /api/visits/:id/envelope/:elementoId`: Borrado seguro de elementos de la base de datos.
* `POST /api/visits/:id/finalize`: Orquestación de finalización de visita y generación de documentos.

## 📁 Arquitectura del Proyecto
* `/controllers`: Lógica de negocio y consultas SQL optimizadas.
* `/routes`: Definición de los puntos de acceso de la API con protección de rutas.
* `/services`: Módulos de integración con servicios externos (Drive, Airtable, PDF).
* `/middleware`: Capa de seguridad, validación de tokens y gestión de archivos con **Multer**.

---
*Backend desplegado en **Render**. Arquitectura escalable y segura para trabajo de campo.*
