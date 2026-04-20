import { DataTypes } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

const Position = sequelize.define(
  "position",
  {
    positionID: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: { notEmpty: true },
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    color: {
      type: DataTypes.STRING(7),
      allowNull: true,
      validate: {
        is: /^#[0-9a-f]{6}$/i,
      },
    },

    departmentID: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    companyID: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    pay_rate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },

    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "positions",
    timestamps: true,
  }
);

export default Position;
