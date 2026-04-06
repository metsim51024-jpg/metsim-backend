// backend/services/emailService.js
const nodemailer = require('nodemailer');

console.log('\n🔧 Configurando servicio de email...');
console.log('   EMAIL_USER:', process.env.EMAIL_USER ? '✅' : '❌');
console.log('   EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '✅' : '❌');
console.log('   ADMIN_EMAIL:', process.env.ADMIN_EMAIL ? '✅' : '❌\n');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Verificar configuración
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Error configurando Email:', error.message);
    console.error('   Verifica que EMAIL_USER y EMAIL_PASSWORD sean correctos');
  } else {
    console.log('✅ Email configurado correctamente');
    console.log(`   Enviando desde: ${process.env.EMAIL_USER}`);
  }
});

// Enviar email al cliente
const sendQuoteToClient = async (quote) => {
  const mailOptions = {
    from: `METSIM Cotizaciones <${process.env.EMAIL_USER}>`,
    to: quote.client_email,
    subject: '📋 Tu solicitud de presupuesto ha sido recibida - METSIM',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #22d3ee, #06b6d4); padding: 30px; color: white; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">✅ Solicitud Recibida</h1>
        </div>
        
        <div style="background: #f5f5f5; padding: 30px; border-radius: 0 0 8px 8px;">
          <p style="font-size: 16px; color: #333;">Hola <strong>${quote.client_name}</strong>,</p>
          
          <p style="color: #666; line-height: 1.6;">
            Hemos recibido tu solicitud de presupuesto exitosamente. 
            Nuestro equipo de expertos analizará los detalles de tu proyecto 
            y se contactará contigo pronto.
          </p>

          <div style="background: white; padding: 20px; border-left: 4px solid #22d3ee; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #22d3ee;">Detalles de tu solicitud:</h3>
            <p style="margin: 8px 0;"><strong>ID Solicitud:</strong> <code>${quote._id}</code></p>
            <p style="margin: 8px 0;"><strong>Nombre:</strong> ${quote.client_name}</p>
            <p style="margin: 8px 0;"><strong>Email:</strong> ${quote.client_email}</p>
            <p style="margin: 8px 0;"><strong>Teléfono:</strong> ${quote.client_phone}</p>
            <p style="margin: 8px 0;"><strong>Archivos:</strong> ${quote.file_urls?.length || 0} adjuntos</p>
            <p style="margin: 8px 0;"><strong>Fecha:</strong> ${new Date(quote.created_at).toLocaleString('es-PY')}</p>
          </div>

          <p style="color: #999; font-size: 14px;">
            <strong>Tiempo de respuesta:</strong> Normalmente respondemos dentro de 24 horas hábiles.
          </p>

          <div style="border-top: 1px solid #ddd; padding-top: 20px; text-align: center;">
            <p style="color: #666; margin: 10px 0; font-size: 14px;">
              ¿Necesitas ayuda urgente?
            </p>
            <a href="https://wa.me/595994685767" style="background: #25d366; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 10px 5px; text-decoration: none;">
              💬 WhatsApp
            </a>
            <a href="tel:+595994685767" style="background: #22d3ee; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 10px 5px; text-decoration: none;">
              📞 Llamar
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            METSIM © 2026 | Soluciones Metalúrgicas Industriales<br>
            ${process.env.EMAIL_USER}
          </p>
        </div>
      </div>
    `
  };

  try {
    console.log(`📧 Enviando email a cliente: ${quote.client_email}`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email enviado al cliente. ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`❌ Error enviando email al cliente:`, error.message);
    throw error;
  }
};

// Enviar email al admin
const sendQuoteToAdmin = async (quote, fileUrls = []) => {
  const filesHTML = fileUrls.length > 0 
    ? `
      <h3>📎 Archivos Adjuntos (${fileUrls.length}):</h3>
      <ul style="list-style: none; padding: 0;">
        ${fileUrls.map(f => `
          <li style="padding: 8px; background: #f0f0f0; margin: 5px 0; border-radius: 4px;">
            <a href="${f.url}" style="color: #22d3ee; text-decoration: none; font-weight: bold;">
              📥 ${f.filename}
            </a>
            <span style="color: #999; font-size: 12px;"> (${(f.size / 1024).toFixed(2)}KB)</span>
          </li>
        `).join('')}
      </ul>
    `
    : '<p style="color: #999;"><em>Sin archivos adjuntos</em></p>';

  const mailOptions = {
    from: `METSIM Admin <${process.env.EMAIL_USER}>`,
    to: process.env.ADMIN_EMAIL,
    subject: `🔴 NUEVA COTIZACIÓN - ${quote.client_name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
        <div style="background: #ff6b6b; padding: 30px; color: white; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">🔴 NUEVA SOLICITUD DE PRESUPUESTO</h1>
        </div>
        
        <div style="background: #f5f5f5; padding: 30px; border-radius: 0 0 8px 8px;">
          
          <h2 style="color: #ff6b6b; border-bottom: 2px solid #ff6b6b; padding-bottom: 10px;">
            📋 INFORMACIÓN DEL CLIENTE
          </h2>

          <table style="width: 100%; border-collapse: collapse; background: white;">
            <tr>
              <td style="padding: 12px; border: 1px solid #ddd; width: 150px; font-weight: bold; background: #f9f9f9;">Nombre:</td>
              <td style="padding: 12px; border: 1px solid #ddd;">${quote.client_name}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold; background: #f9f9f9;">Email:</td>
              <td style="padding: 12px; border: 1px solid #ddd;"><a href="mailto:${quote.client_email}" style="color: #22d3ee;">${quote.client_email}</a></td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold; background: #f9f9f9;">Teléfono:</td>
              <td style="padding: 12px; border: 1px solid #ddd;"><a href="tel:${quote.client_phone}" style="color: #22d3ee;">${quote.client_phone}</a></td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold; background: #f9f9f9;">ID Cotización:</td>
              <td style="padding: 12px; border: 1px solid #ddd;"><code style="background: #f0f0f0; padding: 4px 8px; border-radius: 3px;">${quote._id}</code></td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold; background: #f9f9f9;">Fecha:</td>
              <td style="padding: 12px; border: 1px solid #ddd;">${new Date(quote.created_at).toLocaleString('es-PY')}</td>
            </tr>
          </table>

          <h2 style="color: #ff6b6b; border-bottom: 2px solid #ff6b6b; padding-bottom: 10px; margin-top: 30px;">
            📝 DESCRIPCIÓN DEL PROYECTO
          </h2>
          <div style="background: white; padding: 15px; border-left: 4px solid #ff6b6b; white-space: pre-wrap; color: #333;">
${quote.description}
          </div>

          <h2 style="color: #ff6b6b; border-bottom: 2px solid #ff6b6b; padding-bottom: 10px; margin-top: 30px;">
            📎 ARCHIVOS ADJUNTOS
          </h2>
          <div style="background: white; padding: 15px;">
            ${filesHTML}
          </div>

          <div style="background: #fff3cd; padding: 15px; border-radius: 4px; margin-top: 30px; border-left: 4px solid #ff6b6b;">
            <p style="margin: 0; font-weight: bold;">⚠️ ACCIÓN REQUERIDA</p>
            <p style="margin: 8px 0 0 0;">Esta solicitud requiere tu revisión en el panel administrativo</p>
            <a href="https://metsim-frontend.vercel.app/admin/dashboard" style="background: #ff6b6b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 10px; text-decoration: none;">
              📊 Ir al Dashboard
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            METSIM © 2026 | Panel Administrativo Automatizado
          </p>
        </div>
      </div>
    `
  };

  try {
    console.log(`📧 Enviando email al admin: ${process.env.ADMIN_EMAIL}`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email enviado al admin. ID: ${info.messageId}`);
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