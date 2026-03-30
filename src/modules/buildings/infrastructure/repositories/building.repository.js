const pool = require('../../../../config/db');

class BuildingRepository {
  async updateVisitData(id, data) {
    const {
      ano_construccion,
      motivo_certificado,
      num_plantas,
      alturas_plantas,
      potencia_instalada
    } = data;

    await pool.query(
      `UPDATE visits 
       SET ano_construccion=$1, motivo_certificado=$2, num_plantas=$3, alturas_plantas=$4, potencia_instalada=$5 
       WHERE id=$6`,
      [
        ano_construccion,
        motivo_certificado,
        num_plantas,
        alturas_plantas,
        potencia_instalada || null,
        id
      ]
    );
  }

  async upsertBuildingData(id, data) {
    const {
      zona_climatica,
      normativa,
      referencia_catastral,
      superficie_habitable
    } = data;

    const query = `
      INSERT INTO visit_building (
        visit_id,
        zona_climatica,
        normativa,
        referencia_catastral,
        superficie_habitable
      ) 
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (visit_id) 
      DO UPDATE SET 
        zona_climatica = EXCLUDED.zona_climatica,
        normativa = EXCLUDED.normativa,
        referencia_catastral = EXCLUDED.referencia_catastral,
        superficie_habitable = EXCLUDED.superficie_habitable
    `;

    await pool.query(query, [
      id,
      zona_climatica,
      normativa || 'NBE-CT-79',
      referencia_catastral || '',
      superficie_habitable || 0
    ]);
  }
}

module.exports = BuildingRepository;