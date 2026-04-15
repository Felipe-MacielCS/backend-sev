import { DataTypes } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

const SwapShiftResponse = sequelize.define(
  "swapShiftResponse",
  {
    ID: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    swapShiftRequestID: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    responderUserID: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "Pending",
    },
  },
  {
    tableName: "swap_shift_request_responses",
    timestamps: true,
    indexes: [
      {
        name: "ux_swap_response_request_user",
        unique: true,
        fields: ["swapShiftRequestID", "responderUserID"],
      },
    ],
  }
);

export default SwapShiftResponse;
