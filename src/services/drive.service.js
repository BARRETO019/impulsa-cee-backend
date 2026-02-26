const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// ===============================
// OBTENER CLIENTE OAUTH
// ===============================

const oauthService = require('./oauth.service');

function getDrive() {
  const auth = oauthService.getAuthenticatedClient();
  return google.drive({ version: 'v3', auth });
}

// ===============================
// BUSCAR CARPETA POR NOMBRE (opcionalmente dentro de parent)
// ===============================

exports.findFolderByName = async (folderName, parentId = null) => {

  const drive = getDrive();

  let query = `
    mimeType='application/vnd.google-apps.folder'
    and name='${folderName}'
    and trashed=false
  `;

  if (parentId) {
    query += ` and '${parentId}' in parents`;
  }

  const response = await drive.files.list({
    q: query,
    fields: 'files(id, name)',
  });

  return response.data.files.length > 0
    ? response.data.files[0]
    : null;
};

// ===============================
// CREAR CARPETA (CON PARENT OPCIONAL)
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

  return folder.data.id;
};

// ===============================
// OBTENER O CREAR CARPETA CLIENTE
// ===============================

exports.getOrCreateClientFolder = async (clientName) => {

  const existingFolder = await exports.findFolderByName(clientName);

  if (existingFolder) {
    return existingFolder.id;
  }

  return await exports.createFolder(clientName);
};

// ===============================
// SUBIR ARCHIVO A CARPETA
// ===============================

exports.uploadFile = async (filePath, fileName, parentId) => {

  const drive = getDrive();

  const fileMetadata = {
    name: fileName,
    parents: [parentId],
  };

  const media = {
    mimeType: 'application/octet-stream',
    body: fs.createReadStream(filePath),
  };

  const file = await drive.files.create({
    resource: fileMetadata,
    media,
    fields: 'id',
  });

  return file.data.id;
};
