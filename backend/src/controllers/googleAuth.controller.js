import crypto from 'node:crypto';

import asyncHandler from '../utils/asyncHandler.js';
import googleAuthService from '../services/googleAuth.service.js';
import {
  COOKIE_OAUTH_STATE,
  borrarSesion,
  emitirSesion,
  opcionesBase,
} from '../utils/sesion.js';

/**
 * URL del frontend a la que se regresa después de hablar con Google.
 * Nunca se redirige a un valor que venga en la petición: así se evita un
 * open redirect.
 */
function urlFrontend () {
  return process.env.CLIENT_URL || 'http://localhost:5173';
}

/**
 * Redirige al frontend con un resultado legible en la query.
 * El frontend (LoginView) lee `oauth` y muestra el mensaje correspondiente.
 */
function volverAlFrontend (res, resultado) {
  res.redirect(`${urlFrontend()}/login?oauth=${resultado}`);
}

/**
 * GET /api/v1/auth/google/login
 *
 * No recibe datos: genera el `state`, lo guarda en una cookie temporal y manda
 * al navegador a la pantalla de consentimiento de Google.
 */
export const iniciar = asyncHandler(async (_req, res) => {
  const state = crypto.randomBytes(32).toString('hex');

  // La cookie del state debe viajar en la navegación de regreso desde Google
  // (sitio distinto), por eso `sameSite: 'lax'` y no `strict`.
  res.cookie(COOKIE_OAUTH_STATE, state, {
    ...opcionesBase(),
    maxAge: 10 * 60 * 1000,
    httpOnly: true,
    sameSite: 'lax',
  });

  const url = googleAuthService.urlAutorizacion(state);
  res.redirect(url);
});

/**
 * GET /api/v1/auth/google/callback?code=...&state=...
 *
 * Comprueba el `state`, intercambia el código, registra o recupera al usuario
 * y emite las mismas cookies que el login local (JWT HttpOnly + CSRF).
 */
export const callback = asyncHandler(async (req, res) => {
  const { code, state, error } = req.query ?? {};
  const stateGuardado = req.cookies?.[COOKIE_OAUTH_STATE];

  // Se borra siempre: el state es de un solo uso.
  res.clearCookie(COOKIE_OAUTH_STATE, { ...opcionesBase(), httpOnly: true, sameSite: 'lax' });

  if (error) {
    return volverAlFrontend(res, 'cancelado');
  }

  if (!code || !state || !stateGuardado || state !== stateGuardado) {
    return volverAlFrontend(res, 'state');
  }

  let usuario;

  try {
    const perfil = await googleAuthService.obtenerPerfil(code);
    usuario = await googleAuthService.registrarOIniciar(perfil);
  } catch (fallo) {
    console.error('Error en callback de Google:', fallo.message);
    return volverAlFrontend(res, 'error');
  }

  if (!usuario.activo) {
    borrarSesion(res);
    return volverAlFrontend(res, 'inactivo');
  }

  emitirSesion(res, usuario);

  return volverAlFrontend(res, 'ok');
});

export default { iniciar, callback };
