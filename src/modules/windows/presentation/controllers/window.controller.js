const WindowRepository = require('../../infrastructure/repositories/window.repository');
const AddWindowUseCase = require('../../application/use-cases/add-window.use-case');
const GetWindowsUseCase = require('../../application/use-cases/get-windows.use-case');
const DeleteWindowUseCase = require('../../application/use-cases/delete-window.use-case');

/**
 * Ensamblado del módulo
 */
const windowRepository = new WindowRepository();

const addWindowUseCase = new AddWindowUseCase(windowRepository);
const getWindowsUseCase = new GetWindowsUseCase(windowRepository);
const deleteWindowUseCase = new DeleteWindowUseCase(windowRepository);

/**
 * Crear ventana
 */
exports.addWindow = async (req, res) => {
  try {
    const result = await addWindowUseCase.execute({
      visitId: req.params.id,
      data: req.body
    });

    return res.status(201).json(result);
  } catch (error) {
    console.error("Error al guardar ventana:", error);
    return res.status(500).json({ error: "Error al guardar ventana" });
  }
};

/**
 * Obtener ventanas
 */
exports.getWindows = async (req, res) => {
  try {
    const result = await getWindowsUseCase.execute(req.params.id);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: "Error obteniendo ventanas" });
  }
};

/**
 * Borrar ventana
 */
exports.deleteWindow = async (req, res) => {
  try {
    const result = await deleteWindowUseCase.execute(req.params.windowId);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: "Error al borrar ventana" });
  }
};