const axios = require('axios');

const BASE_ID = process.env.AIRTABLE_BASE_ID;
const TABLE_NAME = process.env.AIRTABLE_TABLE_NAME;
const TOKEN = process.env.AIRTABLE_TOKEN;

const airtableApi = axios.create({
  baseURL: `https://api.airtable.com/v0/${BASE_ID}`,
  headers: {
    Authorization: `Bearer ${TOKEN}`,
    'Content-Type': 'application/json'
  }
});

// 1. Obtener registros planeados
async function getPlaneados() {
  try {
    const response = await airtableApi.get(`/${TABLE_NAME}`, {
      params: {
        filterByFormula: `{Estado}="4. Planeado"`
      }
    });
    return response.data.records;
  } catch (error) {
    console.error('Error Airtable (getPlaneados):', error.response?.data || error.message);
    throw error;
  }
}

// 2. Actualizar estado
async function updateEstado(recordId, nuevoEstado) {
  try {
    const response = await airtableApi.patch(`/${TABLE_NAME}/${recordId}`, {
      fields: {
        Estado: nuevoEstado
      }
    });

    console.log(`Airtable: Registro ${recordId} actualizado a ${nuevoEstado} ✅`);
    return response.data;

  } catch (error) {
    console.error('Error Airtable (updateEstado):', error.response?.data || error.message);
    throw error;
  }
}

module.exports = {
  getPlaneados,
  updateEstado
};

console.log('--- Diagnóstico Airtable ---');
console.log('Base ID:', BASE_ID ? 'OK ✅' : 'FALTA ❌');
console.log('Table Name:', TABLE_NAME ? 'OK ✅' : 'FALTA ❌');
console.log('Token:', TOKEN ? 'Configurado ✅' : 'FALTA ❌');