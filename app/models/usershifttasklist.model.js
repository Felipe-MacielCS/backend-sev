import { DataTypes } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

const UserShiftTaskList = sequelize.define(
  "userShiftTaskList",
  {
    ID: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    user_shiftID: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    task_listID: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "user_shift_task_list",
    timestamps: true,
  }
);

export default UserShiftTaskList;
