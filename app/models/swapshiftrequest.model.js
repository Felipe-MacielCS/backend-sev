import { DataTypes } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

const SwapShiftRequest = sequelize.define(
  "swapShiftRequest",
  {
    ID: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "Pending",
    },
    userShiftID: { 
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "swap_shift_requests",
    timestamps: true,
  }
);

export default SwapShiftRequest;
