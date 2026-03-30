class GetMyVisitsUseCase {
  constructor(visitRepository) {
    this.visitRepository = visitRepository;
  }

  async execute(userId) {
    return this.visitRepository.findByTechnicianId(userId);
  }
}

module.exports = GetMyVisitsUseCase;