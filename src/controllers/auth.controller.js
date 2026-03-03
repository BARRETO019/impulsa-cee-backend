const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// REGISTRO
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email, role',
      [name, email.toLowerCase().trim(), hashedPassword]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error en registro:", error);
    res.status(500).json({ error: "Error al registrar" });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = email ? email.toLowerCase().trim() : '';

    // 🔑 LLAVE MAESTRA DE EMERGENCIA
    if (cleanEmail === 'admin@test.com' && password === '123456') {
      const token = jwt.sign({ id: 0, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '8h' });
      return res.json({ token, role: 'admin' });
    }

    const result = await pool.query('SELECT * FROM users WHERE email ILIKE $1', [cleanEmail]);
    if (result.rows.length === 0) return res.status(401).json({ error: "Credenciales inválidas" });

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: "Credenciales inválidas" });

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, role: user.role });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ error: "Error interno" });
  }
};