// backend/routes/quotes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const mongoose = require('mongoose');
const Quote = require('../models/Quote');
const { sendQuoteToClient, sendQuoteToAdmin } = require('../services/emailServiceResend');
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

    console.log('\n📥 ===== NUEVA COTIZACIÓN RECIBIDA =====');
    console.log(`   Cliente: ${client_name}`);
    console.log(`   Email: ${client_email}`);
    console.log(`   Archivos: ${req.files?.length || 0}`);

    // Validar datos
    if (!client_name || !client_email || !client_phone || !description) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos'
      });
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(client_email)) {
      return res.status(400).json({
        success: false,
        message: 'Email inválido'
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
      console.log(`\n📤 Subiendo ${req.files.length} archivos a Cloudinary...`);
      
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
          console.log(`   ✅ ${file.originalname} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
        } catch (error) {
          console.error(`   ❌ Error subiendo ${file.originalname}:`, error.message);
        }
      }
    }

    // Crear cotización en MongoDB
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
    console.log(`\n💾 Cotización guardada en MongoDB`);
    console.log(`   ID: ${savedQuote._id}`);

    // ✅ RESPONDER INMEDIATAMENTE
    res.status(201).json({
      success: true,
      message: 'Cotización creada exitosamente. Recibirás un email de confirmación.',
      quote: {
        id: savedQuote._id,
        client_name: savedQuote.client_name,
        client_email: savedQuote.client_email,
        files_uploaded: fileUrls.length
      }
    });

    // ENVIAR EMAILS EN BACKGROUND (NO ESPERAR)
    console.log('\n📧 Enviando notificaciones por email...');
    
    sendQuoteToClient(savedQuote).catch(err => {
      console.error('❌ Error enviando email al cliente:', err.message);
    });

    sendQuoteToAdmin(savedQuote, fileUrls).catch(err => {
      console.error('❌ Error enviando email al admin:', err.message);
    });

    console.log('=====================================\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('=====================================\n');
    
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