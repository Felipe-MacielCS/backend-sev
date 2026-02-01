import { DataTypes } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

const Athlete = sequelize.define(
  "athlete",
  {
    athleteID: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userID: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    weight: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    height: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    sport: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    age: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: "athletes",
    timestamps: true,
  }
);

export default Athlete;
