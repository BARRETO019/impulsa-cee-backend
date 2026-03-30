const BuildingRepository = require('../../infrastructure/repositories/building.repository');
const SaveBuildingDataUseCase = require('../../application/use-cases/save-building-data.use-case');

const buildingRepository = new BuildingRepository();
const saveBuildingDataUseCase = new SaveBuildingDataUseCase(buildingRepository);

exports.saveBuildingData = async (req, res) => {
  try {
    const result = await saveBuildingDataUseCase.execute({
      id: req.params.id,
      data: req.body
    });

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};