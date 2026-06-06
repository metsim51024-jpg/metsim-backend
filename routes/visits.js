const express = require('express');
const router = express.Router();
const Visit = require('../models/Visit');

// ✅ REGISTRAR VISITA (público) — lo llama el frontend en cada navegación
router.post('/', async (req, res) => {
  try {
    const { path, referrer } = req.body || {};

    // Ignorar rutas del panel administrativo para no inflar las métricas
    if (path && path.startsWith('/admin')) {
      return res.status(200).json({ success: true, ignored: true });
    }

    await Visit.create({
      path: (path || '/').slice(0, 300),
      referrer: (referrer || '').slice(0, 300),
      userAgent: (req.headers['user-agent'] || '').slice(0, 300)
    });

    res.status(201).json({ success: true });
  } catch (error) {
    // No es crítico: si falla el tracking, no rompemos la experiencia
    res.status(200).json({ success: false });
  }
});

module.exports = router;
