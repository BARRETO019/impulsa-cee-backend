const EnvelopeRepository = require('../../infrastructure/repositories/envelope.repository');
const AddEnvelopeElementUseCase = require('../../application/use-cases/add-envelope-element.use-case');
const GetEnvelopeUseCase = require('../../application/use-cases/get-envelope.use-case');
const DeleteEnvelopeElementUseCase = require('../../application/use-cases/delete-envelope-element.use-case');

/**
 * Aquí hacemos el "ensamblado" del módulo:
 * - repositorio
 * - casos de uso
 *
 * Más adelante esto se puede mover a un container o factory,
 * pero por ahora así está perfecto.
 */
const envelopeRepository = new EnvelopeRepository();

const addEnvelopeElementUseCase = new AddEnvelopeElementUseCase(envelopeRepository);
const getEnvelopeUseCase = new GetEnvelopeUseCase(envelopeRepository);
const deleteEnvelopeElementUseCase = new DeleteEnvelopeElementUseCase(envelopeRepository);

/**
 * Controller: añadir elemento
 * ---------------------------
 * Solo se encarga de:
 * - recibir req
 * - llamar al caso de uso
 * - devolver res
 */
exports.addEnvelopeElement = async (req, res) => {
  try {
    const result = await addEnvelopeElementUseCase.execute({
      visitId: req.params.id,
      data: req.body
    });

    return res.status(201).json(result);
  } catch (error) {
    return res.status(500).json({ error: 'Error en envolvente' });
  }
};

/**
 * Controller: listar envolvente
 */
exports.getEnvelope = async (req, res) => {
  try {
    const result = await getEnvelopeUseCase.execute(req.params.id);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: 'Error obteniendo envolvente' });
  }
};

/**
 * Controller: borrar elemento
 */
exports.deleteEnvelopeElement = async (req, res) => {
  try {
    const result = await deleteEnvelopeElementUseCase.execute({
      visitId: req.params.id,
      elementoId: req.params.elementoId
    });

    return res.json(result);
  } catch (error) {
    const status = error.message === 'Elemento no encontrado' ? 404 : 500;
    return res.status(status).json({ error: error.message });
  }
};