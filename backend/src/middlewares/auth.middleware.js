import jwt from 'jsonwebtoken';

import ApiError from '../utils/ApiError.js';

// Estos métodos no modifican datos, así que no necesitan token CSRF.
const METODOS_SEGUROS = new Set(['GET', 'HEAD', 'OPTIONS']);
/**
 * Autentica la petición a partir de la cookie HttpOnly `jwt_token`.
 *
 * En métodos que modifican datos (`POST`, `PUT`, `DELETE`) exige además que la
 * cabecera `x-csrf-token` coincida con el token guardado dentro del JWT. Esa
 * comparación es la protección CSRF: un sitio externo puede provocar que el
 * navegador envíe la cookie, pero no puede leer el token para ponerlo en la
 * cabecera, porque la política de mismo origen se lo impide.
 */
export function autenticar (req, _res, next) {
  const tokenJWT = req.cookies?.jwt_token;

  if (!tokenJWT) {
    return next(ApiError.unauthorized('No hay una sesión activa'));
  }

  let payload;

  try {
    payload = jwt.verify(tokenJWT, process.env.JWT_SECRET);
  } catch (error) {
    const mensaje = error.name === 'TokenExpiredError'
      ? 'La sesión expiró. Inicia sesión de nuevo.'
      : 'El token de sesión no es válido.';

    return next(ApiError.unauthorized(mensaje));
  }

  if (!METODOS_SEGUROS.has(req.method)) {
    const csrfRecibido = req.get('x-csrf-token');

    if (!csrfRecibido || csrfRecibido !== payload.csrf) {
      return next(ApiError.forbidden('Token CSRF ausente o inválido'));
    }
  }

  req.usuario = {
    id: payload.sub,
    nombre: payload.nombre,
    email: payload.email,
    rol: payload.rol,
  };

  next();
}

/**
 * Autoriza solo al rol Admin. Se usa después de `autenticar`, porque necesita
 * que `req.usuario` ya exista.
 */
export function soloAdmin (req, _res, next) {
  if (req.usuario?.rol !== 'admin') {
    return next(ApiError.forbidden('Esta operación requiere el rol Admin'));
  }

  next();
}
