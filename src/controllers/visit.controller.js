const driveService = require('../services/drive.service'); 
const airtableService = require('../services/airtable.service');
const fs = require('fs');
const path = require('path');
const pool = require('../config/db'); 
const pdfService = require('../services/pdf.service');

// Función auxiliar para obtener el nombre de la carpeta (Cliente/Dirección)
async function getFolderName(visitId) {
    const result = await pool.query('SELECT direccion FROM visits WHERE id = $1', [visitId]);
    return result.rows.length > 0 ? result.rows[0].direccion : `Visita_${visitId}`;
}

// --- 1. GESTIÓN DE VISITAS ---
exports.createVisit = async (req, res) => {
  try {
    const { cliente, municipio, provincia, direccion, airtable_id } = req.body;
    
    const query = `INSERT INTO visits (tecnico_id, direccion, municipio, provincia, estado, superficie) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
    const result = await pool.query(query, [
      req.user.id, 
      direccion || cliente || "Sin Nombre", 
      municipio || "N/A", 
      provincia || "N/A", 
      'borrador',
      0
    ]);

    const newVisit = result.rows[0];

    if (airtable_id && airtableService.updateEstado) {
      try {
        await airtableService.updateEstado(airtable_id, "5. En curso");
        console.log(`Airtable ${airtable_id} actualizado a En curso ✅`);
      } catch (atError) {
        console.error("Error Airtable (No bloqueante):", atError.message);
      }
    }

    res.status(201).json(newVisit);
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
};

exports.getMyVisits = async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM visits WHERE tecnico_id = $1 ORDER BY created_at DESC`, [req.user.id]);
    res.json(result.rows);
  } catch (error) { res.status(500).json({ error: "Error obteniendo visitas" }); }
};

// --- 2. DATOS EDIFICIO ---
exports.saveBuildingData = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      zona_climatica, normativa, referencia_catastral, superficie_habitable, 
      ano_construccion, motivo_certificado, alturas_plantas, num_plantas, potencia_instalada 
    } = req.body;
    
    await pool.query(
      `UPDATE visits SET ano_construccion=$1, motivo_certificado=$2, num_plantas=$3, alturas_plantas=$4, potencia_instalada=$5 WHERE id=$6`,
      [ano_construccion, motivo_certificado, num_plantas, alturas_plantas, potencia_instalada || null, id]
    );

    const query = `
      INSERT INTO visit_building (visit_id, zona_climatica, normativa, referencia_catastral, superficie_habitable) 
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (visit_id) 
      DO UPDATE SET 
        zona_climatica=EXCLUDED.zona_climatica, normativa=EXCLUDED.normativa, 
        referencia_catastral=EXCLUDED.referencia_catastral, superficie_habitable=EXCLUDED.superficie_habitable`;
    
    await pool.query(query, [id, zona_climatica, normativa || 'NBE-CT-79', referencia_catastral || '', superficie_habitable || 0]);

    res.json({ message: "Edificio y visita actualizados correctamente" });
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
};

// --- 3. ENVOLVENTE ---
exports.addEnvelopeElement = async (req, res) => {
  try {
    const { tipo, orientacion, superficie, transmitancia, largo, ancho, alto } = req.body;
    const query = `INSERT INTO visit_envelope (visit_id, tipo, nombre, superficie, orientacion, transmitancia, largo, ancho, alto) 
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`;
    
    const result = await pool.query(query, [req.params.id, tipo, tipo, superficie || 0, orientacion, transmitancia || 0, largo || 0, ancho || 0, alto || 0]);
    res.status(201).json(result.rows[0]);
  } catch (error) { res.status(500).json({ error: "Error en envolvente" }); }
};

