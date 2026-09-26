// backend/utils/email.js
const { sendQuoteToClient, sendQuoteToAdmin } = require('../services/emailServiceResend');

// Resultado del ultimo envio, para poder diagnosticar desde /api/health sin
// tener que abrir los logs de Render. Solo vive en memoria del proceso.
let ultimoEnvio = null;
const ultimoEnvioDeCorreo = () => ultimoEnvio;

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
      client_phone: quoteData.phone || 'No informado',
      description: quoteData.description,
      file_urls: quoteData.files || [],
      created_at: new Date(),
      _id: quoteData.id || 'PENDING',
      tracking_url: quoteData.trackingUrl || null
    };

    if (!process.env.RESEND_API_KEY) {
      console.warn('⚠️ RESEND_API_KEY no está definida: no se envía ningún correo');
      return false;
    }

    // Independientes a proposito: que Resend rechace el del cliente no puede
    // dejar sin avisar al admin, ni al reves.
    const [cliente, admin] = await Promise.allSettled([
      sendQuoteToClient(quote),
      sendQuoteToAdmin(quote, quote.file_urls)
    ]);

    if (cliente.status === 'fulfilled') console.log('✅ Email enviado al cliente');
    else console.error('❌ Email al CLIENTE falló:', cliente.reason.message);

    if (admin.status === 'fulfilled') console.log('✅ Email enviado al admin');
    else console.error('❌ Email al ADMIN falló:', admin.reason.message);

    ultimoEnvio = {
      at: new Date().toISOString(),
      cliente: cliente.status === 'fulfilled' ? 'ok' : cliente.reason.message,
      admin: admin.status === 'fulfilled' ? 'ok' : admin.reason.message
    };

    return cliente.status === 'fulfilled' && admin.status === 'fulfilled';
  } catch (error) {
    console.error('❌ Error enviando emails:', error.message);
    // No lanzamos error para no bloquear la respuesta
    return false;
  }
};

module.exports = { sendQuoteEmail, ultimoEnvioDeCorreo };