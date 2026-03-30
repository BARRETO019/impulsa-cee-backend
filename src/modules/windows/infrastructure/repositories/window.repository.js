const pool = require('../../../../config/db');

/**
 * Repositorio de ventanas
 * ------------------------
 * Encapsula TODO acceso a base de datos relacionado con ventanas
 */
class WindowRepository {

  /**
   * Crear una ventana
   */
  async create(visitId, data) {
    const {
      nombre,
      marco,
      vidrio,
      superficie,
      orientacion,
      proteccion_solar,
      largo,
      alto,
      retranqueo,
      voladizo
    } = data;

    const query = `
      INSERT INTO visit_windows (
        visit_id,
        nombre,
        superficie,
        orientacion,
        marco,
        vidrio,
        proteccion_solar,
        largo,
        alto,
        retranqueo,
        voladizo
      ) 
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) 
      RETURNING *
    `;

    const result = await pool.query(query, [
      visitId,
      nombre || "Ventana",
      parseFloat(superficie) || 0,
      orientacion || "No especificada",
      marco || "No especificado",
      vidrio || "No especificado",
      proteccion_solar || "Sin protección",
      parseFloat(largo) || 0,
      parseFloat(alto) || 0,
      parseFloat(retranqueo) || 0,
      parseFloat(voladizo) || 0
    ]);

    return result.rows[0];
  }

  /**
   * Obtener ventanas de una visita
   */
  async findByVisitId(visitId) {
    const result = await pool.query(
      `SELECT * FROM visit_windows WHERE visit_id = $1`,
      [visitId]
    );

    return result.rows;
  }

  /**
   * Borrar ventana
   */
  async deleteById(windowId) {
    await pool.query(
      `DELETE FROM visit_windows WHERE id = $1`,
      [windowId]
    );
  }

  /**
   * Borrar fotos asociadas (opcional pero importante)
   */
  async deletePhotos(windowId) {
    await pool.query(
      `DELETE FROM visit_photos WHERE tipo = $1`,
      [`ventana_${windowId}`]
    );
  }
}

module.exports = WindowRepository;