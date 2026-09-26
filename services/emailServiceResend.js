// backend/services/emailServiceResend.js
const { Resend } = require('resend');
const { STAGES, REJECTED, normalizeStatus, labelOf } = require('../utils/quoteStatus');

// Remitente de los correos. No es un secreto: viaja visible en el "De:" de cada
// envio, asi que el valor bueno vive en el codigo y SENDER_EMAIL queda opcional.
//
// onboarding@resend.dev es el remitente compartido de prueba de Resend: solo
// entrega a la casilla duena de la cuenta, nunca a un cliente. Si llega ese
// valor se ignora, porque en produccion siempre es un error de configuracion.
const DEFAULT_SENDER = 'presupuestos@metsim.com.py';
const configurado = (process.env.SENDER_EMAIL || '').trim();
const SENDER = (!configurado || configurado.endsWith('@resend.dev')) ? DEFAULT_SENDER : configurado;

if (configurado && configurado !== SENDER) {
  console.warn(`⚠️ SENDER_EMAIL='${configurado}' ignorado (remitente de prueba). Se usa ${SENDER}`);
}

const resend = new Resend(process.env.RESEND_API_KEY);

console.log('\n🔧 Configurando Resend Email Service...');
console.log('   RESEND_API_KEY:', process.env.RESEND_API_KEY ? '✅' : '❌');
console.log('   Remitente:', SENDER);
console.log('   ADMIN_EMAIL:', process.env.ADMIN_EMAIL, process.env.ADMIN_EMAIL ? '✅' : '❌\n');

