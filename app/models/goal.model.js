import { DataTypes } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

const Goal = sequelize.define(
  "goal",
  {
    goalID: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    target: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    metric: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    deadline: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    athleteID: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    exerciseID: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "goals",
    timestamps: true,
  }
);

export default Goal;