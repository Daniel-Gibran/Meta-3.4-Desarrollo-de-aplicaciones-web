/**
 * Migración: crea la tabla `usuarios`.
 *
 * `password_hash` almacena el resultado de bcrypt, nunca la contraseña. El
 * índice UNIQUE sobre `email` impide dos cuentas con el mismo correo.
 */

export async function up (queryInterface, Sequelize) {
  await queryInterface.createTable('usuarios', {
    id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    nombre: {
      type: Sequelize.STRING(100),
      allowNull: false,
    },
    email: {
      type: Sequelize.STRING(120),
      allowNull: false,
      unique: true,
    },
    password_hash: {
      type: Sequelize.STRING(255),
      allowNull: false,
      comment: 'Hash bcrypt de la contraseña. Nunca se guarda en texto plano.',
    },
    rol: {
      type: Sequelize.ENUM('admin', 'publico'),
      allowNull: false,
      defaultValue: 'publico',
      comment: 'Admin puede escribir; publico solo puede leer.',
    },
    activo: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    createdAt: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: Sequelize.DATE,
      allowNull: false,
    },
  });
}

export async function down (queryInterface) {
  await queryInterface.dropTable('usuarios');
}

export default { up, down };
