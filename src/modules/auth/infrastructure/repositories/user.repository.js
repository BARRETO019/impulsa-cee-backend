// src/modules/auth/infrastructure/repositories/user.repository.js
const pool = require('../../../../config/db');

class UserRepository {
  async findByEmail(email) {
    const result = await pool.query(
      'SELECT * FROM users WHERE email ILIKE $1',
      [email]
    );
    return result.rows[0] || null;
  }

  async create({ name, email, password }) {
    const result = await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email, role',
      [name, email, password]
    );
    return result.rows[0];
  }
}

module.exports = UserRepository;