# ⚙️ Impulsa CEE Backend

Robust **Node.js + Express** backend powering **Impulsa CEE**, a business platform designed to support **energy certification workflows**.

This API handles core business logic, authentication, structured data storage and third-party integrations for technicians and internal operations.

---

## 🚀 Overview

The backend is responsible for:

- managing technical inspection workflows
- handling authenticated user access
- storing structured visit and building data
- processing field records
- integrating external business services
- supporting document and image generation pipelines

---

## 🛠 Tech Stack

- **Runtime:** Node.js + Express
- **Database:** PostgreSQL (hosted on Neon)
- **Authentication:** JWT-based auth with role-based access control
- **Storage:** Google Drive API v3 for large-scale image storage
- **External Sync:** Airtable API integration
- **Deployment:** Render

---

## 🔐 Authentication & Security

This API includes:

- JWT authentication
- protected routes
- role-based access control:
  - technician
  - admin
  - CEO
- request validation
- secure file handling with **Multer**

---

## 📡 Main Endpoints

### Visits
- `POST /api/visits` → Create a new technical inspection
- `POST /api/visits/:id/finalize` → Finalize visit workflow and trigger document processes

### Building & Envelope Data
- `PUT /api/visits/:id/building` → Save building and thermal envelope data
- `DELETE /api/visits/:id/envelope/:elementoId` → Remove stored envelope elements safely

### Windows & Installations
- `POST /api/visits/:id/windows` → Manage windows/openings and upload related images
- Additional installation-related endpoints handle technical system records

---

## 🔗 Related Repository

Frontend App:  
👉 https://github.com/BARRETO019/impulsa-cee-frontend

---

## 📁 Project Architecture

```bash id="5qg6rk"
controllers/
routes/
services/
middleware/
