const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

const fs = require('fs');

// Sin cache para CSS y JS (evitar versiones desactualizadas en móvil)
app.use((req, res, next) => {
  if (req.url.match(/\.(css|js)$/)) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
  }
  next();
});

// Servir sw.js directamente sin alterar CACHE_NAME
app.get('/sw.js', (req, res) => {
  const swPath = path.join(__dirname, 'sw.js');
  if (!fs.existsSync(swPath)) return res.status(404).send('Not found');

  const swContent = fs.readFileSync(swPath, 'utf8');

  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.send(swContent);
});

// Servir archivos estáticos desde la raíz del proyecto
app.use(express.static(path.join(__dirname)));

// Para cualquier otra ruta, servir index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor escuchando en http://0.0.0.0:${PORT}`);
  });
}

module.exports = app;

