/**
 * ==========================================
 * MIDDLEWARE DE CONTROL DE ROLES (ACL)
 * ==========================================
 */

const verifyRole = (allowed) => {
  const allowedRoles = Array.isArray(allowed) ? allowed : [allowed];

  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no autenticado'
        });
      }

      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para esta acción'
        });
      }

      next();

    } catch (error) {
      console.error('Error en verifyRole:', error);
      return res.status(500).json({
        success: false,
        message: 'Error verificando permisos'
      });
    }
  };
};

module.exports = verifyRole;

