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
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: { notEmpty: true },
    },

    label: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },

    value_type: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [["string", "int", "bool", "json", "time", "date"]],
      },
    },

    default_value: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "settings",
    timestamps: true,
  }
);

export default Settings;