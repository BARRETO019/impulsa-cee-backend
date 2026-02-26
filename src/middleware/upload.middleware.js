/**
 * =====================================================
 * CONFIGURACIÓN DE MULTER PARA SUBIDA DE FOTOS
 * =====================================================
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuración de almacenamiento
const storage = multer.diskStorage({

  /**
   * Destino dinámico:
   * Creamos carpeta por visita:
   * uploads/visits/{visit_id}
   */
  destination: function (req, file, cb) {

    const visitId = req.params.id;

    const uploadPath = path.join(
      __dirname,
      '../../uploads/visits',
      visitId.toString()
    );

    // Crear carpeta si no existe
    fs.mkdirSync(uploadPath, { recursive: true });

    cb(null, uploadPath);
  },

  /**
   * Nombre único para evitar colisiones
   */
  filename: function (req, file, cb) {

    const uniqueName =
      Date.now() + '-' + Math.round(Math.random() * 1E9);

    cb(null, uniqueName + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB máximo
});

module.exports = upload;
