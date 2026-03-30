const pool = require('../../../../config/db');

/**
 * Repositorio de documentos
 * -------------------------
 * Encapsula acceso a datos relacionado con:
 * - visita
 * - building
 * - envelope
 * - windows
 * - installations
 * - photos
 * - estado de visita
 */
class DocumentRepository {
  /**
   * Obtener datos completos de una visita
   * (esto antes estaba en getFullVisitData)
   */
  async getFullVisitData(id) {
    const visit = (await pool.query(
      `SELECT * FROM visits WHERE id = $1`,
      [id]
    )).rows[0];

    const building = (await pool.query(
      `SELECT * FROM visit_building WHERE visit_id = $1`,
      [id]
    )).rows[0];

    const envelope = (await pool.query(
      `SELECT * FROM visit_envelope WHERE visit_id = $1`,
      [id]
    )).rows;

    const windows = (await pool.query(
      `SELECT * FROM visit_windows WHERE visit_id = $1`,
      [id]
    )).rows;

    const installations = (await pool.query(
      `SELECT * FROM visit_installations WHERE visit_id = $1`,
      [id]
    )).rows;

    const photos = (await pool.query(
      `SELECT * FROM visit_photos WHERE visit_id = $1`,
      [id]
    )).rows;

    return {
      visit,
      building,
      envelope,
      windows,
      installations,
      photos
    };
  }

  /**
   * Marcar visita como finalizada
   */
  async finalizeVisit(id) {
    await pool.query(
      `UPDATE visits SET estado = 'finalizada' WHERE id = $1`,
      [id]
    );
  }
}

module.exports = DocumentRepository;