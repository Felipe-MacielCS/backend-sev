import { DataTypes } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

const ClockInOut = sequelize.define(
  "clockinout",
  {
    ID: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    clock_in_time: { type: DataTypes.DATE, allowNull: false },
    clock_out_time: { type: DataTypes.DATE, allowNull: true },
    user_shift_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "user_shifts", key: "ID" },
    },
  },
  {
    tableName: "clock_in_out",
    timestamps: false,
    indexes: [{ fields: ["user_shift_id"] }],
  }
);

export default ClockInOut;
