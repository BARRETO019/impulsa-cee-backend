// Importamos jsonwebtoken
const jwt = require('jsonwebtoken');

/**
 * ==========================================
 * MIDDLEWARE DE AUTENTICACIÓN JWT
 * ==========================================
 * Verifica que el usuario envíe un token válido
 * Si es válido → permite continuar
 * Si no → bloquea acceso
 */
const verifyToken = (req, res, next) => {

  // El token debe enviarse en el header:
  // Authorization: Bearer TOKEN
  const authHeader = req.headers.authorization;

  // Si no existe header → error
  if (!authHeader) {
    return res.status(401).json({ error: "Token requerido" });
  }

  // Extraemos el token quitando "Bearer "
  const token = authHeader.split(' ')[1];

  try {
    // Verificamos token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("TOKEN DECODIFICADO:", decoded);

    // Guardamos datos del usuario en la request
    req.user = decoded;

    // Continuamos hacia la ruta
    next();

  } catch (error) {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
};

module.exports = verifyToken;
