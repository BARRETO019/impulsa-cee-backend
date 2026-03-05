const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// --- FUNCIÓN PRINCIPAL DE DIBUJO (Compartida) ---
const drawPDFContent = (doc, data) => {
  const { visit, building, envelope, windows, installations, photos } = data;

  // --- CABECERA (Logo y Título) ---
  const logoPath = path.join(__dirname, '../assets/logo.png');
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, 50, 45, { width: 60 });
  }

  doc.fillColor('#333333')
     .fontSize(18).text('IMPULSA ENERGÍA', 120, 50, { b: true })
     .fontSize(12).text('Informe Técnico CEE', 120, 70);
  
  doc.moveTo(50, 100).lineTo(550, 100).stroke('#cccccc');
  doc.moveDown(2);

  // --- 1. DATOS GENERALES ---
  doc.fontSize(14).fillColor('#000000').text('Datos Generales', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor('#333333')
     .text(`Dirección: ${visit.direccion || 'Cliente Sin Nombre'}`)
     .text(`Municipio: ${visit.municipio || 'N/A'}`)
     .text(`Provincia: ${building?.provincia || visit.provincia || 'N/A'}`)
     .text(`Año Construcción: ${building?.ano_construccion || 'N/A'}`)
     .text(`Zona Climática: ${building?.zona_climatica || 'N/A'}`)
     .text(`Superficie Habitable: ${building?.superficie_habitable || '0'} m2`);
  doc.moveDown();

  // --- 2. ENVOLVENTE ---
  renderSectionHeader(doc, '2. Envolvente Térmica');
  if (!envelope || envelope.length === 0) {
    doc.fontSize(10).text('No se han registrado elementos de envolvente.');
  } else {
    envelope.forEach(e => {
      doc.fontSize(10).fillColor('#000').text(`• ${e.tipo}`, { b: true });
      doc.fillColor('#444').text(`  Superficie: ${e.superficie} m2 | Orientación: ${e.orientacion || 'N/A'}`);
      doc.moveDown(0.2);
    });
  }
  doc.moveDown();

  // --- 3. HUECOS / VENTANAS ---
  renderSectionHeader(doc, '3. Huecos y Acristalamientos');
  if (!windows || windows.length === 0) {
    doc.fontSize(10).text('No se han registrado ventanas.');
  } else {
    windows.forEach(w => {
      doc.fontSize(10).fillColor('#000').text(`• ${w.nombre || 'Ventana'}`, { b: true });
      doc.fillColor('#444').text(`  ${w.superficie} m2 | Vidrio: ${w.vidrio} | Marco: ${w.marco}`);
      doc.moveDown(0.2);
    });
  }
  doc.moveDown();

  // --- 4. INSTALACIONES ---
  renderSectionHeader(doc, '4. Instalaciones Térmicas');
  if (!installations || installations.length === 0) {
    doc.fontSize(10).text('No se han registrado instalaciones.');
  } else {
    installations.forEach(i => {
      doc.fontSize(10).fillColor('#000').text(`• ${i.tipo}`, { b: true });
      doc.fillColor('#444').text(`  Equipo: ${i.generador || i.marca_modelo || 'N/A'} | Potencia: ${i.potencia_nominal || i.potencia || '0'} kW`);
      doc.text(`  Combustible: ${i.combustible || i.energia} | Año: ${i.ano_instalacion || i.ano_aprox || 'N/A'}`);
      doc.moveDown(0.2);
    });
  }

  // --- 5. FOTOS ---
  // Nota: Aquí solo incluimos fotos si tienen ruta local válida. 
  // Si las fotos ya están solo en Drive, habría que descargarlas primero (pero eso es otro paso).
  if (photos && photos.length > 0) {
    doc.addPage();
    renderSectionHeader(doc, 'Anexo Fotográfico');
    doc.moveDown();
    // ... lógica de fotos igual que antes ...
  }

  doc.end();
};

// --- FUNCIÓN 1: Para descargar directamente desde el navegador ---
exports.generatePDF = (res, data) => {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=Informe_CEE_${data.visit.id}.pdf`);
  doc.pipe(res);
  drawPDFContent(doc, data);
};

// --- FUNCIÓN 2: Para guardar en archivo (Y luego subir a DRIVE) ---
exports.createPDFFile = (data, outputPath) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);
      
      drawPDFContent(doc, data);

      stream.on('finish', () => resolve(outputPath));
      stream.on('error', (err) => reject(err));
    } catch (error) {
      reject(error);
    }
  });
};

function renderSectionHeader(doc, title) {
  doc.rect(50, doc.y, 500, 18).fill('#f2f2f2');
  doc.fillColor('#000').fontSize(11).text(title, 55, doc.y - 14, { b: true });
  doc.moveDown(0.5);
}