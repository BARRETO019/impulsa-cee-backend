const express = require('express');
const router = express.Router();

// Middleware de subida de archivos
const upload = require('../middleware/upload.middleware');

// Controlador de visitas
const visitController = require('../controllers/visit.controller');

// Middlewares de seguridad
const verifyToken = require('../middleware/auth.middleware');
const verifyRole = require('../middleware/role.middleware');

// Roles autorizados
const rolesAutorizados = ["tecnico", "ceo", "admin"];

/**
 * AIRTABLE - CLIENTES PLANEADOS
 */
const airtableService = require('../services/airtable.service');

router.get('/airtable/planeados', async (req, res) => {
  try {
    const records = await airtableService.getPlaneados();
    const clientes = records.map(record => ({
      airtable_id: record.id,
      cliente: record.fields["Cliente"] || record.fields["Clientes"] || record.fields["Nombre"] || "Cliente Desconocido",
      direccion: record.fields["Dirección"] || record.fields["Direccion"] || "Dirección no disponible",
      municipio: record.fields["Localidad"] || "",
      provincia: record.fields["Provincia"] || ""
    }));
    res.json(clientes);
  } catch (error) {
    console.error("Error Airtable:", error);
    res.status(500).json({ error: 'Error consultando Airtable' });
  }
});

/**
 * RUTAS DE VISITAS (Protegidas)
 */

// 1. Gestión base
router.post('/', verifyToken, verifyRole(rolesAutorizados), visitController.createVisit);
router.get('/', verifyToken, verifyRole(rolesAutorizados), visitController.getMyVisits);

// 2. Paso 1 (Fachadas con fotos) y Paso 2 (Datos Vivienda)
// NUEVO: Añadimos 'upload' porque el Paso 1 ahora manda FormData con imágenes
router.put('/:id/building', verifyToken, verifyRole(rolesAutorizados), upload, visitController.saveBuildingData);

// 3. Paso 3: Envolvente (Se queda sin 'upload' porque solo manda texto normal / JSON)
router.post('/:id/envelope', verifyToken, verifyRole(rolesAutorizados), visitController.addEnvelopeElement);
router.get('/:id/envelope', verifyToken, verifyRole(rolesAutorizados), visitController.getEnvelope);

// 4. Paso 4: Ventanas 
// NUEVO: Añadimos 'upload' para recibir las fotos de los huecos
router.post('/:id/windows', verifyToken, verifyRole(rolesAutorizados), upload, visitController.addWindow);
router.get('/:id/windows', verifyToken, verifyRole(rolesAutorizados), visitController.getWindows);

// 5. Paso 5: Instalaciones 
// NUEVO: Añadimos 'upload' para recibir las fotos de los equipos
router.post('/:id/installations', verifyToken, verifyRole(rolesAutorizados), upload, visitController.addInstallation);
router.get('/:id/installations', verifyToken, verifyRole(rolesAutorizados), visitController.getInstallations);

// 6. Paso 6: Fotos Generales
router.post('/:id/photos', verifyToken, verifyRole(rolesAutorizados), upload, visitController.uploadPhoto);

// 7. Exportación y Finalización
router.get('/:id/export-pdf', verifyToken, verifyRole(rolesAutorizados), visitController.exportPDF);
router.get('/:id/export-xml', verifyToken, verifyRole(rolesAutorizados), visitController.exportXML);
router.post('/:id/finalize', verifyToken, verifyRole(rolesAutorizados), visitController.finalizeVisit);

// 8. Borrar
router.delete('/:id', verifyToken, verifyRole(["ceo", "admin"]), visitController.deleteVisit);

module.exports = router;