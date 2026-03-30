/**
 * Caso de uso: añadir elemento de envolvente
 * ------------------------------------------
 * Aquí vive la lógica de aplicación:
 * - recibe datos
 * - delega en el repositorio
 *
 * Si mañana quisieras validar reglas de negocio,
 * este sería el sitio correcto.
 */
class AddEnvelopeElementUseCase {
  constructor(envelopeRepository) {
    this.envelopeRepository = envelopeRepository;
  }

  async execute({ visitId, data }) {
    return this.envelopeRepository.create(visitId, data);
  }
}

module.exports = AddEnvelopeElementUseCase;