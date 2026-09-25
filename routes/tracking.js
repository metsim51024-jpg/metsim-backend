// backend/routes/tracking.js
// Consulta publica del estado de una cotizacion.
// No lleva login: el token del enlace ES la credencial, por eso este router
// devuelve solo lo que el cliente ya sabe de su propio pedido y nunca el email
// ni el telefono, que serviran para armar una lista si el enlace se filtra.
const express = require('express');
const router = express.Router();
const Quote = require('../models/Quote');
const { normalizeStatus, labelOf, buildTimeline } = require('../utils/quoteStatus');

// 48 caracteres hex: es lo que genera crypto.randomBytes(24) en routes/quotes.js
const TOKEN_FORMAT = /^[a-f0-9]{48}$/;

router.get('/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // Un token con formato invalido se responde igual que uno inexistente,
    // para no confirmarle a nadie que adivino la forma correcta.
    if (!TOKEN_FORMAT.test(token)) {
      return res.status(404).json({ success: false, message: 'Seguimiento no encontrado' });
    }

    const quote = await Quote.findOne({ tracking_token: token })
      .select('client_name description status status_history file_urls createdAt updatedAt')
      .lean();

    if (!quote) {
      return res.status(404).json({ success: false, message: 'Seguimiento no encontrado' });
    }

    const status = normalizeStatus(quote.status);

    res.status(200).json({
      success: true,
      data: {
        client_name: quote.client_name,
        description: quote.description,
        files: (quote.file_urls || []).length,
        status,
        status_label: labelOf(status),
        timeline: buildTimeline(quote),
        created_at: quote.createdAt,
        updated_at: quote.updatedAt
      }
    });
  } catch (error) {
    console.error('❌ Error consultando seguimiento:', error);
    res.status(500).json({ success: false, message: 'Error al consultar el seguimiento' });
  }
});

module.exports = router;
