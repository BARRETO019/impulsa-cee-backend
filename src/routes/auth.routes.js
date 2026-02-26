// Importamos express
const express = require('express');
const router = express.Router();

// Importamos controlador
const authController = require('../controllers/auth.controller');

// Importamos servicio OAuth
const oauthService = require('../services/oauth.service');

// Middlewares
const verifyToken = require('../middleware/auth.middleware');
const verifyRole = require('../middleware/role.middleware');

// Rate limiter solo para LOGIN
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Demasiados intentos. Intenta más tarde."
});

/**
 * =====================================================
 *                 AUTH NORMAL
 * =====================================================
 */

/**
 * SOLO ADMIN PUEDE REGISTRAR USUARIOS
 */
router.post(
  '/register',
  verifyToken,
  verifyRole('admin'),
  authController.register
);

/**
 * LOGIN (público) + rate limit
 */
router.post(
  '/login',
  loginLimiter,
  authController.login
);

/**
 * =====================================================
 *              GOOGLE DRIVE OAUTH
 * =====================================================
 */

// Generar URL de autorización
router.get('/drive/auth-url', (req, res) => {
  const url = oauthService.getAuthUrl();
  res.json({ url });
});

// Recibir código y guardar token
router.get('/drive/callback', async (req, res) => {
  const { code } = req.query;

  try {
    await oauthService.saveToken(code);
    res.send('Drive autorizado correctamente 🚀');
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error autorizando Drive' });
  }
});

module.exports = router;