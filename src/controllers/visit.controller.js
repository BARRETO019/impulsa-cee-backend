// 1. IMPORTACIONES (Solo una vez)
const pool = require('../config/db');
const xmlService = require('../services/xml.service');
const pdfService = require('../services/pdf.service');
const driveService = require('../services/drive.service');
const airtableService = require('../services/airtable.service');
const fs = require('fs');
const path = require('path');

// =====================================================
// GESTIÓN DE VISITAS
// =====================================================

exports.createVisit = async (req, res) => {
  try {
    const cliente = req.body.cliente || "Cliente Sin Nombre";
    const direccion = req.body.direccion || cliente;
    const municipio = req.body.municipio || "No especificado";
    const provincia = req.body.provincia || "Madrid";
    const tecnicoId = req.user.id;

    const query = `
      INSERT INTO visits (tecnico_id, direccion, municipio, provincia, estado) 
      VALUES ($1, $2, $3, $4, $5) RETURNING *`;
    
    const values = [tecnicoId, cliente, municipio, provincia, 'borrador'];
    const newVisit = await pool.query(query, values);
    res.status(201).json(newVisit.rows[0]);
  } catch (error) {
    console.error('❌ Error en createVisit:', error.message);
    res.status(500).json({ error: 'Error al insertar en la base de datos' });
  }
};

