const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// LOGIN (Vuelve a ser solo verificación)
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Faltan datos" });

    const cleanEmail = email.toLowerCase().trim();

    // Buscamos al usuario que YA existe en Neon
    const result = await pool.query('SELECT * FROM users WHERE email ILIKE $1', [cleanEmail]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const user = result.rows[0];

    // Comparamos con el hash que generamos en el paso anterior
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '8h' }
    );

    res.json({ token, role: user.role });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

// REGISTRO (Lo dejamos estándar por si lo necesitas luego)
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const cleanEmail = email.toLowerCase().trim();
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3)',
      [name, cleanEmail, hashedPassword]
    );
    res.status(201).json({ message: "Usuario creado" });
  } catch (error) {
    res.status(500).json({ error: "Error al registrar" });
  }
};