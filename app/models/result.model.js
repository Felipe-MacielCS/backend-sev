import { DataTypes } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

const Result = sequelize.define(
  "result",
  {
    resultID: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    recordDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    value: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    goalID: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "results",
    timestamps: true,
  }
);

export default Result;