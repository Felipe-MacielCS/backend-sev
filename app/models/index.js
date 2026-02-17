import dbConfig from "../config/db.config.js";
import { Sequelize, DataTypes } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

import User from "./user.model.js";
import UserShift from "./usershift.model.js";
import Shift from "./shift.model.js";
import UserShiftTaskList from "./usershifttasklist.model.js";
import TaskList from "./tasklist.model.js";
import DepartmentUser from "./departmentusers.model.js";
import Department from "./department.model.js";
import UserPosition from "./userposition.model.js";
import Position from "./position.model.js";

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.user = User;
db.usershift = UserShift;
db.shift = Shift;
db.usershifttasklist = UserShiftTaskList; 
db.tasklist = TaskList;
db.departmentuser = DepartmentUser;
db.department = Department;
db.userposition = UserPosition;
db.position = Position;

// Department to position
db.department.hasMany(db.position, { foreignKey: "departmentID", onDelete: "CASCADE"});
db.position.belongsTo(db.department, {foreignKey: "departmentID"});

// Department to tasklist
db.department.hasMany(db.tasklist, { foreignKey: "departmentID", onDelete: "CASCADE"});
db.tasklist.belongsTo(db.department, {foreignKey: "departmentID"});

// user to position
db.user.belongsToMany(db.position, {
  through: db.userposition,
  foreignKey: "userID",
  otherKey: "positionID",
  onDelete: "CASCADE",
});

db.position.belongsToMany(db.user, {
  through: db.userposition,
  foreignKey: "positionID",
  otherKey: "userID",
  onDelete: "CASCADE",
});

// user to usershift
db.user.belongsToMany(db.shift, {
  through: db.usershift,
  foreignKey: "userID",
  otherKey: "shiftID",
  onDelete: "CASCADE",
});

db.shift.belongsToMany(db.user, {
  through: db.usershift,
  foreignKey: "shiftID",
  otherKey: "userID",
  onDelete: "CASCADE",
});

// usershift to tasklist
db.usershift.belongsToMany(db.tasklist, {
  through: db.usershifttasklist,
  foreignKey: "user_shiftID",
  otherKey: "task_listID",
  onDelete: "CASCADE",
});

db.tasklist.belongsToMany(db.usershift, {
  through: db.usershifttasklist,
  foreignKey: "task_listID",
  otherKey: "user_shiftID",
  onDelete: "CASCADE",
});

// User to department
db.user.belongsToMany(db.department, {
  through: db.departmentuser,
  foreignKey: "userID",
  otherKey: "departmentID",
  onDelete: "CASCADE",
});

db.department.belongsToMany(db.user, {
  through: db.departmentuser,
  foreignKey: "departmentID",
  otherKey: "userID",
  onDelete: "CASCADE",
});

export default db;
