import { DataTypes } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

const Coach = sequelize.define(
  "coach",
  {
    coachID: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userID: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "coaches",
    timestamps: true,
  }
);

export default Coach;