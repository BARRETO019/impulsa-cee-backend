/**
 * Caso de uso: exportar PDF
 * -------------------------
 * Obtiene todos los datos y delega la generación al pdfService
 */
class ExportPDFUseCase {
  constructor(documentRepository, pdfService) {
    this.documentRepository = documentRepository;
    this.pdfService = pdfService;
  }

  async execute(visitId, res) {
    const data = await this.documentRepository.getFullVisitData(visitId);
    this.pdfService.generatePDF(res, data);
  }
}

module.exports = ExportPDFUseCase;