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

  // --- CABECERA Y LOGO ---
  // Usamos una ruta más segura para el logo
  const logoPath = path.resolve(__dirname, '../assets/logo.png');
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, 50, 40, { width: 50 });
  }

  doc.fillColor('#004a99').fontSize(20).font('Helvetica-Bold').text('IMPULSA ENERGÍA', 110, 45);
  doc.fillColor('#666666').fontSize(10).font('Helvetica').text('Informe de Toma de Datos - Certificación Energética', 110, 68);
  
  doc.moveTo(50, 95).lineTo(550, 95).strokeColor('#004a99').lineWidth(2).stroke();
  doc.moveDown(3);

  // --- 1. DATOS DEL INMUEBLE Y VISITA ---
  renderSectionHeader(doc, '1. DATOS DEL INMUEBLE Y VISITA');
  
  doc.fontSize(10).fillColor('#000').font('Helvetica-Bold');
  const startY = doc.y;
  
  doc.text('Dirección:', 50, startY).font('Helvetica').text(visit.direccion || '-', 135, startY);
  doc.font('Helvetica-Bold').text('Municipio:', 50, doc.y + 5).font('Helvetica').text(`${visit.municipio || '-'} (${visit.provincia || '-'})`, 135, doc.y - 10);
  doc.font('Helvetica-Bold').text('Motivo:', 50, doc.y + 5).font('Helvetica').text(visit.motivo_certificado || 'Certificación', 135, doc.y - 10);
  doc.font('Helvetica-Bold').text('Ref. Catastral:', 50, doc.y + 5).font('Helvetica').text(building?.referencia_catastral || '-', 135, doc.y - 10);

  doc.font('Helvetica-Bold').text('Año Const.:', 320, startY).font('Helvetica').text(visit.ano_construccion || '-', 410, startY);
  doc.font('Helvetica-Bold').text('Nº Plantas:', 320, doc.y + 5).font('Helvetica').text(`${visit.num_plantas || 1}`, 410, doc.y - 10);
  doc.font('Helvetica-Bold').text('Alt. Plantas:', 320, doc.y + 5).font('Helvetica').text(`${visit.alturas_plantas || '-'} m`, 410, doc.y - 10);
  doc.font('Helvetica-Bold').text('Sup. Útil:', 320, doc.y + 5).font('Helvetica').text(`${building?.superficie_habitable || 0} m²`, 410, doc.y - 10);
  
  if (visit.potencia_instalada) {
    doc.font('Helvetica-Bold').fillColor('#d4a017').text('Pot. Solar:', 320, doc.y + 5)
       .font('Helvetica').fillColor('#000').text(`${visit.potencia_instalada} kW`, 410, doc.y - 10);
  }
  
  doc.moveDown(2.5);

  // --- 2. ENVOLVENTE Y PARTICIONES ---
  renderSectionHeader(doc, '2. FACHADAS, ENVOLVENTE Y PARTICIONES');

  if (envelope && envelope.length > 0) {
    envelope.forEach(e => {
      const esParticion = e.tipo?.toLowerCase().includes('partición') || e.tipo?.toLowerCase().includes('interior');
      doc.fontSize(10).font('Helvetica-Bold').fillColor(esParticion ? '#555555' : '#000')
         .text(`• ${e.tipo || 'Elemento'}${esParticion ? ' (P. Interior)' : ''}`, { indent: 10 });
      doc.fontSize(9).font('Helvetica').fillColor('#444')
         .text(`Dimensiones: ${e.largo || 0}m (L) x ${e.alto || 0}m (H) | Espesor: ${e.ancho || 0}m`, { indent: 20 });
      doc.text(`Superficie: ${e.superficie || 0} m² | Transmitancia (U): ${e.transmitancia || '-'} | Orientación: ${e.orientacion || 'N/A'}`, { indent: 20 });
      doc.moveDown(0.6);
    });
  } else {
    doc.fontSize(10).text('No se han registrado elementos de envolvente.', { indent: 10 });
  }
  doc.moveDown(1.5);

  // --- 3. HUECOS Y VENTANAS ---
  renderSectionHeader(doc, '3. HUECOS Y ACRISTALAMIENTOS');
  if (!windows || windows.length === 0) {
    doc.fontSize(10).text('No se han registrado huecos.');
  } else {
    windows.forEach(w => {
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#000').text(`• ${w.nombre || 'Ventana'}`);
      
      const dimVentana = (w.largo && w.alto) ? `${w.largo}m x ${w.alto}m` : `${w.superficie} m² (Total)`;

      doc.fontSize(9).font('Helvetica').fillColor('#444')
         .text(`Fachada/Orientación: ${w.orientacion || 'No especificada'} | Dim: ${dimVentana}`, { indent: 15 });
      doc.text(`Marco: ${w.marco || '-'} | Vidrio: ${w.vidrio || '-'}`, { indent: 15 });
      
      // LA CORRECCIÓN ESTÁ AQUÍ: La línea debe estar DENTRO del forEach
      doc.font('Helvetica-Bold').fillColor('#c0392b')
         .text(`Protección Solar (CE3X): ${w.proteccion_solar || 'Sin protección'}`, { indent: 15 });
      
      const tieneFoto = photos?.some(p => p.tipo === `ventana_${w.id}`);
      if (tieneFoto) doc.fontSize(8).fillColor('#007bff').text('[ Foto vinculada en Drive ]', { indent: 15 });
      
      doc.fillColor('#000').moveDown(0.8);
    });
  }
  doc.moveDown(1);

  // --- 4. INSTALACIONES TÉRMICAS ---
  renderSectionHeader(doc, '4. INSTALACIONES TÉRMICAS');
  if (!installations || installations.length === 0) {
    doc.fontSize(10).text('No se han registrado sistemas térmicos.');
  } else {
    installations.forEach(i => {
      doc.fontSize(10).font('Helvetica-Bold').text(`• ${i.tipo || 'Sistema'} - ${i.combustible || '-'}`);
      doc.fontSize(9).font('Helvetica').text(`Generador/Modelo: ${i.generador || 'Genérico'} | Potencia: ${i.potencia_nominal || 0} kW | Año: ${i.ano_instalacion || '-'}`, { indent: 15 });
      
      const tieneFoto = photos?.some(p => p.tipo === `instalacion_${i.id}`);
      if (tieneFoto) doc.fontSize(8).fillColor('#007bff').text('[ Foto de placa técnica en Drive ]', { indent: 15 }).fillColor('#000');
      doc.moveDown(0.5);
    });
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