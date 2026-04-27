const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const pool = require('./config/db');

const app = express();

// ==============================
// 1. CONFIGURACIÓN DE CORS (ESTÁTICA)
// ==============================
const corsOptions = {
  origin: 'https://impulsa-cee-frontend.vercel.app',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200 // Responde OK a los navegadores que hacen preflight
};

// Aplicar CORS antes de cualquier otro middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ==============================
// 2. SEGURIDAD (HELMET)
// ==============================
app.use(helmet({
  // Importante: permite que recursos de otros dominios se carguen si es necesario
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// ==============================
// 3. MIDDLEWARES ESTÁNDAR
// ==============================
app.use(express.json({ limit: "10mb" }));
app.use(morgan('dev'));

// Limitar intentos de login para seguridad
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Demasiados intentos, prueba en 15 minutos."
});

// ==============================
// 4. CONEXIÓN DB (VERIFICACIÓN)
// ==============================
pool.query('SELECT NOW()')
  .then(res => console.log('DB conectada correctamente'))
  .catch(err => console.error('Error crítico conectando a la DB:', err));

// ==============================
// 5. RUTAS
// ==============================

// Rutas de autenticación con el limitador aplicado
const authRoutes = require('./modules/auth/presentation/routes/auth.routes');
app.use('/api/auth', loginLimiter, authRoutes);

const inspectionRoutes = require('./routes/inspection.routes');
app.use('/api/visits', inspectionRoutes);

// Health Check para Cloud Run
app.get('/', (req, res) => {
  res.json({ 
    status: "online",
    message: "API CEE funcionando 🚀" 
  });
});

// ==============================
// 6. EXPORTAR O ESCUCHAR
// ==============================
// Asegúrate de que tu archivo de entrada (index.js o server.js) 
// use process.env.PORT para el app.listen
module.exports = app;