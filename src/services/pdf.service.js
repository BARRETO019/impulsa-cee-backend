const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

exports.generatePDF = (res, data) => {

  const { visit, building, envelope, windows, installations } = data;

  const doc = new PDFDocument({ margin: 50 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=visita_${visit.id}.pdf`
  );

  doc.pipe(res);

  // ===============================
  // CABECERA
  // ===============================

  const logoPath = path.join(__dirname, '../assets/logo.png');

  try {
    doc.image(logoPath, 50, 40, { width: 80 });
  } catch {
    console.log("Logo no encontrado");
  }

  doc.fontSize(18).text('IMPULSA ENERGÍA', 150, 45);
  doc.fontSize(12).text('Informe Técnico CEE', 150, 65);

  doc.moveDown(3);

  doc.moveTo(50, 110).lineTo(550, 110).stroke();

  doc.fontSize(10)
     .text(`Fecha del informe: ${new Date().toLocaleDateString()}`, { align: 'right' });

  doc.moveDown(2);

  // ===============================
  // DATOS GENERALES
  // ===============================

  doc.fontSize(14).text('Datos Generales', { underline: true });
  doc.moveDown();

  doc.fontSize(12);
  doc.text(`Dirección: ${visit.direccion || 'No especificado'}`);
  doc.text(`Municipio: ${visit.municipio || 'No especificado'}`);
  doc.text(`Provincia: ${visit.provincia || 'No especificado'}`);
  doc.text(`Año Construcción: ${visit.ano_construccion || 'No especificado'}`);
  doc.text(`Zona Climática: ${building?.zona_climatica || 'No especificado'}`);
  doc.text(`Superficie Habitable: ${building?.superficie_habitable || 'No especificado'} m2`);

  doc.moveDown(2);

  // ===============================
  // ENVOLVENTE
  // ===============================

  doc.fontSize(14).text('Envolvente Térmica', { underline: true });
  doc.moveDown();

  envelope.forEach(e => {

    doc.fontSize(12)
      .text(`${e.tipo || 'Elemento'} - ${e.nombre || ''}`)
      .text(`Superficie: ${e.superficie || 'No especificado'} m2`)
      .text(`Orientación: ${e.orientacion || 'No especificado'}`)
      .text(`Transmitancia: ${e.transmitancia || 'No especificado'}`)
      .moveDown();

  });

  // ===============================
  // HUECOS
  // ===============================

  doc.fontSize(14).text('Huecos (Ventanas)', { underline: true });
  doc.moveDown();

  windows.forEach(w => {

    doc.fontSize(12)
      .text(`${w.nombre || 'Ventana'}`)
      .text(`Superficie: ${w.superficie || 'No especificado'} m2`)
      .text(`Marco: ${w.marco || 'No especificado'}`)
      .text(`Vidrio: ${w.vidrio || 'No especificado'}`)
      .moveDown();

  });

  // ===============================
  // INSTALACIONES
  // ===============================

  doc.fontSize(14).text('Instalaciones Térmicas', { underline: true });
  doc.moveDown();

  installations.forEach(i => {

  doc.fontSize(12)
    .text(`${i.tipo || 'Equipo'} - ${i.generador || 'No especificado'}`)
    .text(`Combustible: ${i.combustible || 'No especificado'}`)
    .text(`Potencia: ${i.potencia_nominal || 'No especificado'} kW`)
    .text(`Rendimiento: ${i.rendimiento_estacional || 'No especificado'}`)
    .text(`Año instalación: ${i.ano_instalacion || 'No especificado'}`)
    .moveDown();

});

  // ===============================
  // FOTOS
  // ===============================

  doc.addPage();
  doc.fontSize(16).text('Reportaje Fotográfico', { align: 'center' });
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

      } catch {
        console.log("Error cargando imagen:", file);
      }

    });

  } else {

    doc.fontSize(12).text('No hay fotografías disponibles.');

  }

  doc.end();

};
exports.generatePDFToFile = (filePath, data) => {

  const { visit, building, envelope, windows, installations } = data;

  const PDFDocument = require('pdfkit');
  const fs = require('fs');
  const path = require('path');

  const doc = new PDFDocument({ margin: 50 });

  doc.pipe(fs.createWriteStream(filePath));

  const logoPath = path.join(__dirname, '../assets/logo.png');

  try {
    doc.image(logoPath, 50, 40, { width: 80 });
  } catch {
    console.log("Logo no encontrado");
  }

  doc.fontSize(18).text('IMPULSA ENERGÍA', 150, 45);
  doc.fontSize(12).text('Informe Técnico CEE', 150, 65);

  doc.moveDown(3);

  doc.moveTo(50, 110).lineTo(550, 110).stroke();

  doc.moveDown(2);

  doc.fontSize(14).text('Datos Generales', { underline: true });
  doc.moveDown();

  doc.fontSize(12);
  doc.text(`Dirección: ${visit.direccion || ''}`);
  doc.text(`Municipio: ${visit.municipio || ''}`);
  doc.text(`Provincia: ${visit.provincia || ''}`);
  doc.text(`Año Construcción: ${visit.ano_construccion || ''}`);
  doc.text(`Zona Climática: ${building?.zona_climatica || ''}`);
  doc.text(`Superficie Habitable: ${building?.superficie_habitable || ''}`);

  doc.end();

};