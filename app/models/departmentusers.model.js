import { DataTypes } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

const DepartmentUser = sequelize.define(
  "departmentUser",
  {
    ID: {
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
    employee_pay_rate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
  },
  {
    tableName: "department_users",
    timestamps: true,
  }
);

export default DepartmentUser;
