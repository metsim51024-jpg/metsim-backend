// backend/routes/quotes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const Quote = require("../models/Quote");

// Configurar multer
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }
});

// POST - Crear cotización
router.post("/", upload.array("files", 10), async (req, res) => {
  try {
    const { client_name, client_email, client_phone, description } = req.body;

    // Validar datos
    if (!client_name || !client_email || !client_phone || !description) {
      return res.status(400).json({
        success: false,
        message: "Todos los campos son requeridos"
      });
    }

    // Procesar archivos si existen
    let fileUrls = [];
    if (req.files && req.files.length > 0) {
      // Aquí puedes guardar los archivos en Cloudinary o tu servicio de almacenamiento
      fileUrls = req.files.map(file => ({
        filename: file.originalname,
        size: file.size,
        url: ``, // Implementar upload a Cloudinary
        uploadedAt: new Date()
      }));
    }

    // Crear cotización
    const quote = new Quote({
      client_name,
      client_email,
      client_phone,
      description,
      file_urls: fileUrls,
      status: "pending",
      created_at: new Date()
    });

    await quote.save();

    // TODO: Enviar email al cliente y al admin

    res.status(201).json({
      success: true,
      message: "Cotización creada",
      quote
    });

  } catch (error) {
    console.error("Error al crear cotización:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET - Obtener todas
router.get("/", async (req, res) => {
  try {
    const quotes = await Quote.find().sort({ created_at: -1 });
    res.json({
      success: true,
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