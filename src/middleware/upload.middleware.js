const multer = require('multer');
const { Storage } = require('@google-cloud/storage');
const path = require('path');

// ==============================
// MULTER (memoria)
// ==============================
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// ==============================
// GCP STORAGE CONFIG
// ==============================
const storage = new Storage({
  keyFilename: path.join(__dirname, '../config/gcp-key.json'),
});

const bucket = storage.bucket('impulsa-cee-uploads');

// ==============================
// MIDDLEWARE PRINCIPAL
// ==============================
const uploadMiddleware = [
  upload.any(),

  async (req, res, next) => {
    try {
      if (!req.files || req.files.length === 0) {
        return next();
      }

      console.log("📸 Archivos recibidos:", req.files.length);

      const uploadPromises = req.files.map(async (file) => {
        const fileName = `${Date.now()}-${file.originalname}`;
        const blob = bucket.file(fileName);

        const blobStream = blob.createWriteStream({
          resumable: false,
          metadata: {
            contentType: file.mimetype,
          },
        });

        // 👇 esperamos a que termine la subida
        await new Promise((resolve, reject) => {
          blobStream.on('finish', resolve);
          blobStream.on('error', reject);
          blobStream.end(file.buffer);
        });

        // ==============================
        // 🔐 GENERAR SIGNED URL (LA CLAVE)
        // ==============================
        const [signedUrl] = await blob.getSignedUrl({
          action: 'read',
          expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 días
        });

        return signedUrl;
      });

      const urls = await Promise.all(uploadPromises);

      console.log("✅ URLs firmadas generadas:", urls);

      req.filesUrls = urls;

      next();

    } catch (error) {
      console.error("❌ ERROR SUBIENDO A GCS:", error);

      return res.status(500).json({
        error: 'Error subiendo archivos a GCS',
        detalle: error.message,
      });
    }
  }
];

module.exports = uploadMiddleware;