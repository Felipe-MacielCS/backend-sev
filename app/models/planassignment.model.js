import { DataTypes } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

const PlanAssignment = sequelize.define(
  "planassignment",
  {
    planID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    athleteID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    assignedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "planassignments",
    timestamps: false,
  }
);

export default PlanAssignment;