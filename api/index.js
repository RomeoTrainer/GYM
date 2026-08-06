const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();

// Sin cache para CSS y JS
app.use((req, res, next) => {
  if (req.url.match(/\.(css|js)$/)) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
  }
  next();
});

// Servir sw.js dinámicamente inyectando versión automática
app.get('/sw.js', (req, res) => {
  const swPath = path.join(process.cwd(), 'sw.js');
  if (!fs.existsSync(swPath)) return res.status(404).send('Not found');

  let swContent = fs.readFileSync(swPath, 'utf8');
  let maxTime = 0;
  const filesToCheck = ['shared.js', 'styles.css', 'rutinas.html', 'index.html', 'usuarios.html', 'entrenamiento.html', 'progreso.html', 'recetas.html', 'macros.html', 'creditos.html', 'persist.js'];
  
  filesToCheck.forEach(f => {
    try {
      const p = path.join(process.cwd(), f);
      if (fs.existsSync(p)) {
        const stat = fs.statSync(p);
        if (stat.mtimeMs > maxTime) maxTime = stat.mtimeMs;
      }
    } catch(e) {}
  });

  const autoVer = 'auto-' + Math.floor(maxTime);
  swContent = swContent.replace(/const CACHE_NAME = ['"][^'"]+['"];/, `const CACHE_NAME = 'romeo-pt-${autoVer}';`);

  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.send(swContent);
});

// Servir archivos estáticos desde la raíz del proyecto
app.use(express.static(process.cwd()));

// Para cualquier otra ruta, servir index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'index.html'));
});

module.exports = app;
