import { DataTypes } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

const Announcement = sequelize.define(
  "announcement",
  {
    ID: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    subject: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    departmentID: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    createdByUserID: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    recipientCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: "announcements",
    timestamps: true,
  }
);

export default Announcement;
