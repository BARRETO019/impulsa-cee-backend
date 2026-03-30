/**
 * Caso de uso: obtener instalaciones
 */
class GetInstallationsUseCase {
  constructor(installationRepository) {
    this.installationRepository = installationRepository;
  }

  async execute(visitId) {
    return this.installationRepository.findByVisitId(visitId);
  }
}

module.exports = GetInstallationsUseCase;