import crypto from 'node:crypto';

import jwt from 'jsonwebtoken';

/**
 * Emisión de la sesión (JWT + CSRF) en cookies.
 *
 * Vive en un módulo aparte porque la usan dos flujos de entrada:
 *
 *  - `POST /auth/login`      → correo y contraseña (Meta 3.4).
 *  - `GET  /auth/google/callback` → Google OAuth (Meta 4.1).
 *
 * Ambos deben dejar exactamente las mismas cookies para que el resto de la
 * aplicación (middleware `autenticar` y frontend) no distinga cómo entró el
 * usuario.
 */

export const COOKIE_JWT = 'jwt_token';
export const COOKIE_CSRF = 'csrf_token';
export const COOKIE_OAUTH_STATE = 'oauth_state';

/**
 * Opciones comunes de las cookies.
 *
 * `sameSite: 'strict'` impide que el navegador envíe las cookies en peticiones
 * originadas por otro sitio, que es la primera barrera contra CSRF. `secure`
 * se activa solo en producción porque en desarrollo el servidor usa HTTP.
 */
export function opcionesBase () {
  return {
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.COOKIE_SAMESITE || 'strict',
    maxAge: Number(process.env.COOKIE_MAX_AGE) || 3_600_000,
    path: '/',
  };
}

/**
 * Firma el JWT y escribe las dos cookies de sesión.
 *
 * - `jwt_token`: HttpOnly, JavaScript no puede leerla (protege ante XSS).
 * - `csrf_token`: legible a propósito, el frontend la copia a la cabecera
 *   `x-csrf-token` en cada escritura (patrón de doble envío).
 *
 * @param {import('express').Response} res
 * @param {{ id: number, nombre: string, email: string, rol: string }} usuario
 * @returns {string} token CSRF generado
 */
export function emitirSesion (res, usuario) {
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

  res.cookie(COOKIE_JWT, tokenJWT, { ...base, httpOnly: true });
  res.cookie(COOKIE_CSRF, csrfToken, { ...base, httpOnly: false });

  return csrfToken;
}

/**
 * Borra las cookies de sesión. No se incluye `maxAge` al borrar: si se enviara,
 * el navegador podría interpretar que la cookie debe seguir viva ese tiempo.
 */
export function borrarSesion (res) {
  const { maxAge, ...base } = opcionesBase();

  res.clearCookie(COOKIE_JWT, { ...base, httpOnly: true });
  res.clearCookie(COOKIE_CSRF, { ...base, httpOnly: false });
}
