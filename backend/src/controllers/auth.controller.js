import asyncHandler from '../utils/asyncHandler.js';
import authService from '../services/auth.service.js';
import { borrarSesion, emitirSesion } from '../utils/sesion.js';

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

  const csrfToken = emitirSesion(res, usuario);

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
  borrarSesion(res);

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
