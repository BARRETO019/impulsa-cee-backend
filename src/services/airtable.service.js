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

// Obtener registros con Estado = Planeado
exports.getPlaneados = async () => {
  try {
    const response = await airtableApi.get(`/${TABLE_NAME}`, {
      params: {
        filterByFormula: `{Estado}="4. Planeado"`
      }
    });

    return response.data.records;

  } catch (error) {
    console.error('Error Airtable:', error.response?.data || error.message);
    throw error;
  }
};
exports.updateEstado = async (recordId, nuevoEstado) => {
  try {
    const response = await airtableApi.patch(`/${TABLE_NAME}/${recordId}`, {
      fields: {
       Estado: "5. En curso"
      }
    });

    return response.data;

  } catch (error) {
    console.error('Error actualizando Airtable:', error.response?.data || error.message);
    throw error;
  }
};