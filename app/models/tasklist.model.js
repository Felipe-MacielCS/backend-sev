import { DataTypes } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

const TaskList = sequelize.define(
  "taskList",
  {
    ID: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    name: {
      type: DataTypes.STRING(120),
      allowNull: false,
      validate: {
        notEmpty: { msg: "name cannot be empty" },
      },
    },

    description: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },

    departmentID: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "task_lists",
    timestamps: true,
  }
);

export default TaskList;
