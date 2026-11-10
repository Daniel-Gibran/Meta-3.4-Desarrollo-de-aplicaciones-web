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
  // 1. Ambos datos son obligatorios.
  if (typeof email !== 'string' || typeof password !== 'string' ||
      email.trim() === '' || password === '') {
    throw ApiError.badRequest('El email y la contraseña son obligatorios');
  }

  // 2. Se busca la cuenta por correo, sin distinguir mayúsculas.
  const usuario = await Usuario.findOne({
    where: { email: email.trim().toLowerCase() },
  });

  // 3. Si no existe o está desactivada, no puede entrar.
  if (!usuario || !usuario.activo) {
    throw ApiError.unauthorized(MENSAJE_CREDENCIALES);
  }

  // 4. bcrypt compara la contraseña escrita con el hash guardado.
  // Las cuentas creadas con Google no tienen contraseña local.
  if (!usuario.password_hash) {
    throw ApiError.unauthorized(
      'Esta cuenta usa Google. Inicia sesión con el botón de Google.'
    );
  }

  const coincide = await bcrypt.compare(password, usuario.password_hash);

  if (!coincide) {
    throw ApiError.unauthorized(MENSAJE_CREDENCIALES);
  }

  return usuario;
}

export default { autenticar };
