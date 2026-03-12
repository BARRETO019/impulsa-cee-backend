//contraseña temporal inicial 
const bcrypt = require('bcryptjs');

async function generar() {
  const hash = await bcrypt.hash("", 10);
  console.log(hash);
}

generar();