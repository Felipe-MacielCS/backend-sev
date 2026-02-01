import { DataTypes } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

const ExercisePool = sequelize.define(
  "exercisepool",
  {
    exerciseID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
    planID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    repetitions: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    sets: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: "exercisepools",
    timestamps: false,
  }
);

export default ExercisePool;