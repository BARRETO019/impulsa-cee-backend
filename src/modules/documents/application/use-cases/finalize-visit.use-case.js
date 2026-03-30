const fs = require('fs');
const path = require('path');

/**
 * Caso de uso: finalizar visita
 * -----------------------------
 * Hace 2 cosas:
 * 1. marca la visita como finalizada
 * 2. lanza la generación de documentos en segundo plano
 */
class FinalizeVisitUseCase {
  constructor(documentRepository, pdfService, driveService) {
    this.documentRepository = documentRepository;
    this.pdfService = pdfService;
    this.driveService = driveService;
  }

  async execute(visitId) {
    // 1. Marcamos la visita como finalizada
    await this.documentRepository.finalizeVisit(visitId);

    // 2. Lanzamos generación en background (sin bloquear respuesta)
    this.generateDocumentsInBackground(visitId);

    return {
      message: "Visita finalizada. Generando documentos..."
    };
  }

  /**
   * Generación de documentos en segundo plano
   * -----------------------------------------
   * Antes esto estaba mezclado en el controller.
   * Ahora queda encapsulado en aplicación.
   */
  async generateDocumentsInBackground(id) {
    try {
      const data = await this.documentRepository.getFullVisitData(id);
      const folderName = data.visit?.direccion || `Cliente_${id}`;

      // ==========================
      // PDF
      // ==========================
      const pdfPath = path.join(__dirname, `../../../../../temp_report_${id}.pdf`);

      await this.pdfService.createPDFFile(data, pdfPath);
      await this.driveService.uploadFile(
        pdfPath,
        `Informe_${folderName}.pdf`,
        folderName
      );

      if (fs.existsSync(pdfPath)) {
        fs.unlinkSync(pdfPath);
      }

      // ==========================
      // XML
      // ==========================
      const xmlPath = path.join(__dirname, `../../../../../temp_data_${id}.xml`);

      const xmlContent = `<?xml version="1.0" encoding="UTF-8"?><visita id="${id}"><cliente>${folderName}</cliente></visita>`;
      fs.writeFileSync(xmlPath, xmlContent);

      await this.driveService.uploadFile(
        xmlPath,
        `Datos_${folderName}.xml`,
        folderName
      );

      if (fs.existsSync(xmlPath)) {
        fs.unlinkSync(xmlPath);
      }

      console.log(`Documentos generados para ${folderName} ✅`);
    } catch (error) {
      console.error("Error generando documentos:", error);
    }
  }
}

module.exports = FinalizeVisitUseCase;