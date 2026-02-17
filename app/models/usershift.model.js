import { DataTypes } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

const UserShift = sequelize.define(
  "userShift",
  {
    ID: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    status: {
      type: DataTypes.STRING(40),
      allowNull: false,
      defaultValue: "assigned",
    },

    shiftID: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    userID: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "user_shifts",
    timestamps: true,
  }
);

export default UserShift;
