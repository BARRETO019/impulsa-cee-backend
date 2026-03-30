const fs = require('fs');

/**
 * Caso de uso: crear instalación
 * ------------------------------
 * Aquí vive la lógica real:
 * - crear instalación
 * - subir fotos a Drive
 * - guardar referencia en DB
 * - borrar archivo temporal
 */
class AddInstallationUseCase {
  constructor(installationRepository, driveService) {
    this.installationRepository = installationRepository;
    this.driveService = driveService;
  }

  async execute({ visitId, data, files }) {
    // 1. Crear instalación en DB
    const newInstallation = await this.installationRepository.create(visitId, data);

    // 2. Si hay archivos, los subimos
    if (files && files.length > 0) {
      const folderName = await this.installationRepository.getFolderName(visitId);

      for (const file of files) {
        // Subida a Google Drive
        const driveFileId = await this.driveService.uploadFile(
          file.path,
          file.filename,
          folderName
        );

        // Guardamos referencia en DB
        await this.installationRepository.savePhoto(
          visitId,
          file.originalname,
          driveFileId,
          newInstallation.id
        );

        // Borramos temporal local
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }
    }

    return newInstallation;
  }
}

module.exports = AddInstallationUseCase;