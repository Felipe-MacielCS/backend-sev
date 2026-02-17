import { DataTypes } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

const DepartmentUser = sequelize.define(
  "departmentUser",
  {
    departmentUserID: { 
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userID: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    departmentID: { 
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "department_users",
    timestamps: true,
  }
);

export default DepartmentUser;