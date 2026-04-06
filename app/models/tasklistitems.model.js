import { DataTypes } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

const TaskListItem = sequelize.define(
  "tasklistitem",
  {
    ID: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    taskListID: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    task_listID: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: "task_list_items",
    timestamps: true,
  }
);

export default TaskListItem;
