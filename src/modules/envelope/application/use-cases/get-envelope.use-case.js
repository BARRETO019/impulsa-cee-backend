/**
 * Caso de uso: obtener envolvente de una visita
 */
class GetEnvelopeUseCase {
  constructor(envelopeRepository) {
    this.envelopeRepository = envelopeRepository;
  }

  async execute(visitId) {
    return this.envelopeRepository.findByVisitId(visitId);
  }
}

module.exports = GetEnvelopeUseCase;