// backend/routes/quotes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const Quote = require('../models/Quote');

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

    console.log('📥 Datos recibidos:', { client_name, client_email, client_phone });

    // Validar datos
    if (!client_name || !client_email || !client_phone || !description) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos',
        received: { client_name, client_email, client_phone, description: description ? 'sí' : 'no' }
      });
    }

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
    console.log('✅ Cotización guardada:', savedQuote._id);

    res.status(201).json({
      success: true,
      message: 'Cotización creada correctamente',
      quote: savedQuote
    });

  } catch (error) {
    console.error('❌ Error al crear cotización:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      detail: error.toString()
    });
  }
});

// GET - Obtener todas las cotizaciones
router.get('/', async (req, res) => {
  try {
    const quotes = await Quote.find().sort({ created_at: -1 });
    res.json({
      success: true,
      count: quotes.length,
      quotes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET - Obtener una cotización
router.get('/:id', async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id);
    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Cotización no encontrada'
      });
    }
    res.json({
      success: true,
      quote
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;