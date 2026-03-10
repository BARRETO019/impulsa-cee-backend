const { google } = require('googleapis');
const fs = require('fs');

function getDrive() {
  try {
    const jsonString = process.env.GOOGLE_SERVICE_ACCOUNT;
    
    if (!jsonString) {
      throw new Error("La variable GOOGLE_SERVICE_ACCOUNT no está definida en Render.");
    }

    const credentials = JSON.parse(jsonString);

    // Configuramos la autenticación usando GoogleAuth (más robusto para Identidad)
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: credentials.client_email,
        // Limpiamos la clave de posibles dobles escapes que a veces mete Render
        private_key: credentials.private_key.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/drive'],
    });

    return google.drive({ version: 'v3', auth });
  } catch (error) {
    console.error("❌ ERROR AUTENTICACIÓN DRIVE:", error.message);
    throw error;
  }
}

// --- MANTÉN TUS FUNCIONES EXPORTADAS ABAJO (findFolderByName, uploadFile, etc.) ---
// Asegúrate de que todas usen 'const drive = getDrive();' al principio.

exports.findFolderByName = async (folderName, parentId = null) => {
  const drive = getDrive();
  let query = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`;
  if (parentId) query += ` and '${parentId}' in parents`;

  const response = await drive.files.list({
    q: query,
    fields: 'files(id, name)',
  });
  return response.data.files.length > 0 ? response.data.files[0] : null;
};

exports.createFolder = async (folderName, parentId = null) => {
  const drive = getDrive();
  const fileMetadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
    parents: parentId ? [parentId] : []
  };
  const folder = await drive.files.create({ resource: fileMetadata, fields: 'id' });
  return folder.data.id;
};

exports.getOrCreateClientFolder = async (clientName) => {
  const existingFolder = await exports.findFolderByName(clientName);
  if (existingFolder) return existingFolder.id;
  return await exports.createFolder(clientName);
};

exports.uploadFile = async (filePath, fileName, parentId) => {
  const drive = getDrive();
  const fileMetadata = { name: fileName, parents: [parentId] };
  const media = {
    mimeType: 'image/jpeg',
    body: fs.createReadStream(filePath),
  };
  const file = await drive.files.create({ resource: fileMetadata, media: media, fields: 'id' });
  return file.data.id;
};