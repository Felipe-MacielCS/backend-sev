import { DataTypes } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

const TaskListItemStatus = sequelize.define(
  "tasklistitemstatus",
  {
    ID: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false, 
    },
    date_checked: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    checked_by: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    taskListItemID: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    userShiftID: { 
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "task_list_item_statuses",
    timestamps: true,
  }
);

export default TaskListItemStatus;