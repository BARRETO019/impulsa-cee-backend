exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = email ? email.toLowerCase().trim() : '';

    console.log("--- DEBUG LOGIN ---");
    console.log("Email recibido:", cleanEmail);

    // 🔑 LLAVE MAESTRA TEMPORAL (Solo para probar)
    // Si entras con este email y clave, saltamos la base de datos
    if (cleanEmail === 'admin@test.com' && password === '123456') {
      console.log("✅ Usando llave maestra");
      const token = jwt.sign(
        { id: 0, role: 'admin' },
        process.env.JWT_SECRET || 'secret_temporal',
        { expiresIn: '8h' }
      );
      return res.json({ token, role: 'admin' });
    }

    // Buscamos en la base de datos
    const result = await pool.query(
      'SELECT * FROM users WHERE email ILIKE $1',
      [cleanEmail]
    );

    if (result.rows.length === 0) {
      console.log("❌ Usuario no encontrado en Neon");
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const user = result.rows[0];
    console.log("👤 Usuario encontrado:", user.email);

    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      console.log("❌ Contraseña incorrecta para:", cleanEmail);
      // Imprimimos el hash para comparar (solo en debug)
      console.log("Hash en DB:", user.password);
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    console.log("✅ Login exitoso via DB");
    res.json({ token, role: user.role });

  } catch (error) {
    console.error("❌ ERROR CRÍTICO EN LOGIN:", error);
    res.status(500).json({ error: "Error interno" });
  }
};