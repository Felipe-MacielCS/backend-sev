import { DataTypes } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

const CoachAthlete = sequelize.define(
  "coachathlete",
  {
    coachID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
    athleteID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
  },
  {
    tableName: "coachathletes",
    timestamps: false,
  }
);

export default CoachAthlete;