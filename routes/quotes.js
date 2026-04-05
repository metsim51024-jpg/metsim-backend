// backend/routes/quotes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const mongoose = require('mongoose');

// Importar modelo
let Quote;
try {
  Quote = require('../models/Quote');
} catch (err) {
  console.error('❌ Error importando Quote model:', err.message);
}

// Configurar multer
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }
});

// POST - Crear cotización
router.post('/', upload.array('files', 10), async (req, res) => {
  try {
    const { client_name, client_email, client_phone, description } = req.body;

    console.log('📥 [POST /api/quotes] Datos recibidos:', {
      client_name: client_name ? '✅' : '❌',
      client_email: client_email ? '✅' : '❌',
      client_phone: client_phone ? '✅' : '❌',
      description: description ? '✅' : '❌'
    });

    // Validar datos
    if (!client_name || !client_email || !client_phone || !description) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos',
        received: { client_name, client_email, client_phone, description: !!description }
      });
    }

    // Verificar conexión MongoDB
    if (mongoose.connection.readyState !== 1) {
      console.warn('⚠️ MongoDB no conectado. Estado:', mongoose.connection.readyState);
      return res.status(503).json({
        success: false,
        message: 'Base de datos no disponible. Por favor intenta nuevamente.',
        mongoStatus: mongoose.connection.readyState
      });
    }

    console.log('✅ MongoDB conectado. Guardando cotización...');

    // Crear cotización
    const quote = new Quote({
      client_name: client_name.trim(),
      client_email: client_email.trim(),
      client_phone: client_phone.trim(),
      description: description.trim(),
      file_urls: [],
      status: 'pending',
      created_at: new Date()
    });

    const savedQuote = await quote.save();
    console.log('✅ Cotización guardada con ID:', savedQuote._id);

    res.status(201).json({
      success: true,
      message: 'Cotización creada correctamente',
      quote: {
        id: savedQuote._id,
        client_name: savedQuote.client_name,
        client_email: savedQuote.client_email,
        created_at: savedQuote.created_at
      }
    });

  } catch (error) {
    console.error('❌ Error al crear cotización:', error.message);
    
    // Validar si es error de timeout
    if (error.name === 'MongoTimeoutError' || error.message.includes('timeout')) {
      return res.status(504).json({
        success: false,
        message: 'Tiempo de conexión agotado. MongoDB no responde.',
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Error al guardar la cotización',
      error: process.env.NODE_ENV === 'development' ? error.toString() : undefined
    });
  }
});

// GET - Obtener todas
router.get('/', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'MongoDB no disponible'
      });
    }

    const quotes = await Quote.find().sort({ created_at: -1 }).lean();
    res.json({
      success: true,
      count: quotes.length,
      quotes
    });
  } catch (error) {
    console.error('Error obteniendo cotizaciones:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;