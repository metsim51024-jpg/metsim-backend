// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
require('dotenv').config();

const app = express();

// ✅ CORS CONFIGURADO
app.use(cors({
  origin: [
    'https://metsim-frontend.vercel.app',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

console.log('🚀 Variables de entorno:');
console.log('   MONGODB_URI:', process.env.MONGODB_URI ? '✅ Configurado' : '❌ No configurado');
console.log('   PORT:', process.env.PORT || 5000);
console.log('   NODE_ENV:', process.env.NODE_ENV || 'development');

// Conectar MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });
    console.log(`✅ MongoDB conectado: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Error MongoDB: ${error.message}`);
    console.log('⏳ Reintentando en 5 segundos...');
    setTimeout(connectDB, 5000);
  }
};

connectDB();

// ✅ RUTAS
app.use('/api/quotes', require('./routes/quotes'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/contacts', require('./routes/contacts'));
app.use('/api/projects', require('./routes/projects'));

// Health check
app.get('/api/health', (req, res) => {
  const mongoStatus = mongoose.connection.readyState;
  res.json({
    status: 'Backend funcionando ✅',
    mongodb: mongoStatus === 1 ? 'Conectado' : mongoStatus === 0 ? 'Desconectado' : 'Conectando...',
    timestamp: new Date().toISOString(),
    routes: {
      quotes: '/api/quotes',
      health: '/api/health'
    }
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Error del servidor',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// 404
app.use((req, res) => {
  console.warn(`⚠️ Ruta no encontrada: ${req.method} ${req.url}`);
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.url}`,
    availableRoutes: [
      'GET /api/health',
      'POST /api/quotes',
      'GET /api/quotes'
    ]
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Servidor escuchando en puerto ${PORT}`);
  console.log(`📡 CORS habilitado para Vercel`);
  console.log(`\n✅ Prueba tu backend en:`);
  console.log(`   https://metsim-backend.onrender.com/api/health\n`);
});

module.exports = app;