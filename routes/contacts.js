const express = require('express');
const Contact = require('../models/Contact');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Crear contacto (sin autenticación - público)
router.post('/', async (req, res) => {
  try {
    const { client_name, client_email, client_phone, description } = req.body;

    // Validar
    if (!client_name || !client_email || !client_phone || !description) {
      return res.status(400).json({
        success: false,
        message: 'Por favor completa todos los campos'
      });
    }

    const contact = await Contact.create({
      client_name,
      client_email,
      client_phone,
      description,
      status: 'nuevo'
    });

    res.status(201).json({
      success: true,
      contact
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Obtener todos los contactos (solo admin)
router.get('/', protect, async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: contacts.length,
      contacts
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Obtener un contacto
router.get('/:id', protect, async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contacto no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      contact
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Actualizar estado del contacto
router.put('/:id', protect, async (req, res) => {
  try {
    let contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contacto no encontrado'
      });
    }

    contact = await Contact.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      contact
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Eliminar contacto
router.delete('/:id', protect, async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contacto no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Contacto eliminado'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;