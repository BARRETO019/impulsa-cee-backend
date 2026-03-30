const driveService = require('../services/drive.service');
const fs = require('fs');
const pool = require('../config/db');

/**
 * Función auxiliar para obtener el nombre de la carpeta
 * en Google Drive según la dirección de la visita
 */
async function getFolderName(visitId) {
  const result = await pool.query(
    'SELECT direccion FROM visits WHERE id = $1',
    [visitId]
  );

  return result.rows.length > 0
    ? result.rows[0].direccion
    : `Visita_${visitId}`;
}

/**
 * Subida de fotos generales de una visita
 * ---------------------------------------
 * Este controller queda temporalmente aquí
 * hasta moverlo al módulo de fotos/media.
 */
exports.uploadPhoto = async (req, res) => {
  try {
    const { id } = req.params;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No hay fotos" });
    }

    const folderName = await getFolderName(id);
    const savedPhotos = [];

    for (const file of files) {
      const driveFileId = await driveService.uploadFile(
        file.path,
        file.filename,
        folderName
      );

      const result = await pool.query(
        `INSERT INTO visit_photos (visit_id, filename, filepath, tipo)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [id, file.originalname, driveFileId, 'general']
      );

      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      savedPhotos.push(result.rows[0]);
    }

    return res.status(201).json({
      message: "Subido a Drive",
      count: savedPhotos.length
    });
  } catch (error) {
    return res.status(500).json({ error: "Error en Drive" });
  }
};