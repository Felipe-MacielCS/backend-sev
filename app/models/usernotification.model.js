import { DataTypes } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

const UserNotification = sequelize.define(
  "usernotification",
  {
    ID: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    notificationID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "notifications", key: "ID" },
    },
    userID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "users", key: "ID" },
    },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    time: { type: DataTypes.TIME, allowNull: false },
  },
  {
    tableName: "user_notifications",
    timestamps: false,
    indexes: [{ fields: ["userID"] }, { fields: ["notificationID"] }],
  }
);

export default UserNotification;
