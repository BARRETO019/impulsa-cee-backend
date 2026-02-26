const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

// =====================================================
// CARGAR CREDENCIALES OAUTH
// =====================================================

const credentialsPath = path.resolve(__dirname, '../config/drive-credentials.json');

console.log('Cargando credenciales desde:', credentialsPath);

const credentials = require(credentialsPath);

console.log('Credenciales cargadas correctamente');

// Extraemos datos del JSON
const { client_secret, client_id, redirect_uris } =
  credentials.installed || credentials.web;

const oAuth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  'http://localhost:4000/api/auth/drive/callback'
);



// Ruta donde guardaremos el token
const TOKEN_PATH = path.join(__dirname, '../config/oauth-token.json');

// =====================================================
// GENERAR URL DE AUTORIZACIÓN
// =====================================================

exports.getAuthUrl = () => {
  const scopes = ['https://www.googleapis.com/auth/drive'];

  return oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
  });
};

// =====================================================
// GUARDAR TOKEN TRAS AUTORIZACIÓN
// =====================================================

exports.saveToken = async (code) => {
  const { tokens } = await oAuth2Client.getToken(code);

  oAuth2Client.setCredentials(tokens);

  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));

  console.log('Token guardado correctamente');

  return tokens;
};

// =====================================================
// OBTENER CLIENTE AUTENTICADO
// =====================================================

exports.getAuthenticatedClient = () => {
  if (!fs.existsSync(TOKEN_PATH)) {
    throw new Error('No existe token OAuth. Autoriza primero.');
  }

  const token = JSON.parse(fs.readFileSync(TOKEN_PATH));

  oAuth2Client.setCredentials(token);

  return oAuth2Client;
};

