class SaveBuildingDataUseCase {
  constructor(buildingRepository) {
    this.buildingRepository = buildingRepository;
  }

  async execute({ id, data }) {
    await this.buildingRepository.updateVisitData(id, data);
    await this.buildingRepository.upsertBuildingData(id, data);

    return {
      message: 'Edificio y visita actualizados correctamente'
    };
  }
}

module.exports = SaveBuildingDataUseCase;