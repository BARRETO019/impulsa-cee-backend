require('dotenv').config();

const app = require('./src/app');

const PORT = process.env.PORT || 8080;

try {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor funcionando en puerto ${PORT}`);
  });
} catch (error) {
  console.error("❌ ERROR AL ARRANCAR:", error);
}