const mongoose = require('mongoose');

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
    enum: ['pending', 'responded', 'accepted', 'rejected'],
    default: 'pending'
  },
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