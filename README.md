# Impulsa CEE

Aplicación para la gestión de **visitas técnicas**, recogida de datos de vivienda, envolvente térmica, huecos, instalaciones, documentación y exportación de certificados energéticos.

---

## 📌 Estado actual del proyecto

El proyecto está en proceso de **refactor a arquitectura modular por capas**, separando la lógica en:

* **application** → casos de uso
* **infrastructure** → acceso a datos / servicios externos
* **presentation** → controladores y rutas

Actualmente el backend ya está migrado parcialmente a esta estructura en los módulos principales.

---

# 🏗️ Arquitectura

El backend sigue una **arquitectura modular por capas**.

## Estructura general

```bash
src/
├── assets/
├── config/
├── middleware/
├── modules/
│   ├── auth/
│   ├── visits/
│   ├── buildings/
│   ├── envelope/
│   ├── windows/
│   ├── installations/
│   └── documents/
├── routes/
├── services/
└── app.js
```

---

## Ejemplo de módulo

```bash
modules/auth/
├── application/
│   └── use-cases/
├── infrastructure/
│   ├── auth/
│   └── repositories/
└── presentation/
    ├── controllers/
    └── routes/
```

### Capas

### `application`

Contiene los **casos de uso** de negocio.

Ejemplo:

* login de usuario
* registro de usuario
* crear visita
* guardar envolvente

---

### `infrastructure`

Contiene la implementación técnica:

* acceso a base de datos
* repositorios
* servicios externos
* utilidades técnicas

---

### `presentation`

Contiene la entrada/salida HTTP:

* controladores
* rutas
* validación de requests

---

# ⚙️ Tecnologías

## Backend

* Node.js
* Express
* PostgreSQL
* JWT
* Multer
* bcrypt
* Google Drive API
* Airtable API

## Frontend

* React
* Vite

---

# 🚀 Instalación

## 1. Clonar repositorio

```bash
git clone <URL_DEL_REPO>
cd backend
```

---

## 2. Instalar dependencias

### Backend

```bash
npm install
```

### Frontend

```bash
cd ../frontend
npm install
```

---

# 🔐 Variables de entorno

## Backend (`backend/.env`)

Ejemplo:

```env
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=tu_password
DB_NAME=cee_app
DB_PORT=5432

JWT_SECRET=impulsa_clave_super_segura_2026
FRONTEND_URL=http://localhost:5173
```

> ⚠️ En producción se utilizan variables diferentes (Render / Neon / servicios externos).

---

# ▶️ Ejecución en local

## Backend

Desde la carpeta `backend`:

```bash
npm run dev
```

Servidor por defecto en:

```bash
http://localhost:4000
```

---

## Frontend

Desde la carpeta `frontend`:

```bash
npm run dev
```

Aplicación por defecto en:

```bash
http://localhost:5173
```

---

# 📡 API principal

## Auth

### Login

```http
POST /api/auth/login
```

### Register

```http
POST /api/auth/register
```

---

## Visits

### Crear visita

```http
POST /api/visits
```

### Obtener visitas del usuario

```http
GET /api/visits
```

### Eliminar visita

```http
DELETE /api/visits/:id
```

---

## Building

### Guardar datos de vivienda / fachada

```http
PUT /api/visits/:id/building
```

---

## Envelope

### Añadir elemento de envolvente

```http
POST /api/visits/:id/envelope
```

### Obtener envolvente

```http
GET /api/visits/:id/envelope
```

### Eliminar elemento

```http
DELETE /api/visits/:id/envelope/:elementoId
```

---

## Windows

### Añadir hueco

```http
POST /api/visits/:id/windows
```

### Obtener huecos

```http
GET /api/visits/:id/windows
```

### Eliminar hueco

```http
DELETE /api/visits/:id/windows/:windowId
```

---

## Installations

### Añadir instalación

```http
POST /api/visits/:id/installations
```

### Obtener instalaciones

```http
GET /api/visits/:id/installations
```

---

## Documents

### Exportar PDF

```http
GET /api/visits/:id/export-pdf
```

### Exportar XML

```http
GET /api/visits/:id/export-xml
```

### Finalizar visita

```http
POST /api/visits/:id/finalize
```

---

# 🧪 Estado de pruebas

Actualmente se están validando manualmente los endpoints principales mediante:

* Postman / Thunder Client
* pruebas locales con PostgreSQL
* despliegue en Render

## Endpoints ya comprobados manualmente

* ✅ `POST /api/auth/register`
* ✅ `POST /api/auth/login`
* ✅ `GET /api/visits`
* ✅ `POST /api/visits`

---

# 🛠️ Pendiente / próximos pasos

* Completar refactor de todos los módulos
* Homogeneizar esquema local y producción (PostgreSQL / Neon)
* Añadir tests automáticos con Jest + Supertest
* Mejorar validaciones de entrada
* Documentar mejor flujos de archivos y fotos
* Añadir migraciones de base de datos

---

# 📂 Repositorios

## Frontend

`impulsa-cee-frontend`

## Backend

`impulsa-cee-backend`

---

# 👨‍💻 Autor

Proyecto desarrollado para la gestión técnica de certificados energéticos y visitas de campo.
