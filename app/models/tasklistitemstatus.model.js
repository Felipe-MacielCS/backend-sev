import { DataTypes } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

const TaskListItemStatus = sequelize.define(
  "taskListItemStatus",
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
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    date_checked: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    checked_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    task_list_itemID: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    user_shiftID: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "task_list_item_status",
    timestamps: true,
  }
);

export default TaskListItemStatus;