const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// ===============================
// 1. FUNCIÓN DE AUTENTICACIÓN (EL CÓDIGO DE TU CAPTURA)
// ===============================
function getDrive() {
  try {
    const jsonString = process.env.GOOGLE_SERVICE_ACCOUNT;
    
    if (!jsonString) {
      throw new Error("La variable GOOGLE_SERVICE_ACCOUNT está vacía en Render.");
    }

    const serviceAccount = JSON.parse(jsonString);

    // LOG DE SEGURIDAD
    console.log("Campos detectados en el JSON:", Object.keys(serviceAccount));

    const clientEmail = serviceAccount.client_email;
    const privateKey = serviceAccount.private_key;

    if (!clientEmail || !privateKey) {
      throw new Error(`Faltan campos críticos en el JSON. Email: ${!!clientEmail}, Key: ${!!privateKey}`);
    }

    const auth = new google.auth.JWT(
      clientEmail,
      null,
      privateKey.replace(/\\n/g, '\n'),
      ['https://www.googleapis.com/auth/drive']
    );

    return google.drive({ version: 'v3', auth });
  } catch (error) {
    console.error("Error detallado en Drive Auth:", error.message);
    throw new Error("Fallo en la autenticación de Drive: " + error.message);
  }
}

// ===============================
// 2. BUSCAR CARPETA POR NOMBRE
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
// 3. CREAR CARPETA
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
// 4. OBTENER O CREAR CARPETA CLIENTE
// ===============================
exports.getOrCreateClientFolder = async (clientName) => {
  const existingFolder = await exports.findFolderByName(clientName);
  if (existingFolder) {
    return existingFolder.id;
  }
  return await exports.createFolder(clientName);
};

// ===============================
// 5. SUBIR ARCHIVO A CARPETA
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

  return file.data.id;
};