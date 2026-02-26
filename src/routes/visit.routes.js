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
 *        TODAS LAS RUTAS DE VISITAS:
 *     ACCESIBLES POR TÉCNICO Y CEO
 * =====================================================
 */

/**
 * POST /api/visits
 * Crear nueva visita técnica
 */
router.post(
  '/',
  verifyToken,
  verifyRole(["tecnico", "ceo"]),
  visitController.createVisit
);

/**
 * GET /api/visits
 * Obtener todas las visitas del técnico autenticado
 */
router.get(
  '/',
  verifyToken,
  verifyRole(["tecnico", "ceo"]),
  visitController.getMyVisits
);

/**
 * PUT /api/visits/:id/building
 */
router.put(
  '/:id/building',
  verifyToken,
  verifyRole(["tecnico", "ceo"]),
  visitController.saveBuildingData
);

/**
 * POST /api/visits/:id/photos
 */
router.post(
  '/:id/photos',
  verifyToken,
  verifyRole(["tecnico", "ceo"]),
  upload.single('photo'),
  visitController.uploadPhoto
);

/**
 * POST /api/visits/:id/envelope
 */
router.post(
  '/:id/envelope',
  verifyToken,
  verifyRole(["tecnico", "ceo"]),
  visitController.addEnvelopeElement
);

/**
 * GET /api/visits/:id/envelope
 */
router.get(
  '/:id/envelope',
  verifyToken,
  verifyRole(["tecnico", "ceo"]),
  visitController.getEnvelope
);

/**
 * POST /api/visits/:id/windows
 */
router.post(
  '/:id/windows',
  verifyToken,
  verifyRole(["tecnico", "ceo"]),
  visitController.addWindow
);

/**
 * GET /api/visits/:id/windows
 */
router.get(
  '/:id/windows',
  verifyToken,
  verifyRole(["tecnico", "ceo"]),
  visitController.getWindows
);

/**
 * POST /api/visits/:id/installations
 */
router.post(
  '/:id/installations',
  verifyToken,
  verifyRole(["tecnico", "ceo"]),
  visitController.addInstallation
);

/**
 * GET /api/visits/:id/installations
 */
router.get(
  '/:id/installations',
  verifyToken,
  verifyRole(["tecnico", "ceo"]),
  visitController.getInstallations
);

/**
 * GET /api/visits/:id/export-xml
 */
router.get(
  '/:id/export-xml',
  verifyToken,
  verifyRole(["tecnico", "ceo"]),
  visitController.exportXML
);

/**
 * GET /api/visits/:id/export-pdf
 */
router.get(
  '/:id/export-pdf',
  verifyToken,
  verifyRole(["tecnico", "ceo"]),
  visitController.exportPDF
);

/**
 * POST /api/visits/:id/finalize
 */
router.post(
  '/:id/finalize',
  verifyToken,
  verifyRole(["tecnico", "ceo"]),
  visitController.finalizeVisit
);

/**
 * ===============================
 * AIRTABLE - CLIENTES PLANEADOS
 * ===============================
 */
const airtableService = require('../services/airtable.service');

router.get('/airtable/planeados', async (req, res) => {
  try {
    const records = await airtableService.getPlaneados();

    const clientes = records.map(record => ({
      airtable_id: record.id,
      cliente: record.fields.Clientes,
      municipio: record.fields.Localidad
    }));

    res.json(clientes);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error consultando Airtable' });
  }
});
/**
 * DELETE /api/visits/:id
 * Solo CEO puede borrar visitas
 */
router.delete(
  '/:id',
  verifyToken,
  verifyRole(["ceo"]), // 🔥 SOLO CEO
  visitController.deleteVisit
);

module.exports = router;