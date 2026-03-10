const { google } = require('googleapis');
const fs = require('fs');

function getDrive() {
  try {
    const jsonString = process.env.GOOGLE_SERVICE_ACCOUNT;
    if (!jsonString) throw new Error("Falta GOOGLE_SERVICE_ACCOUNT");

    const credentials = JSON.parse(jsonString);
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/drive'],
    });

    return google.drive({ version: 'v3', auth });
  } catch (error) {
    console.error("❌ ERROR AUTH:", error.message);
    throw error;
  }
}

// 1. BUSCAR
exports.findFolderByName = async (folderName, parentId = null) => {
  try {
    const drive = getDrive();
    let query = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`;
    if (parentId) query += ` and '${parentId}' in parents`;

    const response = await drive.files.list({
      q: query,
      fields: 'files(id, name)',
      supportsAllDrives: true, // AÑADIDO AQUI
      includeItemsFromAllDrives: true, // AÑADIDO AQUI
    });
    return response.data.files.length > 0 ? response.data.files[0] : null;
  } catch (error) {
    console.error("❌ ERROR BUSCANDO CARPETA:", error.response?.data || error.message);
    throw error;
  }
};

// 2. CREAR CARPETA
exports.createFolder = async (folderName, parentId = null) => {
  try {
    const drive = getDrive();
    const fileMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : []
    };
    const folder = await drive.files.create({ 
      resource: fileMetadata, 
      fields: 'id',
      supportsAllDrives: true // AÑADIDO AQUI TAMBIÉN
    });
    console.log(`✅ Carpeta '${folderName}' creada. ID:`, folder.data.id);
    return folder.data.id;
  } catch (error) {
    console.error("❌ ERROR CREANDO CARPETA:", error.response?.data || error.message);
    throw error;
  }
};

// 3. GET OR CREATE
exports.getOrCreateClientFolder = async (clientName) => {
  const existingFolder = await exports.findFolderByName(clientName);
  if (existingFolder) return existingFolder.id;
  return await exports.createFolder(clientName);
};

// 4. SUBIR FOTO
exports.uploadFile = async (filePath, fileName, parentId) => {
  try {
    const drive = getDrive();
    const fileMetadata = { name: fileName, parents: [parentId] };
    const media = {
      mimeType: 'image/jpeg',
      body: fs.createReadStream(filePath),
    };
    const file = await drive.files.create({ 
      resource: fileMetadata, 
      media: media, 
      fields: 'id',
      supportsAllDrives: true // AÑADIDO AQUI
    });
    console.log(`✅ Archivo '${fileName}' subido. ID:`, file.data.id);
    return file.data.id;
  } catch (error) {
    console.error("❌ ERROR SUBIENDO ARCHIVO:", error.response?.data || error.message);
    throw error;
  }
};