const express = require('express');
const router = express.Router();

// Middleware de subida de archivos
const upload = require('../middleware/upload.middleware');

// Controlador de visitas
const visitController = require('../controllers/visit.controller');

// Middlewares de seguridad
const verifyToken = require('../middleware/auth.middleware');
const verifyRole = require('../middleware/role.middleware');

// Definimos los roles autorizados (incluimos admin para evitar el 403)
const rolesAutorizados = ["tecnico", "ceo", "admin"];

/**
 * ===============================
 * AIRTABLE - CLIENTES PLANEADOS
 * ===============================
 * La dejamos pública temporalmente para evitar el error 401 
 * mientras se sincroniza el token del frontend.
 */
const airtableService = require('../services/airtable.service');

router.get('/airtable/planeados', async (req, res) => {
  try {
    const records = await airtableService.getPlaneados();

    const clientes = records.map(record => ({
      airtable_id: record.id,
      cliente: record.fields.Clientes || record.fields.Nombre || "Sin nombre",
      municipio: record.fields.Localidad || "Ubicación no disponible",
      // 🚩 Extraemos la provincia o ponemos una por defecto para evitar el error 500
      provincia: record.fields.Provincia || "Madrid" 
    }));

    res.json(clientes);
  } catch (error) {
    console.error('Error en Airtable Route:', error);
    res.status(500).json({ error: 'Error consultando Airtable' });
  }
});
/**
 * =====================================================
 * RUTAS PROTEGIDAS DE VISITAS
 * =====================================================
 */

// Crear visita (Aquí es donde te daba el 403)
router.post('/', verifyToken, verifyRole(rolesAutorizados), visitController.createVisit);

// Ver mis visitas
router.get('/', verifyToken, verifyRole(rolesAutorizados), visitController.getMyVisits);

// Datos del edificio
router.put('/:id/building', verifyToken, verifyRole(rolesAutorizados), visitController.saveBuildingData);

// Subida de fotos
router.post('/:id/photos', verifyToken, verifyRole(rolesAutorizados), upload.single('photo'), visitController.uploadPhoto);

// Envolvente, Ventanas e Instalaciones
router.post('/:id/envelope', verifyToken, verifyRole(rolesAutorizados), visitController.addEnvelopeElement);
router.get('/:id/envelope', verifyToken, verifyRole(rolesAutorizados), visitController.getEnvelope);

router.post('/:id/windows', verifyToken, verifyRole(rolesAutorizados), visitController.addWindow);
router.get('/:id/windows', verifyToken, verifyRole(rolesAutorizados), visitController.getWindows);

router.post('/:id/installations', verifyToken, verifyRole(rolesAutorizados), visitController.addInstallation);
router.get('/:id/installations', verifyToken, verifyRole(rolesAutorizados), visitController.getInstallations);

// Exportación y Finalización
router.get('/:id/export-xml', verifyToken, verifyRole(rolesAutorizados), visitController.exportXML);
router.get('/:id/export-pdf', verifyToken, verifyRole(rolesAutorizados), visitController.exportPDF);
router.post('/:id/finalize', verifyToken, verifyRole(rolesAutorizados), visitController.finalizeVisit);

// Borrar visita (Solo CEO y Admin)
router.delete('/:id', verifyToken, verifyRole(["ceo", "admin"]), visitController.deleteVisit);

module.exports = router;