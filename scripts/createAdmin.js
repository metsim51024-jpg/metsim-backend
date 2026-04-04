const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
require('dotenv').config();

const adminSchema = new mongoose.Schema({
  username: String,
  password: String
});

const Admin = mongoose.model('Admin', adminSchema);

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const hashedPassword = await bcryptjs.hash('Admin@2024', 10);
    
    const admin = new Admin({
      username: 'admin',
      password: hashedPassword
    });
    
    await admin.save();
    console.log('✅ Admin creado: usuario=admin, contraseña=Admin@2024');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createAdmin();