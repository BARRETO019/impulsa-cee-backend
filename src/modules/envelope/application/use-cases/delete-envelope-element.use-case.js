/**
 * Caso de uso: borrar un elemento de envolvente
 */
class DeleteEnvelopeElementUseCase {
  constructor(envelopeRepository) {
    this.envelopeRepository = envelopeRepository;
  }

  async execute({ visitId, elementoId }) {
    const deleted = await this.envelopeRepository.deleteById(visitId, elementoId);

    // Si no existe el elemento, lanzamos error controlado
    if (!deleted) {
      throw new Error('Elemento no encontrado');
    }

    return {
      message: 'Borrado correctamente'
    };
  }
}

module.exports = DeleteEnvelopeElementUseCase;