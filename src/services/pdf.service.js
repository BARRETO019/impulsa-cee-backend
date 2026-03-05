const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

exports.generatePDF = (res, data) => {
  const { visit, building, envelope, windows, installations, photos } = data;
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  // Configuración de respuesta
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=Informe_CEE_${visit.id}.pdf`);
  doc.pipe(res);

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

  // --- 2. ENVOLVENTE (Step 2) ---
  renderSectionHeader(doc, '2. Envolvente Térmica');
  if (!envelope || envelope.length === 0) {
    doc.fontSize(10).text('No se han registrado elementos de envolvente.');
  } else {
    envelope.forEach(e => {
      doc.fontSize(10).fillColor('#000').text(`• ${e.tipo}`, { b: true });
      doc.fillColor('#444').text(`  Superficie: ${e.superficie} m2 | Orientación: ${e.orientacion || 'N/A'}`);
      if (e.observaciones) doc.fontSize(9).text(`  Obs: ${e.observaciones}`);
      doc.moveDown(0.2);
    });
  }
  doc.moveDown();

  // --- 3. HUECOS / VENTANAS (Step 3) ---
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

  // --- 4. INSTALACIONES (Step 4) ---
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

  // --- 5. FOTOS (Step 5) ---
  if (photos && photos.length > 0) {
    doc.addPage();
    renderSectionHeader(doc, 'Anexo Fotográfico');
    doc.moveDown();

    let x = 50;
    let y = doc.y;

    photos.forEach((photo, index) => {
      // Ajuste de la ruta según tu estructura de carpetas
      const photoPath = path.join(__dirname, '../../', photo.filepath);
      
      if (fs.existsSync(photoPath)) {
        try {
          doc.image(photoPath, x, y, { width: 230, height: 170 });
          doc.fontSize(8).text(photo.tipo || 'Imagen', x, y + 175);
          
          if (index % 2 === 0) {
            x = 310; // Segunda columna
          } else {
            x = 50; // Nueva fila
            y += 200;
          }

          if (y > 650) {
            doc.addPage();
            y = 50;
          }
        } catch (e) { console.error("Error al insertar imagen:", e); }
      }
    });
  }

  doc.end();
};

// Función auxiliar para títulos de sección estéticos
function renderSectionHeader(doc, title) {
  doc.rect(50, doc.y, 500, 18).fill('#f2f2f2');
  doc.fillColor('#000').fontSize(11).text(title, 55, doc.y - 14, { b: true });
  doc.moveDown(0.5);
}