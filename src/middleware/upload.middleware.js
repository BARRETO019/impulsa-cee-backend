const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const visitId = req.params.id;
    // Ruta corregida para asegurar que apunta a la carpeta de uploads del proyecto
    const uploadPath = path.join(__dirname, '../../uploads/visits', visitId.toString());

    // Crear carpeta si no existe (mantenemos tu lógica funcional)
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },

  filename: function (req, file, cb) {
    // Nombre único para evitar que fotos con el mismo nombre se sobreescriban
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueName + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Subido a 10MB para fotos de alta calidad
});

// CLAVE DEL CAMBIO: Exportamos directamente el método .array() 
// indicando que el campo del formulario se llama 'photo'
module.exports = upload.array('photo', 10);