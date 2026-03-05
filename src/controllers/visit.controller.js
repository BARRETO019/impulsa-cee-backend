const pool = require('../config/db');
const pdfService = require('../services/pdf.service');

// --- 1. GESTIÓN DE VISITAS ---
exports.createVisit = async (req, res) => {
  try {
    const { cliente, municipio, provincia } = req.body;
    const query = `INSERT INTO visits (tecnico_id, direccion, municipio, provincia, estado) VALUES ($1, $2, $3, $4, $5) RETURNING *`;
    const result = await pool.query(query, [req.user.id, cliente || "Sin Nombre", municipio || "N/A", provincia || "Madrid", 'borrador']);
    res.status(201).json(result.rows[0]);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.getMyVisits = async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM visits WHERE tecnico_id = $1 ORDER BY created_at DESC`, [req.user.id]);
    res.json(result.rows);
  } catch (error) { res.status(500).json({ error: "Error obteniendo visitas" }); }
};

// --- 2. DATOS EDIFICIO (PUT /:id/building) ---
exports.saveBuildingData = async (req, res) => {
  try {
    const { id } = req.params;
    const { zona_climatica, normativa, referencia_catastral, superficie_habitable } = req.body;
    const existing = await pool.query(`SELECT * FROM visit_building WHERE visit_id = $1`, [id]);
    if (existing.rows.length > 0) {
      await pool.query(`UPDATE visit_building SET zona_climatica=$1, normativa=$2, referencia_catastral=$3, superficie_habitable=$4 WHERE visit_id=$5`, 
      [zona_climatica, normativa, referencia_catastral, superficie_habitable, id]);
    } else {
      await pool.query(`INSERT INTO visit_building (visit_id, zona_climatica, normativa, referencia_catastral, superficie_habitable) VALUES ($1,$2,$3,$4,$5)`, 
      [id, zona_climatica, normativa, referencia_catastral, superficie_habitable]);
    }
    res.json({ message: "Edificio guardado" });
  } catch (error) { res.status(500).json({ error: "Error en edificio" }); }
};

// --- 3. ENVOLVENTE (POST /:id/envelope) ---
exports.addEnvelopeElement = async (req, res) => {
  try {
    const { tipo, nombre, superficie, orientacion } = req.body;
    // Solo usamos los campos básicos que estamos seguros que existen en tu tabla
    const query = `
      INSERT INTO visit_envelope (visit_id, tipo, nombre, superficie, orientacion) 
      VALUES ($1, $2, $3, $4) 
      RETURNING *`;
    
    const result = await pool.query(query, [
      req.params.id, 
      tipo || 'Muro', 
      nombre || 'Elemento', 
      superficie || 0, 
      orientacion || 'Norte'
    ]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("ERROR DETALLADO:", error); // Esto saldrá en tus logs de Render
    res.status(500).json({ error: "Error en la base de datos", detalle: error.message });
  }
};
exports.getEnvelope = async (req, res) => {
  const result = await pool.query(`SELECT * FROM visit_envelope WHERE visit_id = $1`, [req.params.id]);
  res.json(result.rows);
};

// --- 4. VENTANAS (POST /:id/windows) ---
exports.addWindow = async (req, res) => {
  try {
    const { nombre, superficie, orientacion, marco, vidrio } = req.body;
    const result = await pool.query(
      `INSERT INTO visit_windows (visit_id, nombre, superficie, orientacion, marco, vidrio) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.params.id, nombre, superficie, orientacion, marco, vidrio]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) { res.status(500).json({ error: "Error guardando ventana" }); }
};

exports.getWindows = async (req, res) => {
  const result = await pool.query(`SELECT * FROM visit_windows WHERE visit_id = $1`, [req.params.id]);
  res.json(result.rows);
};

// --- 5. INSTALACIONES (POST /:id/installations) ---
exports.addInstallation = async (req, res) => {
  try {
    const { tipo, energia, marca_modelo, potencia, ano_aprox } = req.body;
    const result = await pool.query(
      `INSERT INTO visit_installations (visit_id, tipo, combustible, generador, potencia_nominal, ano_instalacion) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.params.id, tipo, energia, marca_modelo, potencia || 0, ano_aprox]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) { res.status(500).json({ error: "Error guardando instalación" }); }
};

exports.getInstallations = async (req, res) => {
  const result = await pool.query(`SELECT * FROM visit_installations WHERE visit_id = $1`, [req.params.id]);
  res.json(result.rows);
};

// --- 6. FOTOS Y PDF ---
exports.uploadPhoto = async (req, res) => {
  try {
    const inserted = [];
    for (const file of req.files) {
      const result = await pool.query(`INSERT INTO visit_photos (visit_id, filename, filepath, tipo) VALUES ($1,$2,$3,$4) RETURNING *`, 
      [req.params.id, file.filename, file.path, req.body.tipo || "general"]);
      inserted.push(result.rows[0]);
    }
    res.status(201).json(inserted);
  } catch (error) { res.status(500).json({ error: "Error en fotos" }); }
};

exports.exportPDF = async (req, res) => {
  try {
    const id = req.params.id;
    const visit = (await pool.query(`SELECT * FROM visits WHERE id = $1`, [id])).rows[0];
    const building = (await pool.query(`SELECT * FROM visit_building WHERE visit_id = $1`, [id])).rows[0];
    const envelope = (await pool.query(`SELECT * FROM visit_envelope WHERE visit_id = $1`, [id])).rows;
    const windows = (await pool.query(`SELECT * FROM visit_windows WHERE visit_id = $1`, [id])).rows;
    const installations = (await pool.query(`SELECT * FROM visit_installations WHERE visit_id = $1`, [id])).rows;
    const photos = (await pool.query(`SELECT * FROM visit_photos WHERE visit_id = $1`, [id])).rows;

    pdfService.generatePDF(res, { visit, building, envelope, windows, installations, photos });
  } catch (error) { res.status(500).json({ error: "Error PDF" }); }
};

exports.exportXML = async (req, res) => { res.send("XML pronto..."); };

exports.finalizeVisit = async (req, res) => {
  await pool.query(`UPDATE visits SET estado = 'finalizada' WHERE id = $1`, [req.params.id]);
  res.json({ message: "Finalizada" });
};

exports.deleteVisit = async (req, res) => {
  await pool.query(`DELETE FROM visits WHERE id = $1`, [req.params.id]);
  res.json({ message: "Borrada" });
};