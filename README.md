# ⚙️ Impulsa CEE Backend

Robust **Node.js + Express** backend powering **Impulsa CEE**, a business platform designed to support **energy certification workflows**.

This API handles business logic, authentication, structured data storage and third-party integrations for technicians and internal operations.

---

## 🚀 Overview

The backend is responsible for:

- managing technical inspection workflows
- handling authenticated user access
- storing structured visit and building data
- processing field records
- integrating external business services
- supporting image and document workflows

---

## 🎯 Project Purpose

This backend was built to support a **real operational workflow** in the energy certification sector.

Its goal is to replace fragmented manual processes with a structured system for:

- collecting field inspection data
- managing technical visit records
- centralizing business information
- automating document and image handling
- improving reliability in day-to-day operations

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

## 📡 Main API Responsibilities

The API currently supports workflows related to:

- user authentication
- technical visit creation and management
- building and thermal envelope data persistence
- windows and installation data registration
- image upload and storage
- synchronization with external business services

> Endpoint structure may evolve as the project grows and is refined.

---

## 🔗 Related Repository

Frontend App: [impulsa-cee-frontend](https://github.com/BARRETO019/impulsa-cee-frontend)

---

## 📁 Project Architecture

```bash
src/
├── assets/
├── config/
├── controllers/
├── middleware/
├── routes/
├── services/
└── app.js
