const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const visitId = req.params.id;
    // Creamos carpeta temporal por visita
    const uploadPath = path.join(__dirname, '../../uploads/visits', visitId.toString());
    
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Nombre único para evitar conflictos
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueName + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB máximo por foto
});

// CAMBIO APLICADO: Usamos .any() para que acepte archivos de cualquier campo (fotos, fotos_fachada, etc.)
module.exports = upload.any();