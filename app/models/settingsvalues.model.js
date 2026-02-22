import { DataTypes } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

const SettingsValues = sequelize.define(
  "settingsValues",
  {
    ID: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    settingID: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    userID: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    departmentID: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    value: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: { notEmpty: true },
    },
  },
  {
    tableName: "settings_values",
    timestamps: true,
    indexes: [
      { unique: true, fields: ["settingID", "userID"] },
      { unique: true, fields: ["settingID", "departmentID"] },
    ],
    hooks: {
      // Use either UserID or DepartmentID
      beforeValidate: (row) => {
        const hasUser = row.userID !== null && row.userID !== undefined;
        const hasDept = row.departmentID !== null && row.departmentID !== undefined;

        if (hasUser && hasDept) {
          throw new Error("Provide either userID OR departmentID.");
        }
        if (!hasUser && !hasDept) {
          throw new Error("Provide either userID OR departmentID.");
        }
      },
    },
  }
);

export default SettingsValues;