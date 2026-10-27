import crypto from 'node:crypto';

import jwt from 'jsonwebtoken';

import asyncHandler from '../utils/asyncHandler.js';
import authService from '../services/auth.service.js';

const COOKIE_JWT = 'jwt_token';
const COOKIE_CSRF = 'csrf_token';

/**
 * Opciones comunes de las cookies.
 *
 * `sameSite: 'strict'` impide que el navegador envíe las cookies en peticiones
 * originadas por otro sitio, que es la primera barrera contra CSRF. `secure`
 * se activa solo en producción porque en desarrollo el servidor usa HTTP.
 */
function opcionesBase () {
  return {
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.COOKIE_SAMESITE || 'strict',
    maxAge: Number(process.env.COOKIE_MAX_AGE) || 3_600_000,
    path: '/',
  };
}

/**
 * POST /api/v1/auth/login
 *
 * Verifica email y contraseña. Si son correctos:
 *  - guarda el JWT en una cookie HttpOnly (JavaScript no puede leerla),
 *  - guarda un token CSRF en una cookie legible,
 *  - devuelve el token CSRF y los datos del usuario en el cuerpo.
 *
 * El frontend enviará ese token CSRF en la cabecera `x-csrf-token` en cada
 * escritura. El JWT también lleva el token dentro, así que el servidor puede
 * comprobar que ambos coinciden.
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body ?? {};
  const usuario = await authService.autenticar(email, password);

  const csrfToken = crypto.randomBytes(32).toString('hex');

  const tokenJWT = jwt.sign(
    {
      sub: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      csrf: csrfToken,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );

  const base = opcionesBase();

  // HttpOnly: el JavaScript de la página no puede leer el JWT, así que un XSS
  // no puede robarlo. El token CSRF sí es legible a propósito: el frontend
  // necesita copiarlo en la cabecera.
  res.cookie(COOKIE_JWT, tokenJWT, { ...base, httpOnly: true });
  res.cookie(COOKIE_CSRF, csrfToken, { ...base, httpOnly: false });

  res.status(200).json({
    success: true,
    message: 'Sesión iniciada correctamente',
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
    },
    csrfToken,
  });
});

/**
 * POST /api/v1/auth/logout
 * Elimina ambas cookies. Requiere sesión y token CSRF válidos.
 */
export const logout = asyncHandler(async (_req, res) => {
  const base = opcionesBase();

  res.clearCookie(COOKIE_JWT, { ...base, httpOnly: true });
  res.clearCookie(COOKIE_CSRF, { ...base, httpOnly: false });

  res.status(200).json({
    success: true,
    message: 'Sesión cerrada correctamente',
  });
});

/**
 * GET /api/v1/auth/me
 * Devuelve el usuario de la sesión actual. Sirve para que el frontend sepa,
 * al recargar la página, si todavía hay una sesión válida.
 */
export const me = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    usuario: req.usuario,
  });
});
