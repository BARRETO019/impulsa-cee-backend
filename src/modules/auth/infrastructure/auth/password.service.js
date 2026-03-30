// src/modules/auth/infrastructure/auth/password.service.js
const bcrypt = require('bcrypt');

class PasswordService {
  async hash(password) {
    return bcrypt.hash(password, 10);
  }

  async compare(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
  }
}

module.exports = PasswordService;