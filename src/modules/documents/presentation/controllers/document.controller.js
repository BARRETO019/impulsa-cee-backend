const DocumentRepository = require('../../infrastructure/repositories/document.repository');
const ExportPDFUseCase = require('../../application/use-cases/export-pdf.use-case');
const ExportXMLUseCase = require('../../application/use-cases/export-xml.use-case');
const FinalizeVisitUseCase = require('../../application/use-cases/finalize-visit.use-case');

// Servicios legacy reutilizados por ahora
const pdfService = require('../../../../services/pdf.service');
const driveService = require('../../../../services/drive.service');

/**
 * Ensamblado del módulo
 */
const documentRepository = new DocumentRepository();

const exportPDFUseCase = new ExportPDFUseCase(documentRepository, pdfService);
const exportXMLUseCase = new ExportXMLUseCase();
const finalizeVisitUseCase = new FinalizeVisitUseCase(
  documentRepository,
  pdfService,
  driveService
);

/**
 * Exportar PDF
 */
exports.exportPDF = async (req, res) => {
  try {
    await exportPDFUseCase.execute(req.params.id, res);
  } catch (error) {
    return res.status(500).json({ error: "Error PDF" });
  }
};

/**
 * Exportar XML
 */
exports.exportXML = async (req, res) => {
  try {
    const result = await exportXMLUseCase.execute();
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: "Error XML" });
  }
};

/**
 * Finalizar visita
 */
exports.finalizeVisit = async (req, res) => {
  try {
    const result = await finalizeVisitUseCase.execute(req.params.id);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: "No se pudo finalizar" });
  }
};