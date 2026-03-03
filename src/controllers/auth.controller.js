const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

/**
 * ==========================
 * REGISTRO DE USUARIO
 * ==========================
 */
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Encriptamos la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `
      INSERT INTO users (name, email, password)
      VALUES ($1, $2, $3)
      RETURNING id, name, email, role
      `,
      [name, email.toLowerCase().trim(), hashedPassword]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("❌ Error en Registro:", error);
    res.status(500).json({ error: "Error creando usuario" });
  }
};

/**
 * ==========================
 * LOGIN DE USUARIO
 * ==========================
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email y contraseña obligatorios" });
    }

    const cleanEmail = email.toLowerCase().trim();
    console.log(`--- Intento de login para: ${cleanEmail} ---`);

    // Buscamos al usuario usando ILIKE (insensible a mayúsculas)
    const result = await pool.query(
      'SELECT * FROM users WHERE email ILIKE $1',
      [cleanEmail]
    );

    // 1. Verificar si el usuario existe
    if (result.rows.length === 0) {
      console.log("⚠️ Login fallido: El email no existe en la base de datos.");
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const user = result.rows[0];

    // 2. Verificar la contraseña
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      console.log("⚠️ Login fallido: La contraseña no coincide con el hash guardado.");
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    // 3. Verificar JWT_SECRET
    if (!process.env.JWT_SECRET) {
      console.error("❌ ERROR CRÍTICO: JWT_SECRET no está configurado en las variables de entorno de Render.");
      return res.status(500).json({ error: "Error de configuración en el servidor" });
    }

    // Si todo está bien, generamos el token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    console.log(`✅ Login exitoso para: ${user.email} (Rol: ${user.role})`);

    res.json({
      token,
      role: user.role
    });

  } catch (error) {
    console.error("❌ Error interno en el controlador de Login:", error);
    res.status(500).json({ error: "Error en el servidor durante el login" });
  }
};