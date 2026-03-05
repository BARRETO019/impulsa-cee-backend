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

// --- 2. DATOS EDIFICIO (Ajustado a StepGeneral del Wizard) ---
exports.saveBuildingData = async (req, res) => {
  try {
    const { id } = req.params;
    const { zona_climatica, normativa, referencia_catastral, superficie_habitable, ano_construccion, motivo_certificado, alturas_plantas, num_plantas } = req.body;
    
    // Actualizamos la tabla principal de visits y la de building
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

// --- 3. ENVOLVENTE (Ajustado a StepEnvelope) ---
exports.addEnvelopeElement = async (req, res) => {
  try {
    const { tipo, orientacion, superficie, transmitancia } = req.body;
    // IMPORTANTE: Tu tabla en Neon NO tiene 'observaciones', así que lo omitimos
    const query = `INSERT INTO visit_envelope (visit_id, tipo, nombre, superficie, orientacion, transmitancia) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
    const result = await pool.query(query, [req.params.id, tipo, tipo, superficie || 0, orientacion, transmitancia || 0]);
    res.status(201).json(result.rows[0]);
  } catch (error) { res.status(500).json({ error: "Error en envolvente" }); }
};

exports.getEnvelope = async (req, res) => {
  const result = await pool.query(`SELECT * FROM visit_envelope WHERE visit_id = $1`, [req.params.id]);
  res.json(result.rows);
};

// --- 4. VENTANAS (Ajustado a StepWindows) ---
exports.addWindow = async (req, res) => {
  try {
    const { nombre, marco, vidrio, superficie } = req.body;
    const result = await pool.query(
      `INSERT INTO visit_windows (visit_id, nombre, superficie, orientacion, marco, vidrio) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.params.id, nombre, superficie || 0, 'Norte', marco, vidrio]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) { res.status(500).json({ error: "Error en ventana" }); }
};

exports.getWindows = async (req, res) => {
  const result = await pool.query(`SELECT * FROM visit_windows WHERE visit_id = $1`, [req.params.id]);
  res.json(result.rows);
};

// --- 5. INSTALACIONES (Ajustado a StepInstallations) ---
exports.addInstallation = async (req, res) => {
  try {
    const { tipo, energia, marca_modelo, potencia, ano_aprox } = req.body;
    // Mapeamos lo que viene del Wizard a lo que tienes en Neon
    const query = `
      INSERT INTO visit_installations (visit_id, tipo, combustible, generador, potencia_nominal, ano_instalacion) 
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
    const result = await pool.query(query, [req.params.id, tipo, energia, marca_modelo, potencia || 0, ano_aprox || 0]);
    res.status(201).json(result.rows[0]);
  } catch (error) { res.status(500).json({ error: "Error en instalación" }); }
};

exports.getInstallations = async (req, res) => {
  const result = await pool.query(`SELECT * FROM visit_installations WHERE visit_id = $1`, [req.params.id]);
  res.json(result.rows);
};

// --- 6. FOTOS Y FINALIZACIÓN ---
exports.uploadPhoto = async (req, res) => {
  try {
    const files = req.files || [];
    const inserted = [];
    for (const file of files) {
      const result = await pool.query(`INSERT INTO visit_photos (visit_id, filename, filepath, tipo) VALUES ($1,$2,$3,$4) RETURNING *`, 
      [req.params.id, file.filename, file.path, "general"]);
      inserted.push(result.rows[0]);
    }
    res.status(201).json(inserted);
  } catch (error) { res.status(500).json({ error: "Error en fotos" }); }
};

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
  await pool.query(`UPDATE visits SET estado = 'finalizada' WHERE id = $1`, [req.params.id]);
  res.json({ message: "Finalizada" });
};
exports.deleteVisit = async (req, res) => {
  await pool.query(`DELETE FROM visits WHERE id = $1`, [req.params.id]);
  res.json({ message: "Borrada" });
};