const pool = require('../../../../config/db');

class VisitRepository {
  async create({ tecnicoId, direccion, municipio, provincia }) {
    const query = `
      INSERT INTO visits (tecnico_id, direccion, municipio, provincia, estado, superficie)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await pool.query(query, [
      tecnicoId,
      direccion,
      municipio,
      provincia,
      'borrador',
      0
    ]);

    return result.rows[0];
  }

  async findByTechnicianId(tecnicoId) {
    const result = await pool.query(
      `SELECT * FROM visits WHERE tecnico_id = $1 ORDER BY created_at DESC`,
      [tecnicoId]
    );

    return result.rows;
  }

  async deleteById(id) {
    const result = await pool.query(
      `DELETE FROM visits WHERE id = $1 RETURNING *`,
      [id]
    );

    return result.rows[0] || null;
  }
}

module.exports = VisitRepository;