// backend/scripts/backfillTracking.js
//
// Da token de seguimiento e historial inicial a las cotizaciones creadas antes
// de que existiera el seguimiento. Sin esto, esas cotizaciones no se pueden
// consultar en /seguimiento y el aviso de cambio de estado sale sin enlace.
//
// Uso:  node scripts/backfillTracking.js          (simula, no escribe)
//       node scripts/backfillTracking.js --apply  (escribe)
//
// Es idempotente: solo toca los documentos a los que les falta algo.
require('dotenv').config();
const mongoose = require('mongoose');
const crypto = require('crypto');
const Quote = require('../models/Quote');
const { normalizeStatus } = require('../utils/quoteStatus');

const APPLY = process.argv.includes('--apply');

(async () => {
  if (!process.env.MONGODB_URI) {
    console.error('❌ Falta MONGODB_URI en el .env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`✅ Conectado${APPLY ? '' : ' (modo simulación, no se escribe nada)'}\n`);

  const quotes = await Quote.find({
    $or: [
      { tracking_token: { $exists: false } },
      { tracking_token: null },
      { status_history: { $size: 0 } },
      { status_history: { $exists: false } }
    ]
  }).select('_id client_name status tracking_token status_history createdAt');

  console.log(`Cotizaciones a completar: ${quotes.length}\n`);

  let tokens = 0;
  let historias = 0;

  for (const q of quotes) {
    const ops = {};

    if (!q.tracking_token) {
      ops.tracking_token = crypto.randomBytes(24).toString('hex');
      tokens++;
    }

    if (!q.status_history || q.status_history.length === 0) {
      // Solo se conoce con certeza el alta; el estado actual se registra con la
      // fecha de creación porque no hay forma de saber cuándo cambió.
      const current = normalizeStatus(q.status);
      ops.status_history = current === 'received'
        ? [{ status: 'received', at: q.createdAt }]
        : [{ status: 'received', at: q.createdAt }, { status: current, at: q.createdAt }];
      historias++;
    }

    console.log(`  ${q._id}  ${(q.client_name || '').padEnd(24).slice(0, 24)}  ${q.status} → ${Object.keys(ops).join(', ')}`);

    if (APPLY) await Quote.updateOne({ _id: q._id }, { $set: ops });
  }

  console.log(`\nTokens generados: ${tokens}   Historiales sembrados: ${historias}`);
  if (!APPLY) console.log('\nNada se escribió. Volvé a correrlo con --apply para aplicarlo.');

  await mongoose.disconnect();
})().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
