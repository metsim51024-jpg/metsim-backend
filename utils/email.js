// backend/utils/email.js
const { sendQuoteToClient, sendQuoteToAdmin } = require('../services/emailServiceResend');

/**
 * Envía email de confirmación al cliente y notificación al admin
 * @param {string} clientEmail - Email del cliente
 * @param {Object} quoteData - Datos de la cotización
 */
const sendQuoteEmail = async (clientEmail, quoteData) => {
  try {
    console.log('📧 Iniciando envío de emails...');
    
    // Construir objeto quote completo
    const quote = {
      client_email: clientEmail,
      client_name: quoteData.name,
      description: quoteData.description,
      file_urls: quoteData.files || [],
      created_at: new Date(),
      _id: quoteData.id || 'PENDING'
    };

    // Enviar email al cliente
    if (process.env.RESEND_API_KEY) {
      await sendQuoteToClient(quote);
      console.log('✅ Email enviado al cliente');
    }

    // Enviar email al admin
    if (process.env.ADMIN_EMAIL) {
      await sendQuoteToAdmin(quote, quote.file_urls);
      console.log('✅ Email enviado al admin');
    }

    return true;
  } catch (error) {
    console.error('❌ Error enviando emails:', error.message);
    // No lanzamos error para no bloquear la respuesta
    return false;
  }
};

module.exports = { sendQuoteEmail };