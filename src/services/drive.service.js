const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// ===============================
// CONFIGURACIÓN DE AUTENTICACIÓN (Service Account)
// ===============================

// Función interna para obtener la instancia de Drive autenticada
// ===============================
// ===============================

function getDrive() {
  try {
    // 1. Leemos el JSON de la variable de entorno de Render
    if (!process.env.GOOGLE_SERVICE_ACCOUNT) {
      throw new Error("La variable GOOGLE_SERVICE_ACCOUNT no está definida en Render");
    }

    const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);

    // 2. Usamos serviceAccount (asegúrate de que coincida con la variable de arriba)
    const auth = new google.auth.JWT(
      serviceAccount.client_email,
      null,
      serviceAccount.private_key.replace(/\\n/g, '\n'), // Aquí es donde fallaba
      ['https://www.googleapis.com/auth/drive']
    );

    return google.drive({ version: 'v3', auth });
  } catch (error) {
    console.error("Error al inicializar Google Drive Service Account:", error.message);
    throw new Error("Fallo en la autenticación de Drive: " + error.message);
  }
}

// ===============================
// BUSCAR CARPETA POR NOMBRE
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

  return response.data.files.length > 0 ? response.data.files[0] : null;
};

// ===============================
// CREAR CARPETA
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
    mimeType: 'image/jpeg', // Cambiado de octet-stream para que Drive lo reconozca como imagen
    body: fs.createReadStream(filePath),
  };

  const file = await drive.files.create({
    resource: fileMetadata,
    media: media,
    fields: 'id',
  });

  return file.data.id;
};