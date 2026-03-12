const driveService = require('../services/drive.service'); 
const airtableService = require('../services/airtable.service');
const fs = require('fs');
const path = require('path');
const pool = require('../config/db'); 
const pdfService = require('../services/pdf.service');

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

    // Actualizar Airtable a "5. En curso"
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
exports.deleteEnvelopeElement = async (req, res) => {
  const { id, elementoId } = req.params;

  try {
    // IMPORTANTE: Tu tabla parece llamarse visit_envelope, así que usamos ese nombre
    const result = await pool.query(
      'DELETE FROM visit_envelope WHERE id = $1 AND visit_id = $2 RETURNING *',
      [elementoId, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Elemento no encontrado o no pertenece a esta visita." });
    }

    res.json({ message: "Elemento borrado correctamente", deleted: result.rows[0] });
  } catch (error) {
    console.error("❌ Error borrando elemento de la envolvente:", error);
    res.status(500).json({ error: "Error interno al borrar el elemento." });
  }
};
// --- 4. VENTANAS ---
exports.addWindow = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, marco, vidrio, superficie } = req.body;
    
    // 1. Guardamos los datos de la ventana
    const query = `INSERT INTO visit_windows (visit_id, nombre, superficie, orientacion, marco, vidrio) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
    const result = await pool.query(query, [id, nombre || "Ventana", parseFloat(superficie) || 0, "N/A", marco || "No especificado", vidrio || "No especificado"]);
    
    const nuevaVentana = result.rows[0];

    // 2. Si vienen fotos (de multer), las subimos a Drive
    if (req.files && req.files.length > 0) {
      const folderId = await driveService.getOrCreateClientFolder(`Visita_${id}`);
      
      for (const file of req.files) {
        const driveFileId = await driveService.uploadFile(file.path, file.filename, folderId);
        
        // Guardamos en visit_photos (Asegúrate de tener un campo 'referencia_id' o similar si quieres hilar fino, 
        // aquí uso 'tipo' = 'ventana' para distinguirlas de las generales)
        await pool.query(
          `INSERT INTO visit_photos (visit_id, filename, filepath, tipo) VALUES ($1, $2, $3, $4)`,
          [id, file.originalname, driveFileId, `ventana_${nuevaVentana.id}`] // Truco: guardo el ID en el tipo para saber de qué ventana es
        );
        
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      }
    }

    res.status(201).json(nuevaVentana);
  } catch (error) { 
    console.error("Error al guardar la ventana:", error);
    res.status(500).json({ error: "Error al guardar la ventana" }); 
  }
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
    const { id } = req.params;
    const { tipo, energia, marca_modelo, potencia, ano_aprox } = req.body;
    
    // 1. Guardamos los datos de la instalación
    const query = `INSERT INTO visit_installations (visit_id, tipo, combustible, generador, potencia_nominal, ano_instalacion) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
    const result = await pool.query(query, [id, tipo, energia || "No especificado", marca_modelo || "Genérico", parseFloat(potencia) || 0, parseInt(ano_aprox) || 0]);
    
    const nuevaInstalacion = result.rows[0];

    // 2. Si vienen fotos de la instalación, las subimos a Drive
    if (req.files && req.files.length > 0) {
      const folderId = await driveService.getOrCreateClientFolder(`Visita_${id}`);
      
      for (const file of req.files) {
        const driveFileId = await driveService.uploadFile(file.path, file.filename, folderId);
        
        await pool.query(
          `INSERT INTO visit_photos (visit_id, filename, filepath, tipo) VALUES ($1, $2, $3, $4)`,
          [id, file.originalname, driveFileId, `instalacion_${nuevaInstalacion.id}`] // Truco: guardo el ID en el tipo
        );
        
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      }
    }

    res.status(201).json(nuevaInstalacion);
  } catch (error) { 
    console.error("Error al guardar la instalación:", error);
    res.status(500).json({ error: "Error al guardar instalación" }); 
  }
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
    const data = await getFullVisitData(id);
    pdfService.generatePDF(res, data);
  } catch (error) { res.status(500).json({ error: "Error PDF" }); }
};

exports.exportXML = async (req, res) => res.json({ message: "XML no implementado" });

exports.finalizeVisit = async (req, res) => {
  try {
    const { id } = req.params;

    // Marcar visita como finalizada
    await pool.query(`UPDATE visits SET estado = 'finalizada' WHERE id = $1`, [id]);

    // Responder inmediatamente al usuario
    res.json({ message: "Visita finalizada. Generando documentos..." });

    // Generar documentos en segundo plano
    generateDocumentsInBackground(id);

  } catch (error) {
    console.error("Error al finalizar:", error);
    res.status(500).json({ error: "No se pudo finalizar" });
  }
};

// Función auxiliar para obtener datos
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

async function generateDocumentsInBackground(id) {
  try {
    const data = await getFullVisitData(id);

    const folderId = await driveService.getOrCreateClientFolder(`Visita_${id}`);

    // --- PDF ---
    const pdfPath = path.join(__dirname, `../../temp_report_${id}.pdf`);
    await pdfService.createPDFFile(data, pdfPath);

    await driveService.uploadFile(
      pdfPath,
      `Informe_Visita_${id}.pdf`,
      folderId
    );

    if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);

    // --- XML ---
    const xmlPath = path.join(__dirname, `../../temp_data_${id}.xml`);
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?><visita id="${id}"><estado>finalizada</estado></visita>`;

    fs.writeFileSync(xmlPath, xmlContent);

    await driveService.uploadFile(
      xmlPath,
      `Datos_Visita_${id}.xml`,
      folderId
    );

    if (fs.existsSync(xmlPath)) fs.unlinkSync(xmlPath);

    console.log(`Documentos generados para visita ${id} ✅`);

  } catch (error) {
    console.error("Error generando documentos en background:", error);
  }
}