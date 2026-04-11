import React, { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Send, Phone, Mail, MapPin } from "lucide-react";
import "./Contact.css";
// ... resto del código igual

const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  client_name: {
    type: String,
    required: [true, 'Por favor proporciona un nombre'],
    trim: true
  },
  client_email: {
    type: String,
    required: [true, 'Por favor proporciona un email'],
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Por favor proporciona un email válido'
    ]
  },
  client_phone: {
    type: String,
    required: [true, 'Por favor proporciona un teléfono']
  },
  description: {
    type: String,
    required: [true, 'Por favor proporciona una descripción del proyecto']
  },
  files: [
    {
      filename: String,
      url: String
    }
  ],
  status: {
    type: String,
    enum: ['nuevo', 'revisado', 'respondido', 'cerrado'],
    default: 'nuevo'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Contact', contactSchema);