require('dotenv').config();
const app = require('./src/app');

// ⚠️ Cloud Run usa SIEMPRE 8080
const PORT = process.env.PORT || 8080;

// 👇 MUY IMPORTANTE: escuchar en 0.0.0.0
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor funcionando en puerto ${PORT}`);
});