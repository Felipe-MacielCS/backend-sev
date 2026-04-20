import { DataTypes } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

const ShiftTaskList = sequelize.define(
  "shiftTaskList",
  {
    ID: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    shiftID: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    task_listID: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "shift_task_list",
    timestamps: true,
  }
);

export default ShiftTaskList;
