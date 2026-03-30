const VisitRepository = require('../../infrastructure/repositories/visit.repository');
const CreateVisitUseCase = require('../../application/use-cases/create-visit.use-case');
const GetMyVisitsUseCase = require('../../application/use-cases/get-my-visits.use-case');
const DeleteVisitUseCase = require('../../application/use-cases/delete-visit.use-case');

const airtableService = require('../../../../services/airtable.service');

const visitRepository = new VisitRepository();

const createVisitUseCase = new CreateVisitUseCase(
  visitRepository,
  airtableService
);

const getMyVisitsUseCase = new GetMyVisitsUseCase(visitRepository);
const deleteVisitUseCase = new DeleteVisitUseCase(visitRepository);

exports.createVisit = async (req, res) => {
  try {
    const result = await createVisitUseCase.execute({
      body: req.body,
      user: req.user
    });

    return res.status(201).json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getMyVisits = async (req, res) => {
  try {
    const result = await getMyVisitsUseCase.execute(req.user.id);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: 'Error obteniendo visitas' });
  }
};

exports.deleteVisit = async (req, res) => {
  try {
    await deleteVisitUseCase.execute(req.params.id);
    return res.json({ message: 'Borrada' });
  } catch (error) {
    const status = error.message === 'Visita no encontrada' ? 404 : 500;
    return res.status(status).json({ error: error.message });
  }
};