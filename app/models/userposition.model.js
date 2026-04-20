import { DataTypes } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

const UserPosition = sequelize.define(
  "userposition",
  {
    ID: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userID: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    positionID: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "user_positions",
    timestamps: true,
    indexes: [
      { fields: ["userID"] },
      { fields: ["positionID"] },
      { unique: true, fields: ["userID", "positionID"] },
    ],
  }
);

export default UserPosition;
