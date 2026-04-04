const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5000'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Conectar MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ MongoDB conectado: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ Error de conexión MongoDB: ${error.message}`);
    setTimeout(connectDB, 5000); // Reintentar en 5 segundos
  }
};

connectDB();

// Rutas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/contacts', require('./routes/contacts'));
app.use('/api/projects', require('./routes/projects'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'Backend funcionando ✅',
    mongodb: mongoose.connection.readyState === 1 ? 'Conectado' : 'Desconectado',
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Error del servidor'
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📡 CORS habilitado para http://localhost:3000`);
});