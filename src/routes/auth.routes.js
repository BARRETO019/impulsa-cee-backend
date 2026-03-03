const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const oauthService = require('../services/oauth.service');
const verifyToken = require('../middleware/auth.middleware');
const verifyRole = require('../middleware/role.middleware');
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Demasiados intentos. Intenta más tarde."
});

/**
 * =====================================================
 * AUTH - REGISTRO Y LOGIN
 * =====================================================
 */

// ✅ REGISTRO ABIERTO TEMPORALMENTE
// Hemos quitado verifyToken y verifyRole para que puedas crear tu usuario en Neon
router.post('/register', authController.register);

// LOGIN (público) + rate limit
router.post('/login', loginLimiter, authController.login);


/**
 * =====================================================
 * GOOGLE DRIVE OAUTH
 * =====================================================
 */
router.get('/drive/auth-url', (req, res) => {
  const url = oauthService.getAuthUrl();
  res.json({ url });
});

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