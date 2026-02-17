import { DataTypes } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

const Unavailability = sequelize.define(
  "unavailability",
  {
    unavailabilityID: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'userID'
      }
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: {
          msg: "Start date must be a valid date"
        },
        notEmpty: {
          msg: "Start date cannot be empty"
        }
      }
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: {
          msg: "End date must be a valid date"
        },
        notEmpty: {
          msg: "End date cannot be empty"
        }
      }
    },
    start_time: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    end_time: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isRecurring: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    }
  },
  {
    tableName: "unavailability",
    timestamps: true,
    indexes: [
      {
        fields: ['userID']
      },
      {
        fields: ['start_date', 'end_date']
      }
    ],
    validate: {
      endDateAfterStartDate() {
        if (this.end_date < this.start_date) {
          throw new Error('End date must be after or equal to start date');
        }
      },
      endTimeAfterStartTime() {
        if (this.start_time && this.end_time && 
            this.start_date === this.end_date && 
            this.end_time <= this.start_time) {
          throw new Error('End time must be after start time for same-day unavailability');
        }
      }
    }
  }
);

export default Unavailability;