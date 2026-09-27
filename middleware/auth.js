const jwt = require('jsonwebtoken');

/**
 * Unico guardia del panel administrativo.
 *
 * Antes convivian dos sistemas de login en paralelo: este, contra las
 * credenciales de entorno via POST /api/admin/login, y uno con usuarios en
 * Mongo via POST /api/auth/login, que ademas tenia un /register **publico**
 * capaz de crear cuentas con role:'admin'. Se elimino el segundo.
 *
 * La comprobacion de `id === 'admin'` no es redundante: invalida cualquier
 * token que hubiera emitido aquel registro abierto, porque esos llevan el
 * ObjectId del usuario en `id`. Sin esto seguirian siendo validos hasta
 * vencer, ya que van firmados con el mismo JWT_SECRET.
 */
const protect = (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado para acceder a esta ruta'
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET no configurado en el servidor');
      return res.status(500).json({ success: false, message: 'Servidor mal configurado' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.id !== 'admin') {
      console.warn('🚫 Token válido pero no es del panel administrativo');
      return res.status(401).json({ success: false, message: 'Token no válido' });
    }

    req.admin = decoded;
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth error:', error.message);
    return res.status(401).json({ success: false, message: 'Token no válido o expirado' });
  }
};

module.exports = { protect };
