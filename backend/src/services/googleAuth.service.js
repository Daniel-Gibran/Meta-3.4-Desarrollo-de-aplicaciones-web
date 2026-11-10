import { google } from 'googleapis';

import { Usuario } from '../models/index.js';
import ApiError from '../utils/ApiError.js';

/**
 * Reglas de Google OAuth, sin conocer Express.
 *
 * Sigue el mismo código base que el material del curso
 * ("Código autenticación Google OAuth 2.0"): se usa la librería `googleapis`,
 * se genera la URL de autorización, se intercambia el `code` por tokens y se
 * consulta el perfil con `google.oauth2('v2').userinfo.get()`.
 */

const SCOPES = [
  'openid',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

/**
 * Comprueba que las credenciales estén configuradas y las devuelve.
 * Sin esto, el error de Google sería un 500 confuso.
 */
function leerConfiguracion () {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw ApiError.internal(
      'Falta configurar GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET y GOOGLE_REDIRECT_URI'
    );
  }

  return { clientId, clientSecret, redirectUri };
}

/** Crea el cliente OAuth 2.0 con las credenciales del .env. */
export function crearCliente () {
  const { clientId, clientSecret, redirectUri } = leerConfiguracion();

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

/**
 * Construye la URL a la que hay que mandar al navegador para que el usuario
 * autorice la aplicación.
 *
 * `state` es un valor aleatorio que viaja a Google y regresa en el callback.
 * Sirve para comprobar que la respuesta corresponde a una petición que inició
 * este servidor (protección contra CSRF en el flujo OAuth).
 */
export function urlAutorizacion (state) {
  const cliente = crearCliente();

  return cliente.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
    state,
  });
}

/**
 * Intercambia el `code` que devuelve Google por tokens y consulta el perfil.
 *
 * @param {string} code
 * @returns {Promise<{ id: string, email: string, verified_email: boolean, name: string, picture: string }>}
 */
export async function obtenerPerfil (code) {
  const cliente = crearCliente();
  const { tokens } = await cliente.getToken(code);
  cliente.setCredentials(tokens);

  const oauth2 = google.oauth2({ version: 'v2', auth: cliente });
  const { data } = await oauth2.userinfo.get();

  return data;
}

/**
 * Busca la cuenta por correo; si no existe la crea y si existe la vincula con
 * Google. El rol de una cuenta nueva es `publico`: el rol Admin se asigna
 * manualmente en la base de datos, igual que con el login local.
 *
 * @param {{ id: string, email: string, verified_email: boolean, name: string, picture: string }} perfil
 * @returns {Promise<import('../models/usuario.model.js').default>}
 */
export async function registrarOIniciar (perfil) {
  const email = String(perfil.email ?? '').trim().toLowerCase();

  if (email === '') {
    throw ApiError.badRequest('Google no devolvió un correo electrónico');
  }

  if (perfil.verified_email === false) {
    throw ApiError.unauthorized('El correo de Google no está verificado');
  }

  const nombre = perfil.name || email.split('@')[0];
  let usuario = await Usuario.findOne({ where: { email } });

  if (!usuario) {
    return Usuario.create({
      nombre,
      email,
      google_id: perfil.id,
      foto: perfil.picture || null,
      password_hash: null,
      rol: 'publico',
      activo: true,
    });
  }

  if (!usuario.activo) {
    throw ApiError.forbidden('La cuenta está desactivada');
  }

  // Cuenta que ya existía (por ejemplo, creada con el seeder local): se vincula
  // con Google sin tocar su rol ni su contraseña.
  const cambios = {};

  if (!usuario.google_id) cambios.google_id = perfil.id;
  if (perfil.picture && perfil.picture !== usuario.foto) cambios.foto = perfil.picture;

  if (Object.keys(cambios).length > 0) {
    await usuario.update(cambios);
  }

  return usuario;
}

export default { crearCliente, urlAutorizacion, obtenerPerfil, registrarOIniciar };
