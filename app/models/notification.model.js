import { DataTypes } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

const Notification = sequelize.define(
  "notification",
  {
    ID: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    type: { type: DataTypes.STRING, allowNull: false },
    message: { type: DataTypes.STRING, allowNull: false },
    departmentID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "departments", key: "ID" },
    },
    event: { type: DataTypes.STRING, allowNull: false },
  },
  {
    tableName: "notifications",
    timestamps: true,
    indexes: [{ fields: ["departmentID"] }, { fields: ["type"] }, { fields: ["event"] }],
  }
);

export default Notification;
