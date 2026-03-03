// Importamos express
const express = require('express');
const router = express.Router();

// Middleware de subida de archivos
const upload = require('../middleware/upload.middleware');

// Controlador de visitas
const visitController = require('../controllers/visit.controller');

// Middlewares
const verifyToken = require('../middleware/auth.middleware');
const verifyRole = require('../middleware/role.middleware');

/**
 * =====================================================
 * TODAS LAS RUTAS DE VISITAS:
 * ACCESIBLES POR TÉCNICO, CEO Y ADMIN
 * =====================================================
 */

// Definimos los roles que tienen permiso para casi todo
const rolesPermitidos = ["tecnico", "ceo", "admin"];

/**
 * POST /api/visits - Crear nueva visita técnica
 */
router.post(
  '/',
  verifyToken,
  verifyRole(rolesPermitidos), // ✅ Ahora incluye 'admin'
  visitController.createVisit
);

/**
 * GET /api/visits - Obtener visitas del usuario
 */
router.get(
  '/',
  verifyToken,
  verifyRole(rolesPermitidos),
  visitController.getMyVisits
);

/**
 * PUT /api/visits/:id/building
 */
router.put(
  '/:id/building',
  verifyToken,
  verifyRole(rolesPermitidos),
  visitController.saveBuildingData
);

/**
 * POST /api/visits/:id/photos
 */
router.post(
  '/:id/photos',
  verifyToken,
  verifyRole(rolesPermitidos),
  upload.single('photo'),
  visitController.uploadPhoto
);

/**
 * RUTAS DE ENVOLVENTE (ENVELOPE)
 */
router.post('/:id/envelope', verifyToken, verifyRole(rolesPermitidos), visitController.addEnvelopeElement);
router.get('/:id/envelope', verifyToken, verifyRole(rolesPermitidos), visitController.getEnvelope);

/**
 * RUTAS DE VENTANAS (WINDOWS)
 */
router.post('/:id/windows', verifyToken, verifyRole(rolesPermitidos), visitController.addWindow);
router.get('/:id/windows', verifyToken, verifyRole(rolesPermitidos), visitController.getWindows);

/**
 * RUTAS DE INSTALACIONES
 */
router.post('/:id/installations', verifyToken, verifyRole(rolesPermitidos), visitController.addInstallation);
router.get('/:id/installations', verifyToken, verifyRole(rolesPermitidos), visitController.getInstallations);

/**
 * EXPORTACIÓN (XML / PDF)
 */
router.get('/:id/export-xml', verifyToken, verifyRole(rolesPermitidos), visitController.exportXML);
router.get('/:id/export-pdf', verifyToken, verifyRole(rolesPermitidos), visitController.exportPDF);

/**
 * FINALIZAR VISITA
 */
router.post('/:id/finalize', verifyToken, verifyRole(rolesPermitidos), visitController.finalizeVisit);

/**
 * ===============================
 * AIRTABLE - CLIENTES PLANEADOS
 * ===============================
 */
const airtableService = require('../services/airtable.service');

router.get('/airtable/planeados', verifyToken, async (req, res) => {
  try {
    const records = await airtableService.getPlaneados();

    const clientes = records.map(record => ({
      airtable_id: record.id,
      // Intentamos sacar el nombre de 'Clientes' o de 'Nombre' por si acaso
      cliente: record.fields.Clientes || record.fields.Nombre || "Sin nombre",
      municipio: record.fields.Localidad || "Provincia no asignada"
    }));

    res.json(clientes);
  } catch (error) {
    console.error('Error en ruta Airtable:', error);
    res.status(500).json({ error: 'Error consultando Airtable' });
  }
});

/**
 * DELETE /api/visits/:id - Solo CEO y Admin pueden borrar
 */
router.delete(
  '/:id',
  verifyToken,
  verifyRole(["ceo", "admin"]), 
  visitController.deleteVisit
);

module.exports = router;