const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect("mongodb://127.0.0.1:27017/metsim");

const Pedido = mongoose.model("Pedido", {
  nombre: String,
});

app.post("/api/pedidos", async (req, res) => {
  const nuevo = new Pedido(req.body);
  await nuevo.save();
  res.send("ok");
});

app.listen(5000, () => console.log("Servidor activo"));