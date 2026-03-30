const pool = require('../../../../config/db');

/**
 * Repositorio de instalaciones
 * ----------------------------
 * Encapsula acceso a base de datos relacionado con:
 * - instalaciones
 * - fotos asociadas
 */
class InstallationRepository {
  /**
   * Crear instalación
   */
  async create(visitId, data) {
    const {
      tipo,
      energia,
      marca_modelo,
      potencia,
      ano_aprox
    } = data;

    const query = `
      INSERT INTO visit_installations (
        visit_id,
        tipo,
        combustible,
        generador,
        potencia_nominal,
        ano_instalacion
      ) 
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await pool.query(query, [
      visitId,
      tipo,
      energia || "No especificado",
      marca_modelo || "Genérico",
      parseFloat(potencia) || 0,
      parseInt(ano_aprox) || 0
    ]);

    return result.rows[0];
  }

  /**
   * Obtener instalaciones de una visita
   */
  async findByVisitId(visitId) {
    const result = await pool.query(
      `SELECT * FROM visit_installations WHERE visit_id = $1`,
      [visitId]
    );

    return result.rows;
  }

  /**
   * Guardar foto asociada a una instalación
   */
  async savePhoto(visitId, originalName, driveFileId, installationId) {
    await pool.query(
      `INSERT INTO visit_photos (visit_id, filename, filepath, tipo) VALUES ($1, $2, $3, $4)`,
      [visitId, originalName, driveFileId, `instalacion_${installationId}`]
    );
  }

  /**
   * Obtener dirección/nombre de carpeta de la visita
   */
  async getFolderName(visitId) {
    const result = await pool.query(
      'SELECT direccion FROM visits WHERE id = $1',
      [visitId]
    );

    return result.rows.length > 0
      ? result.rows[0].direccion
      : `Visita_${visitId}`;
  }
}

module.exports = InstallationRepository;