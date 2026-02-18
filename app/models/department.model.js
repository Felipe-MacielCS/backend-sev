import { DataTypes } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

const Department = sequelize.define(
  "department",
  {
    ID: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "departments",
    timestamps: true,
  }
);

export default Department;