exports.getEnvelope = async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM visit_envelope WHERE visit_id = $1`, [req.params.id]);
    res.json(result.rows);
  } catch (error) { res.status(500).json({ error: "Error obteniendo envolvente" }); }
};

exports.deleteEnvelopeElement = async (req, res) => {
  const { id, elementoId } = req.params;
  try {
    const result = await pool.query('DELETE FROM visit_envelope WHERE id = $1 AND visit_id = $2 RETURNING *', [elementoId, id]);
    if (result.rowCount === 0) return res.status(404).json({ error: "No encontrado" });
    res.json({ message: "Borrado correctamente" });
  } catch (error) { res.status(500).json({ error: "Error al borrar" }); }
};

// --- 4. VENTANAS (Corregido para Drive con nombre cliente) ---
exports.addWindow = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 1. Recogemos todos los campos (Dimensiones, CE3X y Sombras)
    const { 
      nombre, 
      marco, 
      vidrio, 
      superficie, 
      orientacion, 
      proteccion_solar, 
      largo, 
      alto,
      retranqueo, // 🆕 Nuevo
      voladizo    // 🆕 Nuevo
    } = req.body; 
    
    // 2. Actualizamos la QUERY para incluir las nuevas columnas de sombras
    const query = `
      INSERT INTO visit_windows (
        visit_id, nombre, superficie, orientacion, marco, vidrio, 
        proteccion_solar, largo, alto, retranqueo, voladizo
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
      RETURNING *`;
    
    // 3. Pasamos los valores al array de parámetros (asegurando que sean números)
    const result = await pool.query(query, [
      id, 
      nombre || "Ventana", 
      parseFloat(superficie) || 0, 
      orientacion || "No especificada", 
      marco || "No especificado", 
      vidrio || "No especificado",
      proteccion_solar || "Sin protección",
      parseFloat(largo) || 0,
      parseFloat(alto) || 0,
      parseFloat(retranqueo) || 0, // 🆕 Valor por defecto 0
      parseFloat(voladizo) || 0    // 🆕 Valor por defecto 0
    ]);
    
    const nuevaVentana = result.rows[0];

    // --- Lógica de Fotos en Drive ---
    if (req.files && req.files.length > 0) {
      const folderName = await getFolderName(id);
      for (const file of req.files) {
        const driveFileId = await driveService.uploadFile(file.path, file.filename, folderName);
        await pool.query(
          `INSERT INTO visit_photos (visit_id, filename, filepath, tipo) VALUES ($1, $2, $3, $4)`, 
          [id, file.originalname, driveFileId, `ventana_${nuevaVentana.id}`]
        );
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      }
    }

    res.status(201).json(nuevaVentana);
  } catch (error) { 
    console.error("Error al guardar ventana:", error);
    res.status(500).json({ error: "Error al guardar ventana" }); 
  }
};
exports.getWindows = async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM visit_windows WHERE visit_id = $1`, [req.params.id]);
    res.json(result.rows);
  } catch (error) { res.status(500).json({ error: "Error obteniendo ventanas" }); }
};

