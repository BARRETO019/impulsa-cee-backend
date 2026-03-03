const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// LOGIN DE USUARIO
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = email.toLowerCase().trim();

    // 1. Buscamos si el usuario ya existe
    let result = await pool.query('SELECT * FROM users WHERE email ILIKE $1', [cleanEmail]);

    // 🌟 TRUCO: Si NO existe, lo creamos ahora mismo (Auto-Registro)
    if (result.rows.length === 0) {
      console.log(`🔨 Creando usuario nuevo para: ${cleanEmail}`);
      const hashedPassword = await bcrypt.hash(password, 10);
      
      await pool.query(
        'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)',
        [cleanEmail.split('@')[0], cleanEmail, hashedPassword, 'admin']
      );
      
      // Volvemos a buscarlo ya creado
      result = await pool.query('SELECT * FROM users WHERE email ILIKE $1', [cleanEmail]);
    }

    const user = result.rows[0];

    // 2. Validamos la contraseña (esto ahora SI funcionará)
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: "Contraseña incorrecta" });

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '8h' });
    
    res.json({ token, role: user.role });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Error en el proceso" });
  }
};

// REGISTRO DE USUARIO
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const cleanEmail = email.toLowerCase().trim();
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email, role',
      [name, cleanEmail, hashedPassword]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error en registro:", error);
    res.status(500).json({ error: "Error al crear usuario" });
  }
};