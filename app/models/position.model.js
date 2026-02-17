import { DataTypes } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

const Position = sequelize.define(
  "position",
  {
    positionID: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Position title cannot be empty"
        }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    departmentID: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'departments',
        key: 'departmentID'
      }
    },
    companyID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'companies',
        key: 'companyID'
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    }
  },
  {
    tableName: "positions",
    timestamps: true,
    indexes: [
      {
        fields: ['companyID']
      },
      {
        fields: ['departmentID']
      },
      {
        fields: ['title', 'companyID'],
        unique: true,
        name: 'unique_position_per_company'
      }
    ]
  }
);

export default Position;