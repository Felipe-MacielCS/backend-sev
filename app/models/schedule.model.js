import { DataTypes } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

const Schedule = sequelize.define(
  "schedule",
  {
    ID: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(255), allowNull: true },
    start_date: { type: DataTypes.DATEONLY, allowNull: false },
    end_date: { type: DataTypes.DATEONLY, allowNull: false },
    status: { type: DataTypes.STRING, allowNull: false, defaultValue: "draft" },
    type: { type: DataTypes.STRING, allowNull: false },
    departmentID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "departments", key: "ID" },
    },
  },
  {
    tableName: "schedules",
    timestamps: true,
    indexes: [{ fields: ["departmentID"] }, { fields: ["status"] }, { fields: ["type"] }],
  }
);

export default Schedule;
