import { DataTypes } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

const Settings = sequelize.define(
  "settings",
  {
    ID: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    key: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: {
          msg: "Setting key cannot be empty"
        }
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Setting name cannot be empty"
        }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    value_default: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    }
  },
  {
    tableName: "settings",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['key']
      },
      {
        fields: ['active']
      }
    ]
  }
);

export default Settings;