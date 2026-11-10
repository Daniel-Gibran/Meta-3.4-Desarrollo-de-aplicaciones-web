/**
 * Migración: agrega los datos que Google OAuth necesita en `usuarios`.
 *
 * Un usuario que entra con Google no tiene contraseña local, por eso
 * `password_hash` pasa a ser opcional. Se agregan:
 *
 *  - google_id: identificador único de la cuenta de Google (`sub`).
 *  - foto:      URL de la foto de perfil que devuelve Google.
 *
 * El login local de la Meta 3.4 sigue funcionando para las cuentas que sí
 * tienen `password_hash`.
 */

export async function up (queryInterface, Sequelize) {
  await queryInterface.addColumn('usuarios', 'google_id', {
    type: Sequelize.STRING(64),
    allowNull: true,
    unique: true,
    after: 'email',
    comment: 'Identificador de la cuenta de Google (claim sub).',
  });

  await queryInterface.addColumn('usuarios', 'foto', {
    type: Sequelize.STRING(500),
    allowNull: true,
    after: 'google_id',
    comment: 'URL de la foto de perfil de Google.',
  });

  await queryInterface.changeColumn('usuarios', 'password_hash', {
    type: Sequelize.STRING(255),
    allowNull: true,
    comment: 'Hash bcrypt de la contraseña. Es NULL cuando la cuenta es solo de Google.',
  });
}

export async function down (queryInterface, Sequelize) {
  // Las cuentas creadas solo con Google no tienen contraseña; si se restaura
  // NOT NULL la migración fallaría. Se eliminan antes de revertir el esquema.
  await queryInterface.bulkDelete('usuarios', { password_hash: null }, {});

  await queryInterface.changeColumn('usuarios', 'password_hash', {
    type: Sequelize.STRING(255),
    allowNull: false,
    comment: 'Hash bcrypt de la contraseña. Nunca se guarda en texto plano.',
  });

  await queryInterface.removeColumn('usuarios', 'foto');
  await queryInterface.removeColumn('usuarios', 'google_id');
}

export default { up, down };
