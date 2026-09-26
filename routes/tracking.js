// backend/routes/tracking.js
// Consulta publica del estado de una cotizacion.
// No lleva login: el token del enlace ES la credencial, por eso este router
// devuelve solo lo que el cliente ya sabe de su propio pedido y nunca el email
// ni el telefono, que serviran para armar una lista si el enlace se filtra.
const express = require('express');
const router = express.Router();
const Quote = require('../models/Quote');
const crypto = require('crypto');
const { normalizeStatus, labelOf, buildTimeline } = require('../utils/quoteStatus');
const { trackingUrlFor } = require('../utils/siteUrl');
const { sendTrackingRecovery } = require('../services/emailServiceResend');

// 48 caracteres hex: es lo que genera crypto.randomBytes(24) en routes/quotes.js
const TOKEN_FORMAT = /^[a-f0-9]{48}$/;


// Reenvio del enlace al cliente que perdio el correo.
// Dos cuidados: la respuesta es siempre la misma exista o no el pedido, para
// que no sirva para averiguar que direcciones estan en la base; y el enlace
// viaja solo al correo consultado, nunca en la respuesta HTTP.
const ultimoReenvio = new Map();
const ESPERA_MS = 60 * 1000;

router.post('/recuperar', async (req, res) => {
  const respuestaNeutra = {
    success: true,
    message: 'Si ese correo tiene un presupuesto, te enviamos el enlace de seguimiento.'
  };

  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Ingresá un correo válido' });
    }

    // Evita que se use para bombardear la casilla de un cliente.
    const previo = ultimoReenvio.get(email);
    if (previo && Date.now() - previo < ESPERA_MS) {
      return res.status(200).json(respuestaNeutra);
    }
    ultimoReenvio.set(email, Date.now());

    const quote = await Quote.findOne({ client_email: email }).sort({ createdAt: -1 });

    if (quote) {
      if (!quote.tracking_token) {
        quote.tracking_token = crypto.randomBytes(24).toString('hex');
        await quote.save();
      }
      sendTrackingRecovery(quote, trackingUrlFor(quote.tracking_token))
        .catch((err) => console.error('Error reenviando seguimiento:', err.message));
    } else {
      console.log(`ℹ️ Reenvío pedido para ${email}: sin pedidos`);
    }

    res.status(200).json(respuestaNeutra);
  } catch (error) {
    console.error('❌ Error en reenvío de seguimiento:', error);
    res.status(500).json({ success: false, message: 'Error al procesar el pedido' });
  }
});

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
