import { DataTypes } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

const Budget = sequelize.define(
  "budget",
  {
    ID: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    departmentID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },
    total_budget: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 30000.0,
    },
  },
  {
    tableName: "budgets",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export default Budget;