const mongoose = require('mongoose');
const { SCHEMA_VALUES } = require('../utils/quoteStatus');

const quoteSchema = new mongoose.Schema({
  client_name: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true
  },
  client_email: {
    type: String,
    required: [true, 'El email es requerido'],
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido']
  },
  client_phone: {
    type: String,
    required: [true, 'El teléfono es requerido'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'La descripción es requerida']
  },
  file_urls: [{
    filename: String,
    size: Number,
    mimetype: String,
    url: String
  }],
  status: {
    type: String,
    // Incluye los estados viejos (pending/responded/accepted) para no invalidar
    // las cotizaciones anteriores al seguimiento. Ver utils/quoteStatus.js.
    enum: SCHEMA_VALUES,
    default: 'received'
  },
  // Token del enlace publico de seguimiento. Es el unico secreto que protege
  // los datos del pedido, asi que se genera con crypto y no se deriva del _id.
  tracking_token: {
    type: String,
    index: { unique: true, sparse: true }
  },
  // Cada cambio de estado deja su marca, para poder mostrarle al cliente
  // cuando paso cada cosa en vez de solo el estado actual.
  status_history: [{
    status: String,
    at: { type: Date, default: Date.now },
    note: String,
    _id: false
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Índices
quoteSchema.index({ client_email: 1 });
quoteSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Quote', quoteSchema);