const express = require('express');
const router = express.Router();
const multer = require('multer');
const Quote = require('../models/Quote');
const { sendQuoteEmail } = require('../utils/email');

// Configurar multer para archivos
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`));
    }
  }
});

// ✅ CREAR COTIZACIÓN
router.post('/', upload.array('files', 5), async (req, res) => {
  try {
    console.log('📨 Nueva cotización recibida');
    console.log('Body:', { 
      ...req.body, 
      files: `${req.files?.length || 0} archivos` 
    });

    const { client_name, client_email, client_phone, description } = req.body;

    // Validar datos
    if (!client_name || !client_email || !client_phone || !description) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos',
        required: ['client_name', 'client_email', 'client_phone', 'description']
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

    // Procesar archivos
    let fileUrls = [];
    if (req.files && req.files.length > 0) {
      fileUrls = req.files.map(file => ({
        filename: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        uploadedAt: new Date()
      }));
      console.log(`✅ ${fileUrls.length} archivos procesados`);
    }

    // Crear documento
    const newQuote = new Quote({
      client_name: client_name.trim(),
      client_email: client_email.trim().toLowerCase(),
      client_phone: client_phone.trim(),
      description: description.trim(),
      file_urls: fileUrls,
      status: 'pending',
      created_at: new Date(),
      updated_at: new Date()
    });

    // Guardar en base de datos
    const savedQuote = await newQuote.save();
    console.log(`✅ Cotización guardada: ${savedQuote._id}`);

    // Enviar email (sin bloquear la respuesta)
    if (process.env.RESEND_API_KEY || process.env.EMAIL_USER) {
      sendQuoteEmail(client_email, {
        id: savedQuote._id,
        name: client_name,
        description: description,
        files: fileUrls
      }).catch(err => console.error('❌ Error enviando email:', err.message));
    }

    // Responder al cliente
    res.status(201).json({
      success: true,
      message: 'Cotización creada exitosamente',
      data: {
        id: savedQuote._id,
        status: savedQuote.status,
        message: 'Hemos recibido tu solicitud. Te contactaremos pronto.'
      }
    });

  } catch (error) {
    console.error('❌ Error creando cotización:', error);
    
    // Error de validación de MongoDB
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: Object.values(error.errors).map(e => e.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al crear cotización',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ✅ OBTENER COTIZACIONES (público - solo para test)
router.get('/', async (req, res) => {
  try {
    const quotes = await Quote.find()
      .sort({ created_at: -1 })
      .limit(50)
      .select('-__v');

    res.status(200).json({
      success: true,
      count: quotes.length,
      data: quotes
    });
  } catch (error) {
    console.error('❌ Error obteniendo cotizaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener cotizaciones'
    });
  }
});

module.exports = router;