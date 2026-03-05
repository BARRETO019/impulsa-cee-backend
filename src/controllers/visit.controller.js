const pool = require('../config/db');
const xmlService = require('../services/xml.service');
const pdfService = require('../services/pdf.service');
const airtableService = require('../services/airtable.service');
const fs = require('fs');
const path = require('path');

// --- GESTIÓN DE VISITAS ---
exports.createVisit = async (req, res) => {
  try {
    const { cliente, municipio, provincia } = req.body;
    const tecnicoId = req.user.id;
    const query = `INSERT INTO visits (tecnico_id, direccion, municipio, provincia, estado) VALUES ($1, $2, $3, $4, $5) RETURNING *`;
    const values = [tecnicoId, cliente || "Cliente Sin Nombre", municipio || "N/A", provincia || "Madrid", 'borrador'];
    const newVisit = await pool.query(query, values);
    res.status(201).json(newVisit.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear visita', detalle: error.message });
  }
};

exports.getMyVisits = async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM visits WHERE tecnico_id = $1 ORDER BY created_at DESC`, [req.user.id]);
    res.json(result.rows);
  } catch (error) { res.status(500).json({ error: "Error obteniendo visitas" }); }
};

// --- EDIFICIO (STEP 1) ---
exports.saveBuildingData = async (req, res) => {
  try {
    const visit_id = req.params.id;
    const { zona_climatica, normativa, referencia_catastral, superficie_habitable } = req.body;
    const existing = await pool.query(`SELECT * FROM visit_building WHERE visit_id = $1`, [visit_id]);
    if (existing.rows.length > 0) {
      await pool.query(`UPDATE visit_building SET zona_climatica=$1, normativa=$2, referencia_catastral=$3, superficie_habitable=$4 WHERE visit_id=$5`, 
      [zona_climatica, normativa, referencia_catastral, superficie_habitable, visit_id]);
    } else {
      await pool.query(`INSERT INTO visit_building (visit_id, zona_climatica, normativa, referencia_catastral, superficie_habitable) VALUES ($1,$2,$3,$4,$5)`, 
      [visit_id, zona_climatica, normativa, referencia_catastral, superficie_habitable]);
    }
    res.json({ message: "Datos guardados" });
  } catch (error) { res.status(500).json({ error: "Error en edificio" }); }
};

// --- COMPONENTES (STEPS 2, 3, 4) ---
exports.addEnvelopeElement = async (req, res) => {
  const { tipo, nombre, superficie, orientacion, transmitancia, observaciones } = req.body;
  const result = await pool.query(`INSERT INTO visit_envelope (visit_id, tipo, nombre, superficie, orientacion, transmitancia, observaciones) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`, 
  [req.params.id, tipo, nombre, superficie, orientacion, transmitancia || 0, observaciones]);
  res.status(201).json(result.rows[0]);
};

exports.getEnvelope = async (req, res) => {
  const result = await pool.query(`SELECT * FROM visit_envelope WHERE visit_id = $1`, [req.params.id]);
  res.json(result.rows);
};

exports.addWindow = async (req, res) => {
  const { nombre, superficie, orientacion, marco, vidrio } = req.body;
  const result = await pool.query(`INSERT INTO visit_windows (visit_id, nombre, superficie, orientacion, marco, vidrio) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`, 
  [req.params.id, nombre, superficie, orientacion, marco, vidrio]);
  res.status(201).json(result.rows[0]);
};

exports.getWindows = async (req, res) => {
  const result = await pool.query(`SELECT * FROM visit_windows WHERE visit_id = $1`, [req.params.id]);
  res.json(result.rows);
};

exports.addInstallation = async (req, res) => {
  const { tipo, energia, marca_modelo, potencia, ano_aprox } = req.body;
  const result = await pool.query(`INSERT INTO visit_installations (visit_id, tipo, combustible, generador, potencia_nominal, ano_instalacion) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`, 
  [req.params.id, tipo, energia, marca_modelo, potencia || 0, ano_aprox]);
  res.status(201).json(result.rows[0]);
};

exports.getInstallations = async (req, res) => {
  const result = await pool.query(`SELECT * FROM visit_installations WHERE visit_id = $1`, [req.params.id]);
  res.json(result.rows);
};

// --- FOTOS (STEP 5) ---
exports.uploadPhoto = async (req, res) => {
  try {
    const files = req.files;
    const inserted = [];
    for (const file of files) {
      const result = await pool.query(`INSERT INTO visit_photos (visit_id, filename, filepath, tipo) VALUES ($1,$2,$3,$4) RETURNING *`, 
      [req.params.id, file.filename, file.path, req.body.tipo || "general"]);
      inserted.push(result.rows[0]);
    }
    res.status(201).json(inserted);
  } catch (error) { res.status(500).json({ error: "Error subiendo fotos" }); }
};

// --- EXPORTAR ---
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
  } catch (error) { res.status(500).json({ error: "Error en PDF" }); }
};

exports.exportXML = async (req, res) => {
  res.status(200).send("XML no implementado aún");
};

exports.finalizeVisit = async (req, res) => {
  await pool.query(`UPDATE visits SET estado = 'finalizada' WHERE id = $1`, [req.params.id]);
  res.json({ message: "Finalizada" });
};

exports.deleteVisit = async (req, res) => {
  await pool.query(`DELETE FROM visits WHERE id = $1`, [req.params.id]);
  res.json({ message: "Borrada" });
};