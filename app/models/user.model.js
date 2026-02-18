import { DataTypes } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

const User = sequelize.define(
  "user",
  {
    ID: { 
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    phone: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    role: { 
      type: DataTypes.ENUM('Worker', 'Manager', 'Admin'),
      allowNull: false,
      defaultValue: 'Worker'
    },
    status: {
      type: DataTypes.STRING(40),
      allowNull: false,
      defaultValue: "active",
    },
  },
  {
    tableName: "users",
    timestamps: true,
  }
);

export default User;