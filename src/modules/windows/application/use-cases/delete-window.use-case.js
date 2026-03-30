/**
 * Caso de uso: borrar ventana
 */
class DeleteWindowUseCase {
  constructor(windowRepository) {
    this.windowRepository = windowRepository;
  }

  async execute(windowId) {
    // Borra ventana
    await this.windowRepository.deleteById(windowId);

    // Borra fotos asociadas (como ya hacías antes)
    await this.windowRepository.deletePhotos(windowId);

    return {
      message: "Ventana eliminada correctamente"
    };
  }
}

module.exports = DeleteWindowUseCase;