const express = require('express');
const router = express.Router();
const Visit = require('../models/Visit');

// Los bots inflaban las metricas: Googlebot, escaneres, monitores de uptime y
// los previsualizadores de enlaces de WhatsApp/Facebook entraban como visitas.
const ES_BOT = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|whatsapp|telegram|discord|preview|headless|lighthouse|pingdom|uptime|monitor|curl|wget|python-requests|axios|go-http|java\/|okhttp|scrapy|semrush|ahrefs|mj12|dotbot|petalbot|yandex|baidu/i;

// ✅ REGISTRAR VISITA (público) — lo llama el frontend en cada navegación
router.post('/', async (req, res) => {
  try {
    const { path, referrer, visitorId } = req.body || {};
    const userAgent = req.headers['user-agent'] || '';

    // El panel no es trafico del sitio.
    if (path && path.startsWith('/admin')) {
      return res.status(200).json({ success: true, ignored: 'admin' });
    }

    // Un cliente mirando su propio seguimiento no es una visita comercial:
    // contarla infla el trafico y hunde la tasa de conversion.
    if (path && path.startsWith('/seguimiento')) {
      return res.status(200).json({ success: true, ignored: 'seguimiento' });
    }

    if (!userAgent || ES_BOT.test(userAgent)) {
      return res.status(200).json({ success: true, ignored: 'bot' });
    }

    await Visit.create({
      path: (path || '/').slice(0, 300),
      referrer: (referrer || '').slice(0, 300),
      visitorId: String(visitorId || '').slice(0, 64),
      userAgent: userAgent.slice(0, 300)
    });

    res.status(201).json({ success: true });
  } catch (error) {
    // No es crítico: si falla el tracking, no rompemos la experiencia
    res.status(200).json({ success: false });
  }
});

module.exports = router;
