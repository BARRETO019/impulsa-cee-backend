const InstallationRepository = require('../../infrastructure/repositories/installation.repository');
const AddInstallationUseCase = require('../../application/use-cases/add-installation.use-case');
const GetInstallationsUseCase = require('../../application/use-cases/get-installations.use-case');

// Servicio legacy reutilizado por ahora
const driveService = require('../../../../services/drive.service');

/**
 * Ensamblado del módulo
 */
const installationRepository = new InstallationRepository();

const addInstallationUseCase = new AddInstallationUseCase(
  installationRepository,
  driveService
);

const getInstallationsUseCase = new GetInstallationsUseCase(
  installationRepository
);

/**
 * Crear instalación
 */
exports.addInstallation = async (req, res) => {
  try {
    const result = await addInstallationUseCase.execute({
      visitId: req.params.id,
      data: req.body,
      files: req.files
    });

    return res.status(201).json(result);
  } catch (error) {
    return res.status(500).json({ error: "Error al guardar instalación" });
  }
};

/**
 * Obtener instalaciones
 */
exports.getInstallations = async (req, res) => {
  try {
    const result = await getInstallationsUseCase.execute(req.params.id);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: "Error obteniendo instalaciones" });
  }
};