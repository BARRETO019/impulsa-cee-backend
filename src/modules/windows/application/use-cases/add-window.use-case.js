/**
 * Caso de uso: crear ventana
 */
class AddWindowUseCase {
  constructor(windowRepository) {
    this.windowRepository = windowRepository;
  }

  async execute({ visitId, data }) {
    return this.windowRepository.create(visitId, data);
  }
}

module.exports = AddWindowUseCase;