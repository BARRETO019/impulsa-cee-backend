const express = require('express');
const router = express.Router();

/**
 * ==========================================
 * MIDDLEWARES COMPARTIDOS
 * ==========================================
 */
const upload = require('../middleware/upload.middleware');
const verifyToken = require('../middleware/auth.middleware');
const verifyRole = require('../middleware/role.middleware');

/**
 * Roles autorizados para trabajar con visitas
 */
const rolesAutorizados = ['tecnico', 'ceo', 'admin'];

/**
 * ==========================================
 * CONTROLADORES MODULARES
 * ==========================================
 */

// Gestión base de visitas
const visitController = require('../modules/visits/presentation/controllers/visit.controller');

// Datos del edificio
const buildingController = require('../modules/buildings/presentation/controllers/building.controller');

// Envolvente térmica
const envelopeController = require('../modules/envelope/presentation/controllers/envelope.controller');

// Ventanas / huecos
const windowController = require('../modules/windows/presentation/controllers/window.controller');

// Instalaciones
const installationController = require('../modules/installations/presentation/controllers/installation.controller');

// Documentos (PDF / XML / finalizar)
const documentController = require('../modules/documents/presentation/controllers/document.controller');

/**
 * ==========================================
 * CONTROLADORES LEGACY TEMPORALES
 * ==========================================
 * Esto se quedará aquí hasta migrar:
 * - fotos generales
 * - integración Airtable
 */
const legacyVisitController = require('../legacy/visit.controller');
const airtableService = require('../services/airtable.service');

/**
 * ==========================================
 * AIRTABLE - CLIENTES PLANEADOS
 * ==========================================
 */
router.get('/airtable/planeados', async (req, res) => {
  try {
    const records = await airtableService.getPlaneados();

    const clientes = records.map(record => ({
      airtable_id: record.id,
      cliente:
        record.fields['Cliente'] ||
        record.fields['Clientes'] ||
        record.fields['Nombre'] ||
        'Cliente Desconocido',
      direccion:
        record.fields['Dirección'] ||
        record.fields['Direccion'] ||
        'Dirección no disponible',
      municipio: record.fields['Localidad'] || '',
      provincia: record.fields['Provincia'] || ''
    }));

    return res.json(clientes);
  } catch (error) {
    console.error('Error Airtable:', error);
    return res.status(500).json({ error: 'Error consultando Airtable' });
  }
});

/**
 * ==========================================
 * RUTAS DE VISITAS
 * ==========================================
 */

/**
 * 1. Gestión base de la visita
 */
router.post('/', verifyToken, verifyRole(rolesAutorizados), visitController.createVisit);
router.get('/', verifyToken, verifyRole(rolesAutorizados), visitController.getMyVisits);
router.delete('/:id', verifyToken, verifyRole(['ceo', 'admin']), visitController.deleteVisit);

/**
 * 2. Datos del edificio
 */
router.put('/:id/building', verifyToken, verifyRole(rolesAutorizados), upload, buildingController.saveBuildingData);

/**
 * 3. Envolvente térmica
 */
router.post('/:id/envelope', verifyToken, verifyRole(rolesAutorizados), envelopeController.addEnvelopeElement);
router.get('/:id/envelope', verifyToken, verifyRole(rolesAutorizados), envelopeController.getEnvelope);
router.delete('/:id/envelope/:elementoId', verifyToken, verifyRole(rolesAutorizados), envelopeController.deleteEnvelopeElement);

/**
 * 4. Ventanas / huecos
 */
router.post('/:id/windows', verifyToken, verifyRole(rolesAutorizados), upload, windowController.addWindow);
router.get('/:id/windows', verifyToken, verifyRole(rolesAutorizados), windowController.getWindows);
router.delete('/:id/windows/:windowId', verifyToken, verifyRole(rolesAutorizados), windowController.deleteWindow);

/**
 * 5. Instalaciones
 */
router.post('/:id/installations', verifyToken, verifyRole(rolesAutorizados), upload, installationController.addInstallation);
router.get('/:id/installations', verifyToken, verifyRole(rolesAutorizados), installationController.getInstallations);

/**
 * 6. Fotos generales (legacy temporal)
 */
router.post('/:id/photos', verifyToken, verifyRole(rolesAutorizados), upload, legacyVisitController.uploadPhoto);

/**
 * 7. Exportación y finalización
 */
router.get('/:id/export-pdf', verifyToken, verifyRole(rolesAutorizados), documentController.exportPDF);
router.get('/:id/export-xml', verifyToken, verifyRole(rolesAutorizados), documentController.exportXML);
router.post('/:id/finalize', verifyToken, verifyRole(rolesAutorizados), documentController.finalizeVisit);

module.exports = router;