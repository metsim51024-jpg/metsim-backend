const express = require('express');
const router = express.Router();
const multer = require('multer');
const crypto = require('crypto');
const Quote = require('../models/Quote');
const { protect } = require('../middleware/auth');
const { sendQuoteEmail } = require('../utils/email');

const { trackingUrlFor } = require('../utils/siteUrl');

// Configurar multer para archivos
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido'));
    }
  }
});

// ✅ CREAR COTIZACIÓN
router.post('/', upload.array('files', 5), async (req, res) => {
  try {
    console.log('📨 Nueva cotización recibida');
    console.log('Body:', { ...req.body, files: `${req.files?.length || 0} archivos` });

    const { client_name, client_email, client_phone, description } = req.body;

    // Validar datos
    if (!client_name || !client_email || !client_phone || !description) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos',
        required: ['client_name', 'client_email', 'client_phone', 'description']
      });
    }

    // Procesar archivos si existen
    let fileUrls = [];
    if (req.files && req.files.length > 0) {
      // Si usas cloudinary u otro servicio, procesa aquí
      fileUrls = req.files.map(file => ({
        filename: file.originalname,
        size: file.size,
        mimetype: file.mimetype
      }));
      console.log(`✅ ${fileUrls.length} archivos procesados`);
    }

    // Token del enlace de seguimiento. 24 bytes -> 48 caracteres hex: no se
    // puede adivinar por fuerza bruta, que es lo unico que protege este enlace.
    const trackingToken = crypto.randomBytes(24).toString('hex');
    const now = new Date();

    // Crear documento
    const newQuote = new Quote({
      client_name: client_name.trim(),
      client_email: client_email.trim(),
      client_phone: client_phone.trim(),
      description: description.trim(),
      file_urls: fileUrls,
      status: 'received',
      tracking_token: trackingToken,
      status_history: [{ status: 'received', at: now }],
      createdAt: now,
      updatedAt: now
    });

    // Guardar en base de datos
    const savedQuote = await newQuote.save();
    console.log(`✅ Cotización guardada: ${savedQuote._id}`);

    // Enviar email (sin bloquear la respuesta).
    // El envio real lo decide utils/email.js segun RESEND_API_KEY / ADMIN_EMAIL.
    sendQuoteEmail(client_email, {
      id: savedQuote._id,
      name: client_name,
      phone: client_phone,
      description: description,
      files: fileUrls.length,
      trackingUrl: trackingUrlFor(trackingToken)
    }).catch(err => console.error('Error enviando email:', err.message));

    // Responder al cliente
    res.status(201).json({
      success: true,
      message: 'Cotización creada exitosamente',
      data: {
        id: savedQuote._id,
        status: savedQuote.status,
        tracking_token: trackingToken,
        tracking_url: trackingUrlFor(trackingToken),
        message: 'Hemos recibido tu cotización. Revisa tu correo.'
      }
    });

  } catch (error) {
    console.error('❌ Error creando cotización:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al crear cotización',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ✅ OBTENER COTIZACIONES (solo admin)
// Sin `protect` este endpoint devolvia el nombre, email, telefono y descripcion
// de todos los clientes a cualquiera que lo pidiera.
router.get('/', protect, async (req, res) => {
  try {
    const quotes = await Quote.find()
      .sort({ createdAt: -1 })
      .limit(50);

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