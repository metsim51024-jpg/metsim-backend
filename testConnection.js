require("dotenv").config();
const mongoose = require("mongoose");

console.log("URI cargada:", process.env.MONGODB_URI);

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("🔥 CONECTADO A MONGODB");
    process.exit();
  })
  .catch(err => {
    console.error("❌ ERROR:", err.message);
    process.exit(1);
  });