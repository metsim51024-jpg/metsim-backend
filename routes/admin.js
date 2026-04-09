const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Quote = require('../models/Quote');

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

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
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
    const { username, password } = req.body;

    console.log(`🔐 Login intent: ${username}`);

    // Validar credenciales
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Usuario y contraseña requeridos'
      });
    }

    // Credenciales hardcodeadas (en producción usar base de datos)
    const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      console.log('❌ Login fallido: credenciales incorrectas');
      return res.status(401).json({
        success: false,
        message: 'Credenciales incorrectas'
      });
    }

    // Generar token JWT
    const token = jwt.sign(
      { id: 'admin', username: ADMIN_USERNAME },
      process.env.JWT_SECRET || 'your-secret-key',
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