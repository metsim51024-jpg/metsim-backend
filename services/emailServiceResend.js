// backend/services/emailServiceResend.js
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

console.log('\n🔧 Configurando Resend Email Service...');
console.log('   RESEND_API_KEY:', process.env.RESEND_API_KEY ? '✅' : '❌');
console.log('   SENDER_EMAIL:', process.env.SENDER_EMAIL, process.env.SENDER_EMAIL ? '✅' : '❌');
console.log('   ADMIN_EMAIL:', process.env.ADMIN_EMAIL, process.env.ADMIN_EMAIL ? '✅' : '❌\n');

// Email al cliente
const sendQuoteToClient = async (quote) => {
  try {
    console.log(`📧 Enviando email a cliente: ${quote.client_email}`);
    console.log(`   Desde: ${process.env.SENDER_EMAIL}`);

    const data = await resend.emails.send({
      from: `METSIM Cotizaciones <${process.env.SENDER_EMAIL}>`,
      to: quote.client_email,
      replyTo: process.env.SENDER_EMAIL,  // ✅ RESPONDER A CORPORATIVO
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
                  <td style="padding: 8px 0; color: #666;">${new Date(quote.created_at).toLocaleString('es-PY')}</td>
                </tr>
              </table>
            </div>

            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              <strong>⏱️ Tiempo de respuesta:</strong> Normalmente respondemos dentro de 24 horas hábiles. 
              Si tienes urgencia, puedes contactarnos directamente.
            </p>

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
              📧 ${process.env.SENDER_EMAIL}
            </p>
          </div>
        </div>
      `
    });

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

    const data = await resend.emails.send({
      from: `METSIM Admin <${process.env.SENDER_EMAIL}>`,
      to: process.env.ADMIN_EMAIL,
      replyTo: process.env.SENDER_EMAIL,  // ✅ RESPONDER A CORPORATIVO
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
                <td style="padding: 12px 15px; border: 1px solid #e0e0e0; color: #333;">${new Date(quote.created_at).toLocaleString('es-PY')}</td>
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
              📧 Responder a: ${process.env.SENDER_EMAIL}
            </p>
          </div>
        </div>
      `
    });

    console.log(`✅ Email enviado al admin: ${process.env.ADMIN_EMAIL}`);
    return true;

  } catch (error) {
    console.error(`❌ Error enviando email al admin:`, error.message);
    throw error;
  }
};

module.exports = {
  sendQuoteToClient,
  sendQuoteToAdmin
};