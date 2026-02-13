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
      validate: {
        notEmpty: { msg: "name cannot be empty" },
      },
    },

    phone: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },

    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: { msg: "email must be a valid email address" },
        notEmpty: { msg: "email cannot be empty" },
      },
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
