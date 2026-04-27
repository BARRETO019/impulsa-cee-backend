const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const pool = require('./config/db');

const app = express();

// ==============================
// 1. CONFIGURACIÓN DE CORS
// ==============================
const corsOptions = {
  origin: 'https://impulsa-cee-frontend.vercel.app',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};

// ✅ SOLO ESTO
app.use(cors(corsOptions));

// ==============================
// 2. SEGURIDAD
// ==============================
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// ==============================
// 3. MIDDLEWARES
// ==============================
app.use(express.json({ limit: "10mb" }));
app.use(morgan('dev'));

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Demasiados intentos, prueba en 15 minutos."
});

// ==============================
// 4. DB
// ==============================
pool.query('SELECT NOW()')
  .then(() => console.log('DB conectada correctamente'))
  .catch(err => console.error('Error DB:', err));

// ==============================
// 5. RUTAS
// ==============================
const authRoutes = require('./modules/auth/presentation/routes/auth.routes');
app.use('/api/auth', loginLimiter, authRoutes);

const inspectionRoutes = require('./routes/inspection.routes');
app.use('/api/visits', inspectionRoutes);

app.get('/', (req, res) => {
  res.json({ status: "online", message: "API CEE funcionando 🚀" });
});

module.exports = app;