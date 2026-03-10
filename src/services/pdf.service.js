const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// --- FUNCIÓN AUXILIAR PARA DIBUJAR SECCIONES ---
function renderSectionHeader(doc, title) {
  const currentY = doc.y;
  doc.rect(50, currentY, 500, 20).fill('#eeeeee');
  doc.fillColor('#333333').fontSize(11).font('Helvetica-Bold').text(title, 60, currentY + 5);
  doc.moveDown(1.5);
}

// --- FUNCIÓN PRINCIPAL DE DIBUJO ---
const drawPDFContent = (doc, data) => {
  const { visit, building, envelope, windows, installations, photos } = data;

  // --- CABECERA ---
  const logoPath = path.join(__dirname, '../assets/logo.png');
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, 50, 40, { width: 50 });
  }

  doc.fillColor('#004a99').fontSize(20).font('Helvetica-Bold').text('IMPULSA ENERGÍA', 110, 45);
  doc.fillColor('#666666').fontSize(10).font('Helvetica').text('Informe de Toma de Datos - Certificación Energética', 110, 68);
  
  doc.moveTo(50, 95).lineTo(550, 95).strokeColor('#004a99').lineWidth(2).stroke();
  doc.moveDown(3);

  // --- 1. DATOS DEL INMUEBLE ---
  renderSectionHeader(doc, '1. DATOS DEL INMUEBLE Y VISITA');
  
  doc.fontSize(10).fillColor('#000').font('Helvetica-Bold');
  const startY = doc.y;
  
  // Columna Izquierda
  doc.text('Dirección:', 50, startY).font('Helvetica').text(visit.direccion || '-', 130, startY);
  doc.font('Helvetica-Bold').text('Municipio:', 50, doc.y + 5).font('Helvetica').text(`${visit.municipio} (${visit.provincia})`, 130, doc.y - 10);
  doc.font('Helvetica-Bold').text('Motivo:', 50, doc.y + 5).font('Helvetica').text(visit.motivo_certificado || 'Certificación Ordinaria', 130, doc.y - 10);

  // Columna Derecha (a partir de x=320)
  doc.font('Helvetica-Bold').text('Año Const.:', 320, startY).font('Helvetica').text(visit.ano_construccion || '-', 400, startY);
  doc.font('Helvetica-Bold').text('Dormitorios:', 320, doc.y + 5).font('Helvetica').text(visit.dormitorios || '0', 400, doc.y - 10);
  doc.font('Helvetica-Bold').text('Sup. Útil:', 320, doc.y + 5).font('Helvetica').text(`${visit.superficie || 0} m²`, 400, doc.y - 10);
  
  doc.moveDown(2);

  // --- 2. FACHADAS Y ORIENTACIONES (Nuevo!) ---
  renderSectionHeader(doc, '2. FACHADAS Y ENVOLVENTE');
  
  // Agrupamos fotos de fachadas
  const fotosFachadas = photos?.filter(p => p.tipo.includes('fachada')) || [];
  if (fotosFachadas.length > 0) {
    doc.fontSize(10).font('Helvetica-Bold').text('Registros fotográficos de fachada:', 50);
    doc.moveDown(0.5);
    // Nota: Aquí iría la lógica de insertar imágenes si estuvieran locales o descargadas.
    doc.font('Helvetica').fontSize(9).text(`Se han registrado ${fotosFachadas.length} orientaciones de fachada.`);
  }

  if (envelope && envelope.length > 0) {
    envelope.forEach(e => {
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#000').text(`• ${e.tipo}`, { indent: 10 });
      doc.font('Helvetica').fillColor('#444').text(`Superficie: ${e.superficie}m² | U-val: ${e.transmitancia || '-'} | Orientación: ${e.orientacion}`, { indent: 20 });
    });
  }
  doc.moveDown(1.5);

  // --- 3. HUECOS Y VENTANAS (Con vinculación de fotos) ---
  renderSectionHeader(doc, '3. HUECOS Y ACRISTALAMIENTOS');
  if (!windows || windows.length === 0) {
    doc.fontSize(10).text('No se han registrado huecos.');
  } else {
    windows.forEach(w => {
      doc.fontSize(10).font('Helvetica-Bold').text(`• ${w.nombre}`, { b: true });
      doc.fontSize(9).font('Helvetica').text(`Dimensiones/Sup: ${w.superficie} m² | Marco: ${w.marco} | Vidrio: ${w.vidrio}`, { indent: 15 });
      
      // Buscamos si esta ventana tiene foto (vinculada por tipo 'ventana_ID')
      const tieneFoto = photos.some(p => p.tipo === `ventana_${w.id}`);
      if (tieneFoto) doc.fontSize(8).fillColor('#007bff').text('[ Foto adjunta en anexo ]', { indent: 15 }).fillColor('#000');
      doc.moveDown(0.5);
    });
  }
  doc.moveDown(1);

  // --- 4. INSTALACIONES TÉRMICAS ---
  renderSectionHeader(doc, '4. INSTALACIONES TÉRMICAS');
  if (!installations || installations.length === 0) {
    doc.fontSize(10).text('No se han registrado sistemas térmicos.');
  } else {
    installations.forEach(i => {
      doc.fontSize(10).font('Helvetica-Bold').text(`• ${i.tipo} - ${i.combustible}`);
      doc.fontSize(9).font('Helvetica').text(`Modelo: ${i.generador} | Potencia: ${i.potencia_nominal} kW | Año: ${i.ano_instalacion}`, { indent: 15 });
      
      const tieneFoto = photos.some(p => p.tipo === `instalacion_${i.id}`);
      if (tieneFoto) doc.fontSize(8).fillColor('#007bff').text('[ Foto de placa técnica adjunta ]', { indent: 15 }).fillColor('#000');
      doc.moveDown(0.5);
    });
  }

  // --- 5. ANEXO FOTOGRÁFICO (Si hay fotos locales) ---
  // IMPORTANTE: PDFKit necesita que las imágenes estén en el disco del servidor para doc.image()
  const fotosGenerales = photos?.filter(p => p.tipo === 'general') || [];
  if (fotosGenerales.length > 0) {
    doc.addPage();
    renderSectionHeader(doc, '5. ANEXO FOTOGRÁFICO');
    // Aquí podrías iterar y usar doc.image(path_local) si las descargas de Drive antes
  }

  doc.end();
};

// --- EXPORTS ---
exports.generatePDF = (res, data) => {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=Informe_Visita_${data.visit.id}.pdf`);
  doc.pipe(res);
  drawPDFContent(doc, data);
};

exports.createPDFFile = (data, outputPath) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);
    drawPDFContent(doc, data);
    stream.on('finish', () => resolve(outputPath));
    stream.on('error', reject);
  });
};