// Email al cliente
const sendQuoteToClient = async (quote) => {
  try {
    console.log(`📧 Enviando email a cliente: ${quote.client_email}`);
    console.log(`   Desde: ${SENDER}`);

    const { error } = await resend.emails.send({
      from: `METSIM Cotizaciones <${SENDER}>`,
      to: quote.client_email,
      replyTo: SENDER,  // ✅ RESPONDER A CORPORATIVO
      subject: '📋 Tu solicitud de presupuesto ha sido recibida - METSIM',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5;">
          <div style="background: linear-gradient(135deg, #22d3ee, #06b6d4); padding: 40px 20px; color: white; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">✅ Solicitud Recibida</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Tu presupuesto está siendo procesado</p>
          </div>
          
          <div style="background: white; padding: 40px; border-radius: 0 0 8px 8px;">
            <p style="font-size: 16px; color: #333;">Hola <strong>${quote.client_name}</strong>,</p>
            
            <p style="color: #666; line-height: 1.8; font-size: 15px;">
              Hemos recibido tu solicitud de presupuesto <strong>exitosamente</strong>. 
              Nuestro equipo de expertos analizará los detalles de tu proyecto 
              y se contactará contigo en breve.
            </p>

            <div style="background: #f0f8ff; padding: 20px; border-left: 4px solid #22d3ee; margin: 30px 0; border-radius: 4px;">
              <h3 style="margin-top: 0; color: #22d3ee; margin-bottom: 15px;">📋 Detalles de tu solicitud:</h3>
              <table style="width: 100%; color: #333; font-size: 14px;">
                <tr>
                  <td style="padding: 8px 0;"><strong>ID:</strong></td>
                  <td style="padding: 8px 0; color: #666;"><code style="background: #f0f0f0; padding: 4px 8px; border-radius: 3px; font-family: monospace;">${quote._id.toString().substring(0, 12)}...</code></td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;"><strong>Nombre:</strong></td>
                  <td style="padding: 8px 0; color: #666;">${quote.client_name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;"><strong>Email:</strong></td>
                  <td style="padding: 8px 0; color: #666;">${quote.client_email}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;"><strong>Teléfono:</strong></td>
                  <td style="padding: 8px 0; color: #666;">${quote.client_phone}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;"><strong>Archivos:</strong></td>
                  <td style="padding: 8px 0; color: #666;">${quote.file_urls?.length || 0} adjuntos</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;"><strong>Fecha:</strong></td>
                  <td style="padding: 8px 0; color: #666;">${new Date(quote.created_at || quote.createdAt).toLocaleString('es-PY')}</td>
                </tr>
              </table>
            </div>

            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              <strong>⏱️ Tiempo de respuesta:</strong> Normalmente respondemos dentro de 24 horas hábiles. 
              Si tienes urgencia, puedes contactarnos directamente.
            </p>

            ${quote.tracking_url ? `
            <div style="background: #0f1523; padding: 28px 24px; border-radius: 6px; margin: 30px 0; text-align: center;">
              <p style="color: #22d3ee; margin: 0 0 8px 0; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; font-weight: bold;">
                Seguimiento en línea
              </p>
              <p style="color: #cbd5e1; margin: 0 0 22px 0; font-size: 14px; line-height: 1.6;">
                Guardá este enlace. Podés ver en qué etapa está tu pedido cuando quieras,<br>sin tener que preguntar.
              </p>
              <a href="${quote.tracking_url}" style="background: #22d3ee; color: #0f1523; padding: 14px 32px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold; font-size: 15px;">
                Ver estado de mi presupuesto
              </a>
            </div>` : ''}

            <div style="border-top: 2px solid #e0e0e0; padding-top: 30px; text-align: center; margin-top: 30px;">
              <p style="color: #666; margin: 0 0 15px 0; font-size: 14px;">
                ¿Necesitas ayuda urgente?
              </p>
              <table style="margin: 0 auto;">
                <tr>
                  <td style="padding: 0 10px;">
                    <a href="https://wa.me/595994685767" style="background: #25d366; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold; font-size: 14px;">
                      💬 WhatsApp
                    </a>
                  </td>
                  <td style="padding: 0 10px;">
                    <a href="tel:+595994685767" style="background: #22d3ee; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold; font-size: 14px;">
                      📞 Llamar
                    </a>
                  </td>
                </tr>
              </table>
            </div>

            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 40px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
              METSIM © 2026 | Soluciones Metalúrgicas Industriales<br>
              📧 ${SENDER}
            </p>
          </div>
        </div>
      `
    });

    if (error) {
      // Resend devuelve el motivo aca (dominio sin verificar, modo prueba,
      // destinatario no permitido). Sin esto el fallo era invisible.
      throw new Error(error.message || JSON.stringify(error));
    }

    console.log(`✅ Email enviado al cliente: ${quote.client_email}`);
    return true;

  } catch (error) {
    console.error(`❌ Error enviando email al cliente:`, error.message);
    throw error;
  }
};

// Email al admin
const sendQuoteToAdmin = async (quote, fileUrls = []) => {
  try {
    console.log(`📧 Enviando email al admin: ${process.env.ADMIN_EMAIL}`);

    const filesHTML = fileUrls.length > 0 
      ? `
        <div style="background: #f9f9f9; padding: 15px; border-radius: 4px; margin-top: 20px;">
          <h4 style="margin-top: 0; color: #333;">📎 Archivos Adjuntos (${fileUrls.length}):</h4>
          <ul style="list-style: none; padding: 0; margin: 0;">
            ${fileUrls.map(f => `
              <li style="padding: 10px; background: white; margin: 8px 0; border-radius: 4px; border-left: 3px solid #22d3ee;">
                <a href="${f.url}" style="color: #22d3ee; text-decoration: none; font-weight: bold; font-size: 14px;">
                  📥 ${f.filename}
                </a>
                <span style="color: #999; font-size: 12px;"> (${(f.size / 1024 / 1024).toFixed(2)}MB)</span>
              </li>
            `).join('')}
          </ul>
        </div>
      `
      : '<p style="color: #999; font-style: italic;">Sin archivos adjuntos</p>';

    const { error } = await resend.emails.send({
      from: `METSIM Admin <${SENDER}>`,
      to: process.env.ADMIN_EMAIL,
      replyTo: SENDER,  // ✅ RESPONDER A CORPORATIVO
      subject: `🔴 NUEVA COTIZACIÓN - ${quote.client_name}`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 700px; margin: 0 auto; background: #f5f5f5;">
          <div style="background: linear-gradient(135deg, #ff6b6b, #ff5252); padding: 40px 20px; color: white; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">🔴 NUEVA SOLICITUD DE PRESUPUESTO</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">ID: ${quote._id.toString().substring(0, 12)}</p>
          </div>
          
          <div style="background: white; padding: 40px; border-radius: 0 0 8px 8px;">
            
            <h2 style="color: #ff6b6b; border-bottom: 3px solid #ff6b6b; padding-bottom: 10px; margin-bottom: 20px;">
              👤 INFORMACIÓN DEL CLIENTE
            </h2>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
              <tr style="background: #f9f9f9;">
                <td style="padding: 12px 15px; border: 1px solid #e0e0e0; font-weight: bold; width: 120px;">Nombre</td>
                <td style="padding: 12px 15px; border: 1px solid #e0e0e0; color: #333;">${quote.client_name}</td>
              </tr>
              <tr>
                <td style="padding: 12px 15px; border: 1px solid #e0e0e0; font-weight: bold; background: #f9f9f9;">Email</td>
                <td style="padding: 12px 15px; border: 1px solid #e0e0e0; color: #333;">
                  <a href="mailto:${quote.client_email}" style="color: #22d3ee; text-decoration: none;">${quote.client_email}</a>
                </td>
              </tr>
              <tr style="background: #f9f9f9;">
                <td style="padding: 12px 15px; border: 1px solid #e0e0e0; font-weight: bold;">Teléfono</td>
                <td style="padding: 12px 15px; border: 1px solid #e0e0e0; color: #333;">
                  <a href="tel:${quote.client_phone}" style="color: #22d3ee; text-decoration: none;">${quote.client_phone}</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 15px; border: 1px solid #e0e0e0; font-weight: bold; background: #f9f9f9;">Fecha</td>
                <td style="padding: 12px 15px; border: 1px solid #e0e0e0; color: #333;">${new Date(quote.created_at || quote.createdAt).toLocaleString('es-PY')}</td>
              </tr>
            </table>

            <h2 style="color: #ff6b6b; border-bottom: 3px solid #ff6b6b; padding-bottom: 10px; margin-bottom: 20px;">
              📝 DESCRIPCIÓN DEL PROYECTO
            </h2>
            <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #ff6b6b; white-space: pre-wrap; color: #333; font-size: 14px; line-height: 1.6; margin-bottom: 30px;">
${quote.description}
            </div>

            <h2 style="color: #ff6b6b; border-bottom: 3px solid #ff6b6b; padding-bottom: 10px; margin-bottom: 20px;">
              📎 ARCHIVOS ADJUNTOS
            </h2>
            ${filesHTML}

            <div style="background: #fff3cd; padding: 20px; border-radius: 4px; margin-top: 30px; border-left: 4px solid #ffc107;">
              <p style="margin: 0; font-weight: bold; color: #333;">⚠️ ACCIÓN REQUERIDA</p>
              <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">Esta solicitud requiere tu revisión en el panel administrativo</p>
              <a href="https://metsim-frontend.vercel.app/admin/dashboard" style="background: #ff6b6b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 15px; font-weight: bold;">
                📊 Ver en Dashboard
              </a>
            </div>

            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 40px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
              METSIM Admin © 2026 | Presupuestos Automatizados<br>
              📧 Responder a: ${SENDER}
            </p>
          </div>
        </div>
      `
    });

    if (error) {
      // Resend devuelve el motivo aca (dominio sin verificar, modo prueba,
      // destinatario no permitido). Sin esto el fallo era invisible.
      throw new Error(error.message || JSON.stringify(error));
    }

    console.log(`✅ Email enviado al admin: ${process.env.ADMIN_EMAIL}`);
    return true;

  } catch (error) {
    console.error(`❌ Error enviando email al admin:`, error.message);
    throw error;
  }
};

// Aviso al cliente cada vez que su pedido cambia de etapa.
// Se dispara desde routes/admin.js cuando se mueve el estado desde el panel.
const sendStatusUpdate = async (quote, trackingUrl) => {
  try {
    const status = normalizeStatus(quote.status);
    const stage = status === REJECTED.key ? REJECTED : STAGES.find((s) => s.key === status);
    const label = labelOf(status);

    console.log(`📧 Avisando cambio de estado a ${quote.client_email}: ${label}`);

    const { error } = await resend.emails.send({
      from: `METSIM Cotizaciones <${SENDER}>`,
      to: quote.client_email,
      replyTo: SENDER,
      subject: `Tu pedido avanzó: ${label} - METSIM`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5;">
          <div style="background: linear-gradient(135deg, #22d3ee, #06b6d4); padding: 36px 20px; color: white; text-align: center; border-radius: 8px 8px 0 0;">
            <p style="margin: 0 0 8px 0; font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; opacity: 0.85;">Nuevo estado</p>
            <h1 style="margin: 0; font-size: 26px;">${label}</h1>
          </div>

          <div style="background: white; padding: 40px; border-radius: 0 0 8px 8px;">
            <p style="font-size: 16px; color: #333;">Hola <strong>${quote.client_name}</strong>,</p>

            <p style="color: #666; line-height: 1.8; font-size: 15px;">
              ${stage ? stage.description : 'Tu pedido cambió de estado.'}
            </p>

            ${trackingUrl ? `
            <div style="text-align: center; margin: 32px 0;">
              <a href="${trackingUrl}" style="background: #22d3ee; color: #0f1523; padding: 14px 32px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold; font-size: 15px;">
                Ver el recorrido completo
              </a>
            </div>` : ''}

            <div style="border-top: 2px solid #e0e0e0; padding-top: 26px; text-align: center; margin-top: 30px;">
              <p style="color: #666; margin: 0 0 15px 0; font-size: 14px;">¿Tenés una consulta sobre este pedido?</p>
              <a href="https://wa.me/595994685767" style="background: #25d366; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold; font-size: 14px;">
                💬 Escribinos por WhatsApp
              </a>
            </div>

            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 36px 0;">

            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
              METSIM © 2026 | Soluciones Metalúrgicas Industriales<br>
              📧 ${SENDER}
            </p>
          </div>
        </div>
      `
    });

    if (error) {
      // Resend devuelve el motivo aca (dominio sin verificar, modo prueba,
      // destinatario no permitido). Sin esto el fallo era invisible.
      throw new Error(error.message || JSON.stringify(error));
    }

    console.log(`✅ Aviso de estado enviado a ${quote.client_email}`);
    return true;
  } catch (error) {
    console.error('❌ Error enviando aviso de estado:', error.message);
    throw error;
  }
};

// Para que /api/health informe el remitente realmente en uso, no el del env.
const remitente = () => SENDER;

module.exports = {
  remitente,
  sendQuoteToClient,
  sendQuoteToAdmin,
  sendStatusUpdate
};