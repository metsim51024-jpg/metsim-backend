// backend/services/emailService.js
const nodemailer = require('nodemailer');

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
    console.log('❌ Error Email:', error);
  } else {
    console.log('✅ Email configurado correctamente');
  }
});

// Enviar email al cliente
const sendQuoteToClient = async (quote) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
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
            <p style="margin: 8px 0;"><strong>ID Solicitud:</strong> ${quote._id}</p>
            <p style="margin: 8px 0;"><strong>Nombre:</strong> ${quote.client_name}</p>
            <p style="margin: 8px 0;"><strong>Email:</strong> ${quote.client_email}</p>
            <p style="margin: 8px 0;"><strong>Teléfono:</strong> ${quote.client_phone}</p>
            <p style="margin: 8px 0;"><strong>Fecha:</strong> ${new Date(quote.created_at).toLocaleString('es-PY')}</p>
          </div>

          <p style="color: #999; font-size: 14px;">
            <strong>Tiempo de respuesta:</strong> Normalmente respondemos dentro de 24 horas hábiles.
          </p>

          <div style="border-top: 1px solid #ddd; padding-top: 20px; text-align: center;">
            <p style="color: #666; margin: 10px 0; font-size: 14px;">
              ¿Necesitas ayuda urgente?
            </p>
            <a href="https://wa.me/595994685767" style="background: #25d366; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 10px 5px;">
              💬 WhatsApp
            </a>
            <a href="tel:+595994685767" style="background: #22d3ee; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 10px 5px;">
              📞 Llamar
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            METSIM © 2026 | Soluciones Metalúrgicas Industriales
          </p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Email enviado al cliente:', quote.client_email);
    return true;
  } catch (error) {
    console.error('❌ Error enviando email:', error);
    return false;
  }
};

// Enviar email al admin
const sendQuoteToAdmin = async (quote, fileUrls = []) => {
  let attachments = [];
  
  // Agregar URLs como referencias en el email
  const filesHTML = fileUrls.length > 0 
    ? `<p><strong>Archivos adjuntos:</strong></p><ul>${fileUrls.map(f => `<li><a href="${f.url}">${f.filename}</a></li>`).join('')}</ul>`
    : '<p><em>Sin archivos adjuntos</em></p>';

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.ADMIN_EMAIL,
    subject: `🔴 NUEVA COTIZACIÓN - ${quote.client_name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #ff6b6b; padding: 30px; color: white; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">🔴 NUEVA SOLICITUD DE PRESUPUESTO</h1>
        </div>
        
        <div style="background: #f5f5f5; padding: 30px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #ff6b6b; border-bottom: 2px solid #ff6b6b; padding-bottom: 10px;">
            Información del Cliente
          </h2>

          <table style="width: 100%; border-collapse: collapse;">
            <tr style="background: white;">
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Nombre:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${quote.client_name}</td>
            </tr>
            <tr style="background: white;">
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Email:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;"><a href="mailto:${quote.client_email}">${quote.client_email}</a></td>
            </tr>
            <tr style="background: white;">
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Teléfono:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;"><a href="tel:${quote.client_phone}">${quote.client_phone}</a></td>
            </tr>
            <tr style="background: white;">
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>ID Solicitud:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${quote._id}</td>
            </tr>
            <tr style="background: white;">
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Fecha:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${new Date(quote.created_at).toLocaleString('es-PY')}</td>
            </tr>
          </table>

          <h2 style="color: #ff6b6b; border-bottom: 2px solid #ff6b6b; padding-bottom: 10px; margin-top: 30px;">
            Descripción del Proyecto
          </h2>
          <div style="background: white; padding: 15px; border-left: 4px solid #ff6b6b;">
            <p style="white-space: pre-wrap; color: #333;">${quote.description}</p>
          </div>

          <h2 style="color: #ff6b6b; border-bottom: 2px solid #ff6b6b; padding-bottom: 10px; margin-top: 30px;">
            Archivos Adjuntos
          </h2>
          <div style="background: white; padding: 15px;">
            ${filesHTML}
          </div>

          <div style="background: #fff3cd; padding: 15px; border-radius: 4px; margin-top: 30px;">
            <p style="margin: 0;"><strong>⚠️ ACCIÓN REQUERIDA:</strong> Revisa esta solicitud en el panel administrativo</p>
            <a href="https://metsim-frontend.vercel.app/admin/dashboard" style="background: #ff6b6b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 10px;">
              📊 Ir al Dashboard
            </a>
          </div>
        </div>
      </div>
    `,
    attachments
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Email enviado al admin:', process.env.ADMIN_EMAIL);
    return true;
  } catch (error) {
    console.error('❌ Error enviando email al admin:', error);
    return false;
  }
};

module.exports = {
  sendQuoteToClient,
  sendQuoteToAdmin
};