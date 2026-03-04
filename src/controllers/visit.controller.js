// Importamos conexión a base de datos
const pool = require('../config/db');
const xmlService = require('../services/xml.service');
const pdfService = require('../services/pdf.service');

const driveService = require('../services/drive.service');
//const xmlService = require('../services/xml.service');
//const pdfService = require('../services/pdf.service');
const fs = require('fs');
const path = require('path');



/**
 * =====================================================
 * CREAR NUEVA VISITA TÉCNICA
 * =====================================================
 * - Solo usuarios autenticados pueden crear visitas
 * - La visita se asocia automáticamente al técnico logueado
 */

const airtableService = require('../services/airtable.service');

//const pool = require('../config/db');

exports.createVisit = async (req, res) => {
  try {
    // 1. Extraemos los datos y nos aseguramos de que NINGUNO sea undefined
    const cliente = req.body.cliente ||  cliente;
    const direccion = req.body.direccion || cliente;
    const municipio = req.body.municipio || "No especificado";
    const provincia = req.body.provincia || "Madrid";
    const tecnicoId = req.user.id;

    console.log(`🚀 Intentando insertar en Neon: Tecnico(${tecnicoId}), Direccion(${cliente})`);

    // 2. Query usando los nombres EXACTOS de tu tabla en Neon  
    const query = `
      INSERT INTO visits 
      (tecnico_id, direccion, municipio, provincia, estado) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING *
    `;

    const values = [
      tecnicoId, 
      cliente,    // Se guarda en la columna 'direccion'
      municipio, 
      provincia, 
      'borrador'
    ];

    const newVisit = await pool.query(query, values);

    console.log("✅ Visita creada con éxito en la DB");
    res.status(201).json(newVisit.rows[0]);

  } catch (error) {
    console.error('❌ Error detallado en DB:', error.message);
    res.status(500).json({ 
      error: 'Error al insertar en la base de datos',
      detalle: error.message 
    });
  }
};

/**
 * =====================================================
 * OBTENER VISITAS DEL TÉCNICO AUTENTICADO
 * =====================================================
 * - Devuelve solo las visitas del usuario logueado
 */
