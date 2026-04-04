const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Por favor proporciona un título'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Por favor proporciona una descripción']
  },
  category: {
    type: String,
    enum: ['instalaciones', 'piezas', 'estructuras', 'tamiz', 'paneles'],
    required: true
  },
  images: [
    {
      url: String
    }
  ],
  videos: [
    {
      url: String
    }
  ],
  status: {
    type: String,
    enum: ['activo', 'completado', 'archivado'],
    default: 'activo'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Project', projectSchema);