const pool = require('../../../../config/db');

/**
 * Repositorio de envolvente
 * -------------------------
 * Aquí vive TODO el acceso a base de datos relacionado con:
 * - crear elementos de envolvente
 * - listar elementos de una visita
 * - borrar elementos
 *
 * Esta capa NO sabe nada de Express ni de req/res.
 */
class EnvelopeRepository {
  /**
   * Crea un nuevo elemento de envolvente para una visita
   */
  async create(visitId, data) {
    const {
      tipo,
      orientacion,
      superficie,
      transmitancia,
      largo,
      ancho,
      alto
    } = data;

    const query = `
      INSERT INTO visit_envelope (
        visit_id,
        tipo,
        nombre,
        superficie,
        orientacion,
        transmitancia,
        largo,
        ancho,
        alto
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const result = await pool.query(query, [
      visitId,
      tipo,
      tipo, // usamos tipo también como nombre
      superficie || 0,
      orientacion,
      transmitancia || 0,
      largo || 0,
      ancho || 0,
      alto || 0
    ]);

    return result.rows[0];
  }

  /**
   * Obtiene todos los elementos de envolvente de una visita
   */
  async findByVisitId(visitId) {
    const result = await pool.query(
      `SELECT * FROM visit_envelope WHERE visit_id = $1`,
      [visitId]
    );

    return result.rows;
  }

  /**
   * Borra un elemento concreto de envolvente
   */
  async deleteById(visitId, elementoId) {
    const result = await pool.query(
      `DELETE FROM visit_envelope WHERE id = $1 AND visit_id = $2 RETURNING *`,
      [elementoId, visitId]
    );

    return result.rows[0] || null;
  }
}

module.exports = EnvelopeRepository;