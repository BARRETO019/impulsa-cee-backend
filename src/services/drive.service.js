const { google } = require('googleapis');
const fs = require('fs');
const oauthService = require('./oauth.service');

// ID de la carpeta que me pasaste
const MASTER_FOLDER_ID = '1eod4hiRkbDxIk55U7DzVnq-HBIkxIRZr';

function getDrive() {
  const auth = oauthService.getAuthenticatedClient();
  return google.drive({ version: 'v3', auth });
}

// 1. BUSCAR CARPETA POR NOMBRE (Solo dentro de la carpeta maestra)
exports.findFolderByName = async (folderName) => {
  const drive = getDrive();
  // Escapamos comillas simples por si el cliente se llama "O'Connor"
  const safeName = folderName.replace(/'/g, "\\'");
  
  const query = `mimeType='application/vnd.google-apps.folder' and name='${safeName}' and '${MASTER_FOLDER_ID}' in parents and trashed=false`;

  const response = await drive.files.list({
    q: query,
    fields: 'files(id, name)',
  });

  return response.data.files.length > 0 ? response.data.files[0] : null;
};

// 2. CREAR CARPETA (Siempre dentro de la carpeta maestra)
exports.createFolder = async (folderName) => {
  const drive = getDrive();
  const fileMetadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
    parents: [MASTER_FOLDER_ID] // Forzamos que se cree dentro de tu link
  };

  const folder = await drive.files.create({
    resource: fileMetadata,
    fields: 'id',
  });

  console.log(`✅ Carpeta '${folderName}' creada dentro de la carpeta maestra.`);
  return folder.data.id;
};

// 3. OBTENER O CREAR CARPETA CLIENTE
exports.getOrCreateClientFolder = async (clientName) => {
  const existingFolder = await exports.findFolderByName(clientName);
  if (existingFolder) {
    return existingFolder.id;
  }
  return await exports.createFolder(clientName);
};

// 4. SUBIR ARCHIVO A CARPETA DEL CLIENTE
exports.uploadFile = async (filePath, fileName, clientFolderName) => {
  const drive = getDrive();
  
  // Primero obtenemos el ID de la carpeta del cliente
  const folderId = await exports.getOrCreateClientFolder(clientFolderName);

  const fileMetadata = {
    name: fileName, // Aquí puedes poner el nombre que quieras para el archivo
    parents: [folderId],
  };

  const media = {
    // Quitamos el mimeType fijo para que Drive lo detecte (JPG, PDF, etc)
    body: fs.createReadStream(filePath),
  };

  const file = await drive.files.create({
    resource: fileMetadata,
    media: media,
    fields: 'id',
  });

  // IMPORTANTE: Borrar el archivo temporal de Render después de subirlo
  fs.unlinkSync(filePath); 

  console.log(`✅ Archivo '${fileName}' subido a la carpeta de '${clientFolderName}'.`);
  return file.data.id;
};