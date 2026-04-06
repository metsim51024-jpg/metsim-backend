// backend/scripts/createAdmin.js
const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
require('dotenv').config();

async function createAdmin() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Crear esquema Admin
    const adminSchema = new mongoose.Schema({
      username: { type: String, required: true, unique: true },
      password: { type: String, required: true }
    });

    const Admin = mongoose.model('Admin', adminSchema);

    // Verificar si ya existe
    const existingAdmin = await Admin.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('⚠️ Admin ya existe');
      process.exit(0);
    }

    // Crear admin
    const hashedPassword = await bcryptjs.hash('Admin@2024', 10);
    
    const admin = new Admin({
      username: 'admin',
      password: hashedPassword
    });

    await admin.save();
    console.log('✅ Admin creado exitosamente');
    console.log('\n📍 Credenciales:');
    console.log('   Usuario: admin');
    console.log('   Contraseña: admin123456');
    console.log('\n🔗 Accede en: https://metsim-frontend.vercel.app/admin/login\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createAdmin();