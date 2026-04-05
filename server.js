// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// ✅ CORS
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

console.log('\n🚀 ====== INICIANDO SERVIDOR ======');
console.log('📍 NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('🔌 PORT:', process.env.PORT || 5000);

// Verificar MongoDB URI
if (!process.env.MONGODB_URI) {
  console.error('❌ ERROR: MONGODB_URI no está configurado en .env');
  process.exit(1);
}

console.log('📊 MONGODB_URI configurado: ✅');

// ✅ CONECTAR MONGODB
const connectDB = async () => {
  try {
    console.log('⏳ Conectando a MongoDB...');
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      retryWrites: true
    });

    console.log(`✅ MongoDB CONECTADO`);
    console.log(`   Host: ${conn.connection.host}`);
    console.log(`   DB: ${conn.connection.name}`);
    
  } catch (error) {
    console.error(`❌ ERROR MongoDB: ${error.message}`);
    console.error('   Reintentando en 5 segundos...');
    setTimeout(connectDB, 5000);
  }
};

connectDB();

// ✅ RUTAS
console.log('\n📍 Registrando rutas...');
app.use('/api/quotes', require('./routes/quotes'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/contacts', require('./routes/contacts'));
app.use('/api/projects', require('./routes/projects'));

// Health check
app.get('/api/health', (req, res) => {
  const mongoStatus = mongoose.connection.readyState;
  const statusText = {
    0: 'Desconectado',
    1: 'Conectado',
    2: 'Conectando...',
    3: 'Desconectando...'
  };

  res.json({
    status: 'Backend funcionando ✅',
    mongodb: statusText[mongoStatus] || 'Desconocido',
    mongoReadyState: mongoStatus,
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Error del servidor',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// 404
app.use((req, res) => {
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
  console.log('\n✅ ===== SERVIDOR ACTIVO =====');
  console.log(`   http://localhost:${PORT}`);
  console.log(`   https://metsim-backend.onrender.com`);
  console.log('==============================\n');
});

module.exports = app;