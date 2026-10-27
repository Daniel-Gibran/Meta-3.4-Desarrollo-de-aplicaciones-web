import bcrypt from 'bcryptjs';

import { Usuario } from '../models/index.js';
import ApiError from '../utils/ApiError.js';

/**
 * Reglas de autenticación, sin conocer Express.
 *
 * El mensaje de error es deliberadamente el mismo para "no existe" y
 * "contraseña incorrecta": si fueran distintos, un atacante podría averiguar
 * qué correos están registrados.
 */
const MENSAJE_CREDENCIALES = 'Email o contraseña incorrectos';

/**
 * Valida las credenciales y devuelve el usuario.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<Usuario>}
 * @throws {ApiError} 400 si faltan datos, 401 si las credenciales no sirven
 */
export async function autenticar (email, password) {
  if (typeof email !== 'string' || typeof password !== 'string' ||
      email.trim() === '' || password === '') {
    throw ApiError.badRequest('El email y la contraseña son obligatorios');
  }

  const usuario = await Usuario.findOne({
    where: { email: email.trim().toLowerCase() },
  });

  if (!usuario || !usuario.activo) {
    throw ApiError.unauthorized(MENSAJE_CREDENCIALES);
  }

  const coincide = await bcrypt.compare(password, usuario.password_hash);

  if (!coincide) {
    throw ApiError.unauthorized(MENSAJE_CREDENCIALES);
  }

  return usuario;
}

export default { autenticar };
