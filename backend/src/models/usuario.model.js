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
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
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
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    rol: {
      type: DataTypes.ENUM('admin', 'publico'),
      allowNull: false,
      defaultValue: 'publico',
    },
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
