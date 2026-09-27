const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema({
  path: { type: String, default: '/', trim: true },
  // Identificador anonimo del navegador, para separar personas de paginas vistas.
  // No lleva nada personal: es un azar guardado en el localStorage del visitante.
  visitorId: { type: String, default: '', index: true },
  referrer: { type: String, default: '', trim: true },
  userAgent: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

visitSchema.index({ createdAt: -1 });
visitSchema.index({ path: 1 });

module.exports = mongoose.model('Visit', visitSchema);
