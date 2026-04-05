// backend/routes/quotes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const mongoose = require('mongoose');
const Quote = require('../models/Quote');
const { sendQuoteToClient, sendQuoteToAdmin } = require('../services/emailService');
const { uploadFile } = require('../services/cloudinaryService');

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

    console.log('📥 Nuevas cotización recibida');

    // Validar datos
    if (!client_name || !client_email || !client_phone || !description) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos'
      });
    }

    // Verificar MongoDB
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    // Subir archivos a Cloudinary
    let fileUrls = [];
    if (req.files && req.files.length > 0) {
      console.log(`📤 Subiendo ${req.files.length} archivos a Cloudinary...`);
      
      for (const file of req.files) {
        try {
          const uploadResult = await uploadFile(file.buffer, file.originalname);
          fileUrls.push({
            filename: file.originalname,
            size: file.size,
            url: uploadResult.secure_url,
            cloudinaryId: uploadResult.public_id,
            uploadedAt: new Date()
          });
          console.log(`✅ Archivo subido: ${file.originalname}`);
        } catch (error) {
          console.error(`❌ Error subiendo ${file.originalname}:`, error.message);
        }
      }
    }

    // Crear cotización
    const quote = new Quote({
      client_name: client_name.trim(),
      client_email: client_email.trim(),
      client_phone: client_phone.trim(),
      description: description.trim(),
      file_urls: fileUrls,
      status: 'pending',
      created_at: new Date()
    });

    const savedQuote = await quote.save();
    console.log('✅ Cotización guardada en MongoDB:', savedQuote._id);

    // Enviar emails
    await sendQuoteToClient(savedQuote);
    await sendQuoteToAdmin(savedQuote, fileUrls);

    res.status(201).json({
      success: true,
      message: 'Cotización creada y notificaciones enviadas',
      quote: {
        id: savedQuote._id,
        client_name: savedQuote.client_name,
        client_email: savedQuote.client_email,
        files_uploaded: fileUrls.length,
        created_at: savedQuote.created_at
      }
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET - Obtener todas
router.get('/', async (req, res) => {
  try {
    const quotes = await Quote.find().sort({ created_at: -1 }).lean();
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

module.exports = router;