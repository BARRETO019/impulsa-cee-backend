const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const pool = require('./config/db');

const app = express();

// ==============================
// 1. CORS - DEBE IR PRIMERO
// ==============================
// Esto maneja las cabeceras antes que cualquier otro middleware
app.use(cors({
  origin: 'https://impulsa-cee-frontend.vercel.app', // URL exacta de tu frontend
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Responder a peticiones preflight (OPTIONS) de manera global
app.options('*', cors());

// ==============================
// 2. SEGURIDAD (HELMET)
// ==============================
app.use(helmet({
  // Esto es vital para que Helmet no bloquee la comunicación entre dominios
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// ==============================
// 3. MIDDLEWARES ESTÁNDAR
// ==============================
app.use(express.json({ limit: "10mb" }));
app.use(morgan('dev'));

// Limitar intentos de login (Protección de fuerza bruta)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,
  message: "Demasiados intentos de inicio de sesión, intenta de nuevo en 15 minutos"
});

// ==============================
// 4. CONEXIÓN DB
// ==============================
pool.query('SELECT NOW()')
  .then(res => console.log('DB conectada:', res.rows[0]))
  .catch(err => console.error('Error DB:', err));

// ==============================
// 5. RUTAS
// ==============================

// Aplicamos el limitador específicamente a la ruta de login
const authRoutes = require('./modules/auth/presentation/routes/auth.routes');
app.use('/api/auth', loginLimiter, authRoutes); 

const inspectionRoutes = require('./routes/inspection.routes');
app.use('/api/visits', inspectionRoutes);

// Root / Health Check
app.get('/', (req, res) => {
  res.json({ message: "API CEE funcionando 🚀" });
});

// ==============================
// EXPORTAR
// ==============================
module.exports = app;