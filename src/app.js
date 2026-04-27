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

// * CORS PARA RENDER *
const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL,                 // desde variable
  "https://impulsa-cee-frontend.onrender.com"  // fijo por seguridad
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error("CORS bloqueado: " + origin), false);
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
};

// ✅ SOLUCIÓN RADICAL: Aplicamos CORS globalmente. 
// Esto maneja automáticamente los OPTIONS sin necesidad de definir rutas con "*"
app.use(cors(corsOptions));

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