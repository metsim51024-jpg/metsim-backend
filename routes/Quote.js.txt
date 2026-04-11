// backend/models/Quote.js
const mongoose = require("mongoose");

const quoteSchema = new mongoose.Schema({
  client_name: {
    type: String,
    required: true
  },
  client_email: {
    type: String,
    required: true
  },
  client_phone: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  file_urls: [
    {
      filename: String,
      size: Number,
      url: String,
      uploadedAt: { type: Date, default: Date.now }
    }
  ],
  status: {
    type: String,
    enum: ["pending", "reviewing", "quoted", "completed"],
    default: "pending"
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Quote", quoteSchema);