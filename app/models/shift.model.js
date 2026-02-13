import { DataTypes } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

const Shift = sequelize.define(
  "shift",
  {
    ID: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    shift_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    start_time: {
      type: DataTypes.TIME,
      allowNull: false,
    },

    end_time: {
      type: DataTypes.TIME,
      allowNull: false,
    },

    workers_required: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1,
      },
    },

    scheduleID: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    positionID: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "shifts",
    timestamps: true,
  }
);

export default Shift;
