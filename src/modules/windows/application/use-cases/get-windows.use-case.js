/**
 * Caso de uso: obtener ventanas
 */
class GetWindowsUseCase {
  constructor(windowRepository) {
    this.windowRepository = windowRepository;
  }

  async execute(visitId) {
    return this.windowRepository.findByVisitId(visitId);
  }
}

module.exports = GetWindowsUseCase;