exports.getMyVisits = async (req, res) => {
  try {

    // ID del técnico obtenido del token
    const tecnico_id = req.user.id;

    // Consulta filtrada por técnico
    const result = await pool.query(
      `
      SELECT *
      FROM visits
      WHERE tecnico_id = $1
      ORDER BY created_at DESC
      `,
      [tecnico_id]
    );

    res.json(result.rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error obteniendo visitas" });
  }
};
/**
 * =====================================================
 * GUARDAR / ACTUALIZAR DATOS DEL EDIFICIO
 * =====================================================
 * - Cada visita tiene solo un bloque building (1:1)
 * - Si existe → actualiza
 * - Si no existe → crea
 */
exports.saveBuildingData = async (req, res) => {
  try {

    const visit_id = req.params.id;

    // Verificamos que la visita pertenece al técnico logueado
    const visitCheck = await pool.query(
      `SELECT * FROM visits WHERE id = $1 AND tecnico_id = $2`,
      [visit_id, req.user.id]
    );

    if (visitCheck.rows.length === 0) {
      return res.status(403).json({ error: "No autorizado para esta visita" });
    }

    const {
      zona_climatica,
      normativa,
      referencia_catastral,
      superficie_habitable,
      volumen_habitable,
      compacidad,
      ventilacion,
      demanda_acs
    } = req.body;

    // Comprobamos si ya existe registro
    const existing = await pool.query(
      `SELECT * FROM visit_building WHERE visit_id = $1`,
      [visit_id]
    );

    let result;

    if (existing.rows.length > 0) {
      // UPDATE
      result = await pool.query(
        `
        UPDATE visit_building
        SET
          zona_climatica = $1,
          normativa = $2,
          referencia_catastral = $3,
          superficie_habitable = $4,
          volumen_habitable = $5,
          compacidad = $6,
          ventilacion = $7,
          demanda_acs = $8
        WHERE visit_id = $9
        RETURNING *
        `,
        [
          zona_climatica,
          normativa,
          referencia_catastral,
          superficie_habitable,
          volumen_habitable,
          compacidad,
          ventilacion,
          demanda_acs,
          visit_id
        ]
      );

    } else {
      // INSERT
      result = await pool.query(
        `
        INSERT INTO visit_building (
          visit_id,
          zona_climatica,
          normativa,
          referencia_catastral,
          superficie_habitable,
          volumen_habitable,
          compacidad,
          ventilacion,
          demanda_acs
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        RETURNING *
        `,
        [
          visit_id,
          zona_climatica,
          normativa,
          referencia_catastral,
          superficie_habitable,
          volumen_habitable,
          compacidad,
          ventilacion,
          demanda_acs
        ]
      );
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error guardando datos del edificio" });
  }
};
/**
 * =====================================================
 * SUBIR FOTO A UNA VISITA
 * =====================================================
 */
exports.uploadPhoto = async (req, res) => {
  try {
    const visit_id = req.params.id;

    // Comprobar visita
    const visitCheck = await pool.query(
      `SELECT * FROM visits WHERE id = $1 AND tecnico_id = $2`,
      [visit_id, req.user.id]
    );

    if (visitCheck.rows.length === 0) {
      return res.status(403).json({ error: "No autorizado" });
    }

    // Ahora usamos req.files (no req.file)
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No se subieron archivos" });
    }

    const inserted = [];

    for (const file of files) {
      const result = await pool.query(
        `
        INSERT INTO visit_photos (visit_id, filename, filepath, tipo)
        VALUES ($1, $2, $3, $4)
        RETURNING *
        `,
        [
          visit_id,
          file.filename,
          file.path,
          req.body.tipo || "general"
        ]
      );

      inserted.push(result.rows[0]);
    }

    res.status(201).json(inserted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error subiendo fotos" });
  }
};
/**
 * =====================================================
 * AÑADIR ELEMENTO DE ENVOLVENTE
 * =====================================================
 * - Fachada, cubierta, suelo...
 * - Relación 1 visita → muchos elementos
 */
exports.addEnvelopeElement = async (req, res) => {
  try {

    const visit_id = req.params.id;

    // Verificar que la visita pertenece al técnico
    const visitCheck = await pool.query(
      `SELECT * FROM visits WHERE id = $1 AND tecnico_id = $2`,
      [visit_id, req.user.id]
    );

    if (visitCheck.rows.length === 0) {
      return res.status(403).json({ error: "No autorizado" });
    }

    const {
      tipo,
      nombre,
      superficie,
      orientacion,
      transmitancia
    } = req.body;

    const result = await pool.query(
      `
      INSERT INTO visit_envelope
      (visit_id, tipo, nombre, superficie, orientacion, transmitancia)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *
      `,
      [
        visit_id,
        tipo,
        nombre,
        superficie,
        orientacion,
        transmitancia
      ]
    );

    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error creando elemento de envolvente" });
  }
};
/**
 * =====================================================
 * OBTENER ENVOLVENTE DE UNA VISITA
 * =====================================================
 */
exports.getEnvelope = async (req, res) => {
  try {

    const visit_id = req.params.id;

    const result = await pool.query(
      `
      SELECT *
      FROM visit_envelope
      WHERE visit_id = $1
      ORDER BY created_at ASC
      `,
      [visit_id]
    );

    res.json(result.rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error obteniendo envolvente" });
  }
};
/**
 * =====================================================
 * AÑADIR HUECO (VENTANA)
 * =====================================================
 */
exports.addWindow = async (req, res) => {
  try {

    const visit_id = req.params.id;

    // Verificar que la visita pertenece al técnico
    const visitCheck = await pool.query(
      `SELECT * FROM visits WHERE id = $1 AND tecnico_id = $2`,
      [visit_id, req.user.id]
    );

    if (visitCheck.rows.length === 0) {
      return res.status(403).json({ error: "No autorizado" });
    }

    const {
      nombre,
      superficie,
      orientacion,
      transmitancia,
      factor_solar
    } = req.body;

    const result = await pool.query(
      `
      INSERT INTO visit_windows
      (visit_id, nombre, superficie, orientacion, transmitancia, factor_solar)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *
      `,
      [
        visit_id,
        nombre,
        superficie,
        orientacion,
        transmitancia,
        factor_solar
      ]
    );

    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error creando ventana" });
  }
};



/**
 * =====================================================
 * OBTENER HUECOS DE UNA VISITA
 * =====================================================
 */
exports.getWindows = async (req, res) => {
  try {

    const visit_id = req.params.id;

    const result = await pool.query(
      `
      SELECT *
      FROM visit_windows
      WHERE visit_id = $1
      ORDER BY created_at ASC
      `,
      [visit_id]
    );

    res.json(result.rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error obteniendo ventanas" });
  }
};
/**
 * =====================================================
 * AÑADIR INSTALACIÓN TÉRMICA
 * =====================================================
 * tipo: calefaccion | refrigeracion | acs
 */
exports.addInstallation = async (req, res) => {
  try {

    const visit_id = req.params.id;

    // Verificar que la visita pertenece al técnico
    const visitCheck = await pool.query(
      `SELECT * FROM visits WHERE id = $1 AND tecnico_id = $2`,
      [visit_id, req.user.id]
    );

    if (visitCheck.rows.length === 0) {
      return res.status(403).json({ error: "No autorizado" });
    }

    const {
      tipo,
      generador,
      combustible,
      potencia_nominal,
      rendimiento_estacional,
      ano_instalacion
    } = req.body;

    const result = await pool.query(
      `
      INSERT INTO visit_installations
      (visit_id, tipo, generador, combustible, potencia_nominal, rendimiento_estacional, ano_instalacion)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *
      `,
      [
        visit_id,
        tipo,
        generador,
        combustible,
        potencia_nominal,
        rendimiento_estacional,
        ano_instalacion
      ]
    );

    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error creando instalación" });
  }
};



/**
 * =====================================================
 * OBTENER INSTALACIONES DE UNA VISITA
 * =====================================================
 */
exports.getInstallations = async (req, res) => {
  try {

    const visit_id = req.params.id;

    const result = await pool.query(
      `
      SELECT *
      FROM visit_installations
      WHERE visit_id = $1
      ORDER BY created_at ASC
      `,
      [visit_id]
    );

    res.json(result.rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error obteniendo instalaciones" });
  }
};
/**
 * =====================================================
 * EXPORTAR XML DE UNA VISITA
 * =====================================================
 */
exports.exportXML = async (req, res) => {
  try {

    const visit_id = req.params.id;

    // Verificar que la visita pertenece al técnico
    const visitCheck = await pool.query(
      `SELECT * FROM visits WHERE id = $1 AND tecnico_id = $2`,
      [visit_id, req.user.id]
    );

    if (visitCheck.rows.length === 0) {
      return res.status(403).json({ error: "No autorizado" });
    }

    const visit = visitCheck.rows[0];

    // Obtener building
    const buildingResult = await pool.query(
      `SELECT * FROM visit_building WHERE visit_id = $1`,
      [visit_id]
    );

    const building = buildingResult.rows[0];

    // Obtener envolvente
    const envelopeResult = await pool.query(
      `SELECT * FROM visit_envelope WHERE visit_id = $1`,
      [visit_id]
    );

    const envelope = envelopeResult.rows;

    // Obtener ventanas
    const windowsResult = await pool.query(
      `SELECT * FROM visit_windows WHERE visit_id = $1`,
      [visit_id]
    );

    const windows = windowsResult.rows;

    // Obtener instalaciones
    const installationsResult = await pool.query(
      `SELECT * FROM visit_installations WHERE visit_id = $1`,
      [visit_id]
    );

    const installations = installationsResult.rows;

    // Generar XML
    const xml = xmlService.generateXML({
      visit,
      building,
      envelope,
      windows,
      installations
    });

    // Configurar cabecera para descarga
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=visita_${visit_id}.xml`
    );

    res.send(xml);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error generando XML" });
  }
};
/**
 * =====================================================
 * EXPORTAR PDF DE UNA VISITA
 * =====================================================
 */
exports.exportPDF = async (req, res) => {
  try {

    const visit_id = req.params.id;

    const visitCheck = await pool.query(
      `SELECT * FROM visits WHERE id = $1 AND tecnico_id = $2`,
      [visit_id, req.user.id]
    );

    if (visitCheck.rows.length === 0) {
      return res.status(403).json({ error: "No autorizado" });
    }

    const visit = visitCheck.rows[0];

    const building = (await pool.query(
      `SELECT * FROM visit_building WHERE visit_id = $1`,
      [visit_id]
    )).rows[0];

    const envelope = (await pool.query(
      `SELECT * FROM visit_envelope WHERE visit_id = $1`,
      [visit_id]
    )).rows;

    const windows = (await pool.query(
      `SELECT * FROM visit_windows WHERE visit_id = $1`,
      [visit_id]
    )).rows;

    const installations = (await pool.query(
      `SELECT * FROM visit_installations WHERE visit_id = $1`,
      [visit_id]
    )).rows;

    pdfService.generatePDF(res, {
      visit,
      building,
      envelope,
      windows,
      installations
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error generando PDF" });
  }
};
/**
 * =====================================================
 * FINALIZAR VISITA
 * =====================================================
 */
exports.finalizeVisit = async (req, res) => {

  try {

    const visit_id = req.params.id;

    const visitCheck = await pool.query(
      `SELECT * FROM visits WHERE id = $1 AND tecnico_id = $2`,
      [visit_id, req.user.id]
    );

    if (visitCheck.rows.length === 0) {
      return res.status(403).json({ error: "No autorizado" });
    }

    const visit = visitCheck.rows[0];

    if (visit.estado === 'finalizada') {
      return res.status(400).json({ error: "Ya finalizada" });
    }

    // ===============================
    // OBTENER DATOS COMPLETOS
    // ===============================

    const building = (await pool.query(
      `SELECT * FROM visit_building WHERE visit_id = $1`,
      [visit_id]
    )).rows[0];

    const envelope = (await pool.query(
      `SELECT * FROM visit_envelope WHERE visit_id = $1`,
      [visit_id]
    )).rows;

    const windows = (await pool.query(
      `SELECT * FROM visit_windows WHERE visit_id = $1`,
      [visit_id]
    )).rows;

    const installations = (await pool.query(
      `SELECT * FROM visit_installations WHERE visit_id = $1`,
      [visit_id]
    )).rows;

    // ===============================
    // CREAR ESTRUCTURA EN DRIVE
    // ===============================

    // Usamos dirección como identificador provisional de cliente
    const clientName = visit.direccion.replace(/[\/\\:*?"<>|]/g, '');

    // 1️⃣ Obtener o crear carpeta del cliente
    const clientFolderId = await driveService.getOrCreateClientFolder(clientName);

    // 2️⃣ Crear carpeta de la visita dentro del cliente
    const visitFolderId = await driveService.createFolder(
      `Visita_${visit_id}`,
      clientFolderId
    );

    // ===============================
    // GENERAR XML
    // ===============================

    const xml = xmlService.generateXML({
      visit,
      building,
      envelope,
      windows,
      installations
    });

    const xmlPath = path.join(__dirname, `../../temp_visita_${visit_id}.xml`);
    fs.writeFileSync(xmlPath, xml);

    await driveService.uploadFile(
      xmlPath,
      `visita_${visit_id}.xml`,
      visitFolderId
    );

    // ===============================
    // GENERAR PDF
    // ===============================

    const pdfPath = path.join(__dirname, `../../temp_visita_${visit_id}.pdf`);

    await pdfService.generatePDFToFile(pdfPath, {
      visit,
      building,
      envelope,
      windows,
      installations
    });

    // Esperamos pequeño tiempo por seguridad
    await new Promise(resolve => setTimeout(resolve, 1000));

    await driveService.uploadFile(
      pdfPath,
      `visita_${visit_id}.pdf`,
      visitFolderId
    );

    // ===============================
    // SUBIR FOTOS
    // ===============================

    const photosPath = path.join(
      __dirname,
      '../../uploads/visits',
      visit_id.toString()
    );

    if (fs.existsSync(photosPath)) {

      const files = fs.readdirSync(photosPath);

      for (const file of files) {

        const imagePath = path.join(photosPath, file);

        await driveService.uploadFile(
          imagePath,
          file,
          visitFolderId
        );
      }
    }

    // ACTUALIZAR ESTADO EN AIRTABLE
    // ===============================
    // ===============================
// ACTUALIZAR ESTADO EN AIRTABLE
// ===============================

if (visit.airtable_id) {

  try {

    console.log("Actualizando Airtable:", visit.airtable_id);

    await airtableService.updateEstado(
      visit.airtable_id,
      "5. En curso"
    );

    console.log("Airtable actualizado correctamente");

  } catch (error) {

    console.error("Error actualizando Airtable:", error);

  }

} else {

  console.log("La visita no tiene airtable_id");

}

// ===============================
// ACTUALIZAR ESTADO EN NUESTRA BD
// ===============================

await pool.query(
  `UPDATE visits SET estado = 'finalizada' WHERE id = $1`,
  [visit_id]
);
    res.json({ message: "Visita finalizada y subida a Drive" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error finalizando visita" });
  }
};
// ==========================================================
// BORRAR VISITA (SOLO CEO)
// ==========================================================

exports.deleteVisit = async (req, res) => {

  try {

    const visit_id = req.params.id;

    // Borrar visita (CASCADE borrará relacionadas)
    await pool.query(
      `DELETE FROM visits WHERE id = $1`,
      [visit_id]
    );

    res.json({ message: "Visita eliminada correctamente" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error eliminando visita" });
  }
};