exports.getMyVisits = async (req, res) => {
  try {
    const tecnico_id = req.user.id;
    const result = await pool.query(
      `SELECT * FROM visits WHERE tecnico_id = $1 ORDER BY created_at DESC`,
      [tecnico_id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo visitas" });
  }
};

// =====================================================
// DATOS DEL EDIFICIO (STEP 1)
// =====================================================

exports.saveBuildingData = async (req, res) => {
  try {
    const visit_id = req.params.id;
    const { zona_climatica, normativa, referencia_catastral, superficie_habitable, volumen_habitable, compacidad, ventilacion, demanda_acs } = req.body;

    const existing = await pool.query(`SELECT * FROM visit_building WHERE visit_id = $1`, [visit_id]);

    let result;
    if (existing.rows.length > 0) {
      result = await pool.query(
        `UPDATE visit_building SET zona_climatica=$1, normativa=$2, referencia_catastral=$3, superficie_habitable=$4, volumen_habitable=$5, compacidad=$6, ventilacion=$7, demanda_acs=$8 WHERE visit_id=$9 RETURNING *`,
        [zona_climatica, normativa, referencia_catastral, superficie_habitable, volumen_habitable, compacidad, ventilacion, demanda_acs, visit_id]
      );
    } else {
      result = await pool.query(
        `INSERT INTO visit_building (visit_id, zona_climatica, normativa, referencia_catastral, superficie_habitable, volumen_habitable, compacidad, ventilacion, demanda_acs) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
        [visit_id, zona_climatica, normativa, referencia_catastral, superficie_habitable, volumen_habitable, compacidad, ventilacion, demanda_acs]
      );
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Error guardando edificio" });
  }
};

// =====================================================
// ENVOLVENTE, VENTANAS E INSTALACIONES (STEPS 2, 3, 4)
// =====================================================

exports.addEnvelopeElement = async (req, res) => {
  try {
    const { tipo, nombre, superficie, orientacion, transmitancia, observaciones } = req.body;
    const result = await pool.query(
      `INSERT INTO visit_envelope (visit_id, tipo, nombre, superficie, orientacion, transmitancia, observaciones) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.params.id, tipo, nombre, superficie, orientacion, transmitancia || 0, observaciones]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) { res.status(500).json({ error: "Error en envolvente" }); }
};

exports.getEnvelope = async (req, res) => {
  const result = await pool.query(`SELECT * FROM visit_envelope WHERE visit_id = $1`, [req.params.id]);
  res.json(result.rows);
};

exports.addWindow = async (req, res) => {
  try {
    const { nombre, superficie, orientacion, marco, vidrio } = req.body;
    const result = await pool.query(
      `INSERT INTO visit_windows (visit_id, nombre, superficie, orientacion, marco, vidrio) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.params.id, nombre, superficie, orientacion, marco, vidrio]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) { res.status(500).json({ error: "Error en ventana" }); }
};

exports.getWindows = async (req, res) => {
  const result = await pool.query(`SELECT * FROM visit_windows WHERE visit_id = $1`, [req.params.id]);
  res.json(result.rows);
};

exports.addInstallation = async (req, res) => {
  try {
    const { tipo, energia, marca_modelo, potencia, ano_aprox, observaciones } = req.body;
    const result = await pool.query(
      `INSERT INTO visit_installations (visit_id, tipo, combustible, generador, potencia_nominal, ano_instalacion, observaciones) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.params.id, tipo, energia, marca_modelo, potencia || 0, ano_aprox || null, observaciones]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) { res.status(500).json({ error: "Error en instalación" }); }
};

exports.getInstallations = async (req, res) => {
  const result = await pool.query(`SELECT * FROM visit_installations WHERE visit_id = $1`, [req.params.id]);
  res.json(result.rows);
};

// =====================================================
// FOTOS (STEP 5)
// =====================================================

exports.uploadPhoto = async (req, res) => {
  try {
    const files = req.files;
    if (!files) return res.status(400).json({ error: "No hay archivos" });
    const inserted = [];
    for (const file of files) {
      const result = await pool.query(
        `INSERT INTO visit_photos (visit_id, filename, filepath, tipo) VALUES ($1, $2, $3, $4) RETURNING *`,
        [req.params.id, file.filename, file.path, req.body.tipo || "general"]
      );
      inserted.push(result.rows[0]);
    }
    res.status(201).json(inserted);
  } catch (error) { res.status(500).json({ error: "Error subiendo fotos" }); }
};

// =====================================================
// EXPORTACIÓN (XML Y PDF)
// =====================================================

exports.exportPDF = async (req, res) => {
  try {
    const visit_id = req.params.id;
    
    // 1. Recogemos TODOS los datos de la visita
    const visit = (await pool.query(`SELECT * FROM visits WHERE id = $1`, [visit_id])).rows[0];
    const building = (await pool.query(`SELECT * FROM visit_building WHERE visit_id = $1`, [visit_id])).rows[0];
    const envelope = (await pool.query(`SELECT * FROM visit_envelope WHERE visit_id = $1`, [visit_id])).rows;
    const windows = (await pool.query(`SELECT * FROM visit_windows WHERE visit_id = $1`, [visit_id])).rows;
    const installations = (await pool.query(`SELECT * FROM visit_installations WHERE visit_id = $1`, [visit_id])).rows;
    const photos = (await pool.query(`SELECT * FROM visit_photos WHERE visit_id = $1`, [visit_id])).rows;

    // 2. Se lo enviamos al servicio de PDF que creamos antes
    pdfService.generatePDF(res, {
      visit,
      building,
      envelope,
      windows,
      installations,
      photos // <-- Ahora las fotos sí se envían
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error generando PDF" });
  }
};

exports.exportXML = async (req, res) => {
  // Lógica de exportación XML similar...
  res.status(200).send("XML generado"); 
};

// =====================================================
// FINALIZAR Y OTROS
// =====================================================

exports.finalizeVisit = async (req, res) => {
  try {
    const visit_id = req.params.id;
    // Actualizar estado en Airtable si existe
    const visit = (await pool.query(`SELECT * FROM visits WHERE id = $1`, [visit_id])).rows[0];
    if (visit.airtable_id) {
      await airtableService.updateEstado(visit.airtable_id, "5. En curso");
    }
    await pool.query(`UPDATE visits SET estado = 'finalizada' WHERE id = $1`, [visit_id]);
    res.json({ message: "Visita finalizada" });
  } catch (error) { res.status(500).json({ error: "Error al finalizar" }); }
};

exports.deleteVisit = async (req, res) => {
  await pool.query(`DELETE FROM visits WHERE id = $1`, [req.params.id]);
  res.json({ message: "Eliminada" });
};