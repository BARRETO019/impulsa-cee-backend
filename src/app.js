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
// CORS (CORREGIDO)
// ==============================

const allowedOrigins = [
  "http://localhost:5173",
  "https://impulsa-cee-frontend.vercel.app"
];

app.use(cors({
  origin: function (origin, callback) {

    // Permitir requests sin origin (Postman, mobile apps, etc)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.log("❌ CORS bloqueado:", origin);
    return callback(new Error("CORS no permitido"), false);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

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

app.get('/', (req, res) => {
  res.json({ message: "API CEE funcionando 🚀" });
});

module.exports = app;