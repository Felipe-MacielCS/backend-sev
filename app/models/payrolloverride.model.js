import { DataTypes } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

const PayrollOverride = sequelize.define(
  "payrolloverride",
  {
    ID: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    departmentID: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    user_shift_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    week_start: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    override_hours: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    override_hourly_rate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    notes: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    tableName: "payroll_overrides",
    timestamps: true,
  }
);

export default PayrollOverride;