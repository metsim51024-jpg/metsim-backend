// backend/utils/siteUrl.js
// URL publica del sitio: la que ve el cliente en los correos y en el enlace de
// seguimiento. Tiene que ser el dominio propio.
//
// No se reutiliza FRONTEND_URL directamente porque esa variable tambien alimenta
// la lista de origenes de CORS en server.js, donde el dominio de Vercel SI hace
// falta. Si se usara tal cual, al cliente le llegaria un enlace
// metsim-frontend.vercel.app, que funciona pero no parece de METSIM.
const CANONICAL = 'https://www.metsim.com.py';

const configurado = (process.env.SITE_URL || process.env.FRONTEND_URL || '')
  .trim()
  .replace(/\/+$/, '');

const SITE_URL = (!configurado || configurado.includes('vercel.app'))
  ? CANONICAL
  : configurado;

const trackingUrlFor = (token) => `${SITE_URL}/seguimiento/${token}`;

module.exports = { SITE_URL, trackingUrlFor };
