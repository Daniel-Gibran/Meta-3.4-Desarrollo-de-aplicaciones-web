import bcrypt from 'bcryptjs';

/**
 * Seeder: cuentas iniciales.
 *
 * En desarrollo se crean dos cuentas para poder demostrar la autorización:
 *
 *   Admin   → admin@esports.local   / Admin123!
 *   Público → publico@esports.local / Publico123!
 *
 * El hash se calcula aquí, en tiempo de ejecución, para no versionar una
 * contraseña cifrada que además quedaría obsoleta si se cambia el costo.
 */

const CUENTAS = [
  {
    nombre: 'Administrador',
    email: 'admin@esports.local',
    password: 'Admin123!',
    rol: 'admin',
  },
  {
    nombre: 'Visitante',
    email: 'publico@esports.local',
    password: 'Publico123!',
    rol: 'publico',
  },
];

export async function up (queryInterface) {
  const ahora = new Date();

  const filas = await Promise.all(
    CUENTAS.map(async (cuenta) => ({
      nombre: cuenta.nombre,
      email: cuenta.email,
      password_hash: await bcrypt.hash(cuenta.password, 10),
      rol: cuenta.rol,
      activo: true,
      createdAt: ahora,
      updatedAt: ahora,
    }))
  );

  await queryInterface.bulkInsert('usuarios', filas);
}

export async function down (queryInterface) {
  await queryInterface.bulkDelete('usuarios', null, {});
}

export default { up, down };
