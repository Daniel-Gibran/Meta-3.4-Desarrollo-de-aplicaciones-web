import { DataTypes, Model } from 'sequelize';

import sequelize from '../config/database.js';

/**
 * Modelo Usuario: cuenta que puede iniciar sesión en la aplicación.
 * Tabla: `usuarios`.
 *
 * La contraseña nunca se guarda en texto plano: `password_hash` contiene el
 * resultado de bcrypt. El rol distingue al administrador (puede escribir) del
 * usuario público (solo lectura).
 */
export default class Usuario extends Model {
  /**
   * Serializa el usuario sin el hash de la contraseña. Así, aunque alguien
   * devuelva la instancia completa en una respuesta, el hash no se filtra.
   */
  toJSON () {
    const { password_hash, ...publico } = this.get({ plain: true });
    return publico;
  }
}

Usuario.init(
  {
    // Identificador interno de la cuenta.
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    // Nombre que se muestra en la interfaz.
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    // Correo con el que se inicia sesión. No puede repetirse.
    email: {
      type: DataTypes.STRING(120),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: {
          msg: 'El email no tiene un formato válido',
        },
      },
    },
    // Hash bcrypt de la contraseña; nunca la contraseña en texto plano.
    // Es NULL en las cuentas que solo usan Google OAuth.
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    // Identificador de la cuenta de Google (claim `sub`). NULL en las cuentas
    // que se registraron con correo y contraseña.
    google_id: {
      type: DataTypes.STRING(64),
      allowNull: true,
      unique: true,
    },
    // URL de la foto de perfil que entrega Google.
    foto: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    // admin puede escribir; publico solo puede leer.
    rol: {
      type: DataTypes.ENUM('admin', 'publico'),
      allowNull: false,
      defaultValue: 'publico',
    },
    // Una cuenta desactivada no puede iniciar sesión.
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: 'Usuario',
    tableName: 'usuarios',
    timestamps: true,
  }
);
