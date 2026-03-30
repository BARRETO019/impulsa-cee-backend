// src/modules/auth/infrastructure/auth/token.service.js
const jwt = require('jsonwebtoken');

class TokenService {
  generate(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '8h'
    });
  }
}

module.exports = TokenService;