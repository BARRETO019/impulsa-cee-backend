// Importamos bcrypt para encriptar contraseñas
const bcrypt = require('bcrypt');

// Importamos jsonwebtoken para generar tokens JWT
const jwt = require('jsonwebtoken');

// Importamos la conexión a la base de datos
const pool = require('../config/db');


/**
 * ==========================
 * REGISTRO DE USUARIO
 * ==========================
 * Crea un nuevo técnico en la base de datos
 */
exports.register = async (req, res) => {
  try {

    // Extraemos los datos enviados desde el frontend
    const { name, email, password } = req.body;

    // Encripta la contraseña antes de guardarla
    // El número 10 es el salt (nivel de seguridad)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertamos el nuevo usuario en la base de datos
    const result = await pool.query(
      `
      INSERT INTO users (name, email, password)
      VALUES ($1, $2, $3)
      RETURNING id, name, email, role
      `,
      [name, email, hashedPassword]
    );

    // Devolvemos el usuario creado (sin contraseña)
    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error(error);

    // En caso de error devolvemos mensaje genérico
    res.status(500).json({ error: "Error creando usuario" });
  }
};


/**
 * ==========================
 * LOGIN DE USUARIO
 * ==========================
 * Verifica email + contraseña
 * Si son correctos, genera un JWT
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email y contraseña obligatorios" });
    }

    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const user = result.rows[0];

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    if (!process.env.JWT_SECRET) {
      console.error("❌ ERROR: JWT_SECRET no definido.");
      return res.status(500).json({ error: "Error interno" });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    // 👇 ESTA ES LA RESPUESTA CORRECTA
    res.json({
      token,
      role: user.role
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error en login" });
  }
};