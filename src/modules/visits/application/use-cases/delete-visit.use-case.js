class DeleteVisitUseCase {
  constructor(visitRepository) {
    this.visitRepository = visitRepository;
  }

  async execute(id) {
    const deletedVisit = await this.visitRepository.deleteById(id);

    if (!deletedVisit) {
      throw new Error('Visita no encontrada');
    }

    return deletedVisit;
  }
}

module.exports = DeleteVisitUseCase;