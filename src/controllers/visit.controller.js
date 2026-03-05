const driveService = require('../services/drive.service'); 
const fs = require('fs');
const path = require('path');
const pool = require('../config/db'); 
const pdfService = require('../services/pdf.service');

// --- 1. GESTIÓN DE VISITAS ---
exports.createVisit = async (req, res) => {
  try {
    const { cliente, municipio, provincia, direccion } = req.body;
    const query = `INSERT INTO visits (tecnico_id, direccion, municipio, provincia, estado, superficie) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
    const result = await pool.query(query, [
      req.user.id, 
      direccion || cliente || "Sin Nombre", 
      municipio || "N/A", 
      provincia || "N/A", 
      'borrador',
      0
    ]);
    res.status(201).json(result.rows[0]);
  } catch (error) { res.status(500).json({ error: error.message }); }
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
    const { zona_climatica, normativa, referencia_catastral, superficie_habitable, ano_construccion, motivo_certificado, alturas_plantas, num_plantas } = req.body;
    
    await pool.query(
      `UPDATE visits SET ano_construccion=$1, motivo_certificado=$2, num_plantas=$3, alturas_plantas=$4 WHERE id=$5`,
      [ano_construccion, motivo_certificado, num_plantas, alturas_plantas, id]
    );

    const query = `
      INSERT INTO visit_building (visit_id, zona_climatica, normativa, referencia_catastral, superficie_habitable) 
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (visit_id) 
      DO UPDATE SET zona_climatica=EXCLUDED.zona_climatica, normativa=EXCLUDED.normativa, referencia_catastral=EXCLUDED.referencia_catastral, superficie_habitable=EXCLUDED.superficie_habitable`;
    
    await pool.query(query, [id, zona_climatica, normativa || 'NBE-CT-79', referencia_catastral || '', superficie_habitable || 0]);
    res.json({ message: "Edificio guardado" });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// --- 3. ENVOLVENTE ---
exports.addEnvelopeElement = async (req, res) => {
  try {
    const { tipo, orientacion, superficie, transmitancia } = req.body;
    const query = `INSERT INTO visit_envelope (visit_id, tipo, nombre, superficie, orientacion, transmitancia) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
    const result = await pool.query(query, [req.params.id, tipo, tipo, superficie || 0, orientacion, transmitancia || 0]);
    res.status(201).json(result.rows[0]);
  } catch (error) { res.status(500).json({ error: "Error en envolvente" }); }
};

exports.getEnvelope = async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM visit_envelope WHERE visit_id = $1`, [req.params.id]);
    res.json(result.rows);
  } catch (error) { res.status(500).json({ error: "Error obteniendo envolvente" }); }
};

// --- 4. VENTANAS ---
exports.addWindow = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, marco, vidrio, superficie } = req.body;
    const query = `INSERT INTO visit_windows (visit_id, nombre, superficie, orientacion, marco, vidrio) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
    const result = await pool.query(query, [id, nombre || "Ventana", parseFloat(superficie) || 0, "N/A", marco || "No especificado", vidrio || "No especificado"]);
    res.status(201).json(result.rows[0]);
  } catch (error) { res.status(500).json({ error: "Error al guardar la ventana" }); }
};

exports.getWindows = async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM visit_windows WHERE visit_id = $1`, [req.params.id]);
    res.json(result.rows);
  } catch (error) { res.status(500).json({ error: "Error obteniendo ventanas" }); }
};

// --- 5. INSTALACIONES ---
exports.addInstallation = async (req, res) => {
  try {
    const { tipo, energia, marca_modelo, potencia, ano_aprox } = req.body;
    const query = `INSERT INTO visit_installations (visit_id, tipo, combustible, generador, potencia_nominal, ano_instalacion) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
    const result = await pool.query(query, [req.params.id, tipo, energia || "No especificado", marca_modelo || "Genérico", parseFloat(potencia) || 0, parseInt(ano_aprox) || 0]);
    res.status(201).json(result.rows[0]);
  } catch (error) { res.status(500).json({ error: "Error al guardar instalación" }); }
};

exports.getInstallations = async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM visit_installations WHERE visit_id = $1`, [req.params.id]);
    res.json(result.rows);
  } catch (error) { res.status(500).json({ error: "Error obteniendo instalaciones" }); }
};

// --- 6. FOTOS (Subida a Drive) ---
exports.uploadPhoto = async (req, res) => {
  try {
    const { id } = req.params;
    const files = req.files; 
    if (!files || files.length === 0) return res.status(400).json({ error: "No hay fotos" });

    const folderId = await driveService.getOrCreateClientFolder(`Visita_${id}`);
    const savedPhotos = [];

    for (const file of files) {
      const driveFileId = await driveService.uploadFile(file.path, file.filename, folderId);
      const result = await pool.query(
        `INSERT INTO visit_photos (visit_id, filename, filepath, tipo) VALUES ($1, $2, $3, $4) RETURNING *`,
        [id, file.originalname, driveFileId, 'general']
      );
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      savedPhotos.push(result.rows[0]);
    }
    res.status(201).json({ message: "Subido a Drive", count: savedPhotos.length });
  } catch (error) { res.status(500).json({ error: "Error en Drive" }); }
};

// --- 7. EXPORTACIÓN Y FINALIZACIÓN ---
exports.exportPDF = async (req, res) => {
  try {
    const id = req.params.id;
    const data = {
      visit: (await pool.query(`SELECT * FROM visits WHERE id = $1`, [id])).rows[0],
      building: (await pool.query(`SELECT * FROM visit_building WHERE visit_id = $1`, [id])).rows[0],
      envelope: (await pool.query(`SELECT * FROM visit_envelope WHERE visit_id = $1`, [id])).rows,
      windows: (await pool.query(`SELECT * FROM visit_windows WHERE visit_id = $1`, [id])).rows,
      installations: (await pool.query(`SELECT * FROM visit_installations WHERE visit_id = $1`, [id])).rows,
      photos: (await pool.query(`SELECT * FROM visit_photos WHERE visit_id = $1`, [id])).rows
    };
    pdfService.generatePDF(res, data);
  } catch (error) { res.status(500).json({ error: "Error PDF" }); }
};

exports.exportXML = async (req, res) => res.json({ message: "XML no implementado" });

exports.finalizeVisit = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 1. Marcar como finalizada en Neon
    await pool.query(`UPDATE visits SET estado = 'finalizada' WHERE id = $1`, [id]);

    // 2. Obtener datos
    const data = {
      visit: (await pool.query(`SELECT * FROM visits WHERE id = $1`, [id])).rows[0],
      building: (await pool.query(`SELECT * FROM visit_building WHERE visit_id = $1`, [id])).rows[0],
      envelope: (await pool.query(`SELECT * FROM visit_envelope WHERE visit_id = $1`, [id])).rows,
      windows: (await pool.query(`SELECT * FROM visit_windows WHERE visit_id = $1`, [id])).rows,
      installations: (await pool.query(`SELECT * FROM visit_installations WHERE visit_id = $1`, [id])).rows,
      photos: (await pool.query(`SELECT * FROM visit_photos WHERE visit_id = $1`, [id])).rows
    };

    // 3. Obtener carpeta de Drive
    const folderId = await driveService.getOrCreateClientFolder(`Visita_${id}`);

    // 4. PDF a Drive
    const pdfPath = path.join(__dirname, `../../temp_report_${id}.pdf`);
    await pdfService.createPDFFile(data, pdfPath); // Asegúrate de que esta función guarde el archivo en pdfPath
    await driveService.uploadFile(pdfPath, `Informe_Visita_${id}.pdf`, folderId);
    if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);

    // 5. XML a Drive (Simulado si no tienes servicio)
    const xmlPath = path.join(__dirname, `../../temp_data_${id}.xml`);
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?><visita id="${id}"><estado>finalizada</estado></visita>`;
    fs.writeFileSync(xmlPath, xmlContent);
    await driveService.uploadFile(xmlPath, `Datos_Visita_${id}.xml`, folderId);
    if (fs.existsSync(xmlPath)) fs.unlinkSync(xmlPath);

    res.json({ message: "Visita finalizada y documentos subidos a Drive" });
  } catch (error) {
    console.error("Error al finalizar:", error);
    res.status(500).json({ error: "No se pudo finalizar o subir documentos" });
  }
};

// --- 8. ELIMINAR ---
exports.deleteVisit = async (req, res) => {
  try {
    await pool.query(`DELETE FROM visits WHERE id = $1`, [req.params.id]);
    res.json({ message: "Borrada" });
  } catch (error) { res.status(500).json({ error: "Error al borrar" }); }
};