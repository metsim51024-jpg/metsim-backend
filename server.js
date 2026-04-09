// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// ✅ CONFIGURAR CORS CORRECTAMENTE
const corsOptions = {
  origin: [
    'https://metsim-frontend.vercel.app',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5000',
    process.env.FRONTEND_URL || ''
  ].filter(Boolean),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200,
  maxAge: 86400
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`);
  next();
});

console.log('\n🚀 ====== INICIANDO SERVIDOR ======');
console.log('📍 NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('🔌 PORT:', process.env.PORT || 5000);
console.log('🌐 CORS Origins:', corsOptions.origin);

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
      retryWrites: true,
      w: 'majority'
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

// ✅ RUTAS PRINCIPALES
console.log('\n📍 Registrando rutas...');

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
    env: process.env.NODE_ENV || 'development',
    uptime: process.uptime()
  });
});

// Rutas de negocio
app.use('/api/quotes', require('./routes/quotes'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/contacts', require('./routes/contacts'));
app.use('/api/projects', require('./routes/projects'));

// Static files (si existen)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'public')));
}

// ❌ Error handling DEBE ir ANTES de 404
app.use((err, req, res, next) => {
  console.error(`❌ Error en ${req.method} ${req.path}:`, err.message);
  
  // Errores específicos
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }

  if (err.name === 'UnauthorizedError' || err.message === 'Unauthorized') {
    return res.status(401).json({
      success: false,
      message: 'Credenciales inválidas'
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Error del servidor',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// 404 - DEBE ir AL FINAL
app.use((req, res) => {
  console.warn(`⚠️ 404: ${req.method} ${req.url}`);
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.url}`,
    availableRoutes: [
      'GET /api/health',
      'POST /api/quotes',
      'GET /api/quotes',
      'POST /api/auth/login',
      'GET /api/admin/quotes',
      'POST /api/contacts'
    ]
  });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('\n✅ ===== SERVIDOR ACTIVO =====');
  console.log(`   Localhost: http://localhost:${PORT}`);
  console.log(`   Production: https://metsim-backend.onrender.com`);
  console.log('==============================\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM recibido. Cerrando servidor...');
  server.close(() => {
    console.log('Servidor cerrado');
    mongoose.connection.close();
    process.exit(0);
  });
});

module.exports = app;