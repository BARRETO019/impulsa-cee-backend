const { google } = require('googleapis');
const fs = require('fs');

// Importamos servicio OAuth original
const oauthService = require('./oauth.service');

function getDrive() {
  // Aquí usamos tus credenciales (Refresh Token)
  const auth = oauthService.getAuthenticatedClient();
  return google.drive({ version: 'v3', auth });
}
// ===============================
// 1. BUSCAR CARPETA POR NOMBRE
// ===============================
exports.findFolderByName = async (folderName, parentId = null) => {
  const drive = getDrive();
  let query = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`;
  if (parentId) {
    query += ` and '${parentId}' in parents`;
  }

  const response = await drive.files.list({
    q: query,
    fields: 'files(id, name)',
  });

  return response.data.files.length > 0 ? response.data.files[0] : null;
};

// ===============================
// 2. CREAR CARPETA
// ===============================
exports.createFolder = async (folderName, parentId = null) => {
  const drive = getDrive();
  const fileMetadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
    parents: parentId ? [parentId] : []
  };

  const folder = await drive.files.create({
    resource: fileMetadata,
    fields: 'id',
  });

  console.log(`✅ Carpeta '${folderName}' creada exitosamente.`);
  return folder.data.id;
};

// ===============================
// 3. OBTENER O CREAR CARPETA CLIENTE
// ===============================
exports.getOrCreateClientFolder = async (clientName) => {
  const existingFolder = await exports.findFolderByName(clientName);
  if (existingFolder) {
    return existingFolder.id;
  }
  return await exports.createFolder(clientName);
};

// ===============================
// 4. SUBIR ARCHIVO A CARPETA
// ===============================
exports.uploadFile = async (filePath, fileName, parentId) => {
  const drive = getDrive();
  const fileMetadata = {
    name: fileName,
    parents: [parentId],
  };

  const media = {
    mimeType: 'image/jpeg',
    body: fs.createReadStream(filePath),
  };

  const file = await drive.files.create({
    resource: fileMetadata,
    media: media,
    fields: 'id',
  });

  console.log(`✅ Archivo '${fileName}' subido exitosamente a Drive.`);
  return file.data.id;
};