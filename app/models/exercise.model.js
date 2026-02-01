import { DataTypes } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

const Exercise = sequelize.define(
  "exercise",
  {
    exerciseID: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    equipment: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    muscle_group: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "exercises",
    timestamps: true,
  }
);

export default Exercise;
