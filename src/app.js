const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const pool = require('./config/db');

const app = express();

// ==============================
// SEGURIDAD
// ==============================

app.use(helmet());

// ==============================
// CORS (VERSIÓN SIMPLE Y FUNCIONAL)
// ==============================

app.use(cors({
  origin: true,       // 🔥 permite cualquier origin dinámicamente
  credentials: true
}));

// 🔥 MUY IMPORTANTE para Cloud Run (preflight)
app.options('*', cors());

// ==============================
// MIDDLEWARES
// ==============================

app.use(express.json({ limit: "10mb" }));

// Limitar intentos de login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10
});

app.use('/api/auth/login', loginLimiter);

app.use(morgan('dev'));

// ==============================
// CONEXIÓN DB
// ==============================

pool.query('SELECT NOW()')
  .then(res => console.log('DB conectada:', res.rows[0]))
  .catch(err => console.error('Error DB:', err));

// ==============================
// RUTAS
// ==============================

const authRoutes = require('./modules/auth/presentation/routes/auth.routes');
app.use('/api/auth', authRoutes);

const inspectionRoutes = require('./routes/inspection.routes');
app.use('/api/visits', inspectionRoutes);

// ==============================
// ROOT
// ==============================

app.get('/', (req, res) => {
  res.json({ message: "API CEE funcionando 🚀" });
});

module.exports = app;