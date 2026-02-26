/**
 * =====================================================
 * SERVICIO GENERADOR PDF CEE
 * =====================================================
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Genera PDF dinámico con datos reales
 */
exports.generatePDF = (res, data) => {

  const {
    visit,
    building,
    envelope,
    windows,
    installations
  } = data;

  const doc = new PDFDocument({ margin: 50 });

  // Cabeceras HTTP para descarga
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=visita_${visit.id}.pdf`
  );

  doc.pipe(res);

  // =====================================================
  // TÍTULO
  // =====================================================

  doc.fontSize(20).text('INFORME TECNICO CEE', { align: 'center' });
  doc.moveDown(2);

  // =====================================================
  // DATOS GENERALES
  // =====================================================

  doc.fontSize(14).text('Datos Generales', { underline: true });
  doc.moveDown();

  doc.fontSize(12);
  doc.text(`Direccion: ${visit.direccion}`);
  doc.text(`Municipio: ${visit.municipio}`);
  doc.text(`Provincia: ${visit.provincia}`);
  doc.text(`Ano Construccion: ${visit.ano_construccion}`);
  doc.text(`Zona Climatica: ${building?.zona_climatica || ''}`);
  doc.text(`Superficie Habitable: ${building?.superficie_habitable || ''} m2`);

  doc.moveDown(2);

  // =====================================================
  // ENVOLVENTE
  // =====================================================

  doc.fontSize(14).text('Envolvente Termica', { underline: true });
  doc.moveDown();

  envelope.forEach(e => {
    doc.fontSize(12)
      .text(`${e.tipo} - ${e.nombre}`)
      .text(`Superficie: ${e.superficie} m2`)
      .text(`Orientacion: ${e.orientacion}`)
      .text(`Transmitancia: ${e.transmitancia}`)
      .moveDown();
  });

  doc.moveDown();

  // =====================================================
  // HUECOS
  // =====================================================

  doc.fontSize(14).text('Huecos', { underline: true });
  doc.moveDown();

  windows.forEach(w => {
    doc.fontSize(12)
      .text(`${w.nombre}`)
      .text(`Superficie: ${w.superficie} m2`)
      .text(`Orientacion: ${w.orientacion}`)
      .text(`Transmitancia: ${w.transmitancia}`)
      .text(`Factor Solar: ${w.factor_solar}`)
      .moveDown();
  });

  doc.moveDown();

  // =====================================================
  // INSTALACIONES
  // =====================================================

  doc.fontSize(14).text('Instalaciones Termicas', { underline: true });
  doc.moveDown();

  installations.forEach(i => {
    doc.fontSize(12)
      .text(`${i.tipo} - ${i.generador}`)
      .text(`Combustible: ${i.combustible}`)
      .text(`Potencia: ${i.potencia_nominal} kW`)
      .text(`Rendimiento: ${i.rendimiento_estacional}`)
      .moveDown();
  });

    // =====================================================
  // FOTOS
  // =====================================================

  doc.addPage();
  doc.fontSize(16).text('Reportaje Fotografico', { align: 'center' });
  doc.moveDown(2);

  const photosPath = path.join(
    __dirname,
    '../../uploads/visits',
    visit.id.toString()
  );

  if (fs.existsSync(photosPath)) {

    const files = fs.readdirSync(photosPath);

    files.forEach(file => {

      const imagePath = path.join(photosPath, file);

      try {
        doc.image(imagePath, {
          fit: [400, 300],
          align: 'center'
        });

        doc.moveDown(2);

      } catch (err) {
        console.log("Error cargando imagen:", file);
      }

    });

  } else {

    doc.fontSize(12).text('No hay fotografias disponibles.');

  }

  doc.end();
};


/**
 * Genera PDF y lo guarda en disco
 */
exports.generatePDFToFile = (filePath, data) => {

  const {
    visit,
    building,
    envelope,
    windows,
    installations
  } = data;

  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(fs.createWriteStream(filePath));

  doc.fontSize(20).text('INFORME TECNICO CEE', { align: 'center' });
  doc.moveDown(2);

  doc.fontSize(14).text('Datos Generales', { underline: true });
  doc.moveDown();

  doc.fontSize(12);
  doc.text(`Direccion: ${visit.direccion}`);
  doc.text(`Municipio: ${visit.municipio}`);
  doc.text(`Provincia: ${visit.provincia}`);
  doc.text(`Ano Construccion: ${visit.ano_construccion}`);
  doc.text(`Zona Climatica: ${building?.zona_climatica || ''}`);
  doc.text(`Superficie Habitable: ${building?.superficie_habitable || ''}`);

  doc.addPage();
  doc.fontSize(16).text('Reportaje Fotografico', { align: 'center' });

  doc.end();
};
