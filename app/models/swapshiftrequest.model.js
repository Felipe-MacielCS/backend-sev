import { DataTypes } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

const SwapShiftRequest = sequelize.define(
  "swapShiftRequest",
  {
    swapShiftRequestID: {
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
  },
  {
    tableName: "swap_shift_requests",
    timestamps: true,
  }
);

export default SwapShiftRequest;