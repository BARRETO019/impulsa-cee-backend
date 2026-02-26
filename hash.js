//contraseña temporal inicial 
const bcrypt = require('bcryptjs');

async function generar() {
  const hash = await bcrypt.hash("Admin2025", 10);
  console.log(hash);
}

generar();