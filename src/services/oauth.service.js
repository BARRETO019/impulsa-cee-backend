const { google } = require('googleapis');

// =====================================================
// CONFIGURACIÓN DESDE VARIABLES DE ENTORNO
// =====================================================

const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);
// 👇 AÑADE ESTO AQUÍ
console.log("CLIENT_ID:", process.env.GOOGLE_CLIENT_ID);
console.log("REFRESH_TOKEN:", process.env.GOOGLE_REFRESH_TOKEN);


// Asignamos directamente el refresh token guardado en Render
oAuth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN
});

// =====================================================
// OBTENER CLIENTE AUTENTICADO
// =====================================================

exports.getAuthenticatedClient = () => {
  return oAuth2Client;
};