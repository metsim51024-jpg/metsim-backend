const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Quote = require('../models/Quote');
const Contact = require('../models/Contact');
const Visit = require('../models/Visit');

// Middleware de autenticación
const auth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token requerido'
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET no configurado en el servidor');
      return res.status(500).json({ success: false, message: 'Servidor mal configurado' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (error) {
    console.error('Auth error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Token inválido o expirado'
    });
  }
};

// ✅ LOGIN ADMIN
router.post('/login', async (req, res) => {
  try {
    // .trim() elimina espacios accidentales (típico al copiar/pegar en Render)
    const username = (req.body.username || '').trim();
    const password = (req.body.password || '').trim();

    console.log(`🔐 Login intent: ${username}`);

    // Validar credenciales
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Usuario y contraseña requeridos'
      });
    }

    if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD || !process.env.JWT_SECRET) {
      console.error('❌ ADMIN_USERNAME / ADMIN_PASSWORD / JWT_SECRET no configurados en el servidor');
      return res.status(500).json({ success: false, message: 'Panel administrativo no configurado' });
    }

    // Limpia espacios y comillas accidentales (típico al pegar valores en Render)
    const clean = (v) => (v || '').trim().replace(/^["']+|["']+$/g, '');

    const ok =
      clean(username) === clean(process.env.ADMIN_USERNAME) &&
      clean(password) === clean(process.env.ADMIN_PASSWORD);

    if (!ok) {
      console.log('❌ Login fallido: credenciales incorrectas');
      return res.status(401).json({
        success: false,
        message: 'Credenciales incorrectas'
      });
    }

    const ADMIN_USERNAME = clean(username);

    // Generar token JWT
    const token = jwt.sign(
      { id: 'admin', username: ADMIN_USERNAME },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log(`✅ Login exitoso: ${username}`);

    res.status(200).json({
      success: true,
      message: 'Login exitoso',
      access_token: token,
      token: token,
      user: { id: 'admin', username: ADMIN_USERNAME }
    });

  } catch (error) {
    console.error('❌ Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar login',
      error: error.message
    });
  }
});

// ✅ OBTENER COTIZACIONES
router.get('/quotes', auth, async (req, res) => {
  try {
    console.log('📋 Obteniendo cotizaciones...');

    const quotes = await Quote.find()
      .sort({ createdAt: -1 })
      .limit(100);

    console.log(`✅ ${quotes.length} cotizaciones encontradas`);

    res.status(200).json({
      success: true,
      count: quotes.length,
      data: quotes
    });

  } catch (error) {
    console.error('❌ Error obteniendo cotizaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener cotizaciones',
      error: error.message
    });
  }
});

// ✅ ACTUALIZAR ESTADO DE UNA COTIZACIÓN (CRM)
router.patch('/quotes/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatus = ['pending', 'responded', 'accepted', 'rejected'];

    if (!validStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Estado inválido. Usar: ${validStatus.join(', ')}`
      });
    }

    const quote = await Quote.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: Date.now() },
      { new: true }
    );

    if (!quote) {
      return res.status(404).json({ success: false, message: 'Cotización no encontrada' });
    }

    console.log(`✏️ Cotización ${req.params.id} → ${status}`);
    res.status(200).json({ success: true, data: quote });
  } catch (error) {
    console.error('❌ Error actualizando estado:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar estado' });
  }
});

// ✅ OBTENER MENSAJES DE CONTACTO
router.get('/contacts', auth, async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 }).limit(100);
    console.log(`✅ ${contacts.length} mensajes de contacto encontrados`);
    res.status(200).json({ success: true, count: contacts.length, data: contacts });
  } catch (error) {
    console.error('❌ Error obteniendo contactos:', error);
    res.status(500).json({ success: false, message: 'Error al obtener contactos' });
  }
});

// ✅ ACTUALIZAR ESTADO DE UN MENSAJE DE CONTACTO
router.patch('/contacts/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatus = ['nuevo', 'revisado', 'respondido', 'cerrado'];

    if (!validStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Estado inválido. Usar: ${validStatus.join(', ')}`
      });
    }

    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!contact) {
      return res.status(404).json({ success: false, message: 'Mensaje no encontrado' });
    }

    res.status(200).json({ success: true, data: contact });
  } catch (error) {
    console.error('❌ Error actualizando contacto:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar contacto' });
  }
});

// ✅ ESTADÍSTICAS DE VISITAS REALES
router.get('/visits', auth, async (req, res) => {
  try {
    const startOfToday = new Date(new Date().setHours(0, 0, 0, 0));
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [total, today, last7days, topPages] = await Promise.all([
      Visit.countDocuments(),
      Visit.countDocuments({ createdAt: { $gte: startOfToday } }),
      Visit.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Visit.aggregate([
        { $group: { _id: '$path', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 }
      ])
    ]);

    res.status(200).json({
      success: true,
      data: {
        total,
        today,
        last7days,
        topPages: topPages.map(p => ({ path: p._id, count: p.count }))
      }
    });
  } catch (error) {
    console.error('❌ Error obteniendo visitas:', error);
    res.status(500).json({ success: false, message: 'Error al obtener visitas' });
  }
});

// ✅ OBTENER PEDIDOS
router.get('/orders', auth, async (req, res) => {
  try {
    console.log('📦 Obteniendo pedidos...');

    // Si tienes un modelo Order, úsalo aquí
    // const orders = await Order.find().sort({ createdAt: -1 });

    // Por ahora retornamos un array vacío
    const orders = [];

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });

  } catch (error) {
    console.error('❌ Error obteniendo pedidos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener pedidos',
      error: error.message
    });
  }
});

// ✅ OBTENER ESTADÍSTICAS
router.get('/stats', auth, async (req, res) => {
  try {
    const totalQuotes = await Quote.countDocuments();
    const quotesToday = await Quote.countDocuments({
      createdAt: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0))
      }
    });

    res.status(200).json({
      success: true,
      data: {
        totalVisits: totalQuotes * 10,
        visitsToday: quotesToday * 2,
        totalConversions: Math.floor(totalQuotes * 0.3),
        conversionRate: totalQuotes > 0 ? 30 : 0
      }
    });
  } catch (error) {
    console.error('❌ Error obteniendo stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas'
    });
  }
});

module.exports = router;