// --- 5. INSTALACIONES (Corregido para Drive con nombre cliente) ---
exports.addInstallation = async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo, energia, marca_modelo, potencia, ano_aprox } = req.body;
    
    const query = `INSERT INTO visit_installations (visit_id, tipo, combustible, generador, potencia_nominal, ano_instalacion) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
    const result = await pool.query(query, [id, tipo, energia || "No especificado", marca_modelo || "Genérico", parseFloat(potencia) || 0, parseInt(ano_aprox) || 0]);
    const nuevaInstalacion = result.rows[0];

    if (req.files && req.files.length > 0) {
      const folderName = await getFolderName(id);
      for (const file of req.files) {
        const driveFileId = await driveService.uploadFile(file.path, file.filename, folderName);
        await pool.query(`INSERT INTO visit_photos (visit_id, filename, filepath, tipo) VALUES ($1, $2, $3, $4)`, [id, file.originalname, driveFileId, `instalacion_${nuevaInstalacion.id}`]);
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      }
    }
    res.status(201).json(nuevaInstalacion);
  } catch (error) { res.status(500).json({ error: "Error al guardar instalación" }); }
};

exports.getInstallations = async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM visit_installations WHERE visit_id = $1`, [req.params.id]);
    res.json(result.rows);
  } catch (error) { res.status(500).json({ error: "Error obteniendo instalaciones" }); }
};
// --- 6. FOTOS GENERALES (Corregido para Drive con nombre cliente) ---
exports.uploadPhoto = async (req, res) => {
  try {
    const { id } = req.params;
    const files = req.files; 
    if (!files || files.length === 0) return res.status(400).json({ error: "No hay fotos" });

    const folderName = await getFolderName(id);
    const savedPhotos = [];

    for (const file of files) {
      const driveFileId = await driveService.uploadFile(file.path, file.filename, folderName);
      const result = await pool.query(`INSERT INTO visit_photos (visit_id, filename, filepath, tipo) VALUES ($1, $2, $3, $4) RETURNING *`, [id, file.originalname, driveFileId, 'general']);
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      savedPhotos.push(result.rows[0]);
    }
    res.status(201).json({ message: "Subido a Drive", count: savedPhotos.length });
  } catch (error) { res.status(500).json({ error: "Error en Drive" }); }
};
// --- 7. EXPORTACIÓN Y FINALIZACIÓN ---
exports.exportPDF = async (req, res) => {
  try {
    const data = await getFullVisitData(req.params.id);
    pdfService.generatePDF(res, data);
  } catch (error) { res.status(500).json({ error: "Error PDF" }); }
};

exports.exportXML = async (req, res) => res.json({ message: "XML no implementado" });

exports.finalizeVisit = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(`UPDATE visits SET estado = 'finalizada' WHERE id = $1`, [id]);
    res.json({ message: "Visita finalizada. Generando documentos..." });
    generateDocumentsInBackground(id);
  } catch (error) { res.status(500).json({ error: "No se pudo finalizar" }); }
};

// Función auxiliar para obtener datos completos
async function getFullVisitData(id) {
  const visit = (await pool.query(`SELECT * FROM visits WHERE id = $1`, [id])).rows[0];
  const building = (await pool.query(`SELECT * FROM visit_building WHERE visit_id = $1`, [id])).rows[0];
  const envelope = (await pool.query(`SELECT * FROM visit_envelope WHERE visit_id = $1`, [id])).rows;
  const windows = (await pool.query(`SELECT * FROM visit_windows WHERE visit_id = $1`, [id])).rows;
  const installations = (await pool.query(`SELECT * FROM visit_installations WHERE visit_id = $1`, [id])).rows;
  const photos = (await pool.query(`SELECT * FROM visit_photos WHERE visit_id = $1`, [id])).rows;
  return { visit, building, envelope, windows, installations, photos };
}

// --- 8. ELIMINAR ---
exports.deleteVisit = async (req, res) => {
  try {
    await pool.query(`DELETE FROM visits WHERE id = $1`, [req.params.id]);
    res.json({ message: "Borrada" });
  } catch (error) { res.status(500).json({ error: "Error al borrar" }); }
};

// --- GENERACIÓN DE DOCUMENTOS (Corregido con nombre cliente y carpeta maestra) ---
async function generateDocumentsInBackground(id) {
  try {
    const data = await getFullVisitData(id);
    const folderName = data.visit.direccion || `Cliente_${id}`;

    // --- PDF ---
    const pdfPath = path.join(__dirname, `../../temp_report_${id}.pdf`);
    await pdfService.createPDFFile(data, pdfPath);
    await driveService.uploadFile(pdfPath, `Informe_${folderName}.pdf`, folderName);
    if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);

    // --- XML ---
    const xmlPath = path.join(__dirname, `../../temp_data_${id}.xml`);
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?><visita id="${id}"><cliente>${folderName}</cliente></visita>`;
    fs.writeFileSync(xmlPath, xmlContent);
    await driveService.uploadFile(xmlPath, `Datos_${folderName}.xml`, folderName);
    if (fs.existsSync(xmlPath)) fs.unlinkSync(xmlPath);

    console.log(`Documentos generados para ${folderName} ✅`);
  } catch (error) {
    console.error("Error generando documentos:", error);
  }
}