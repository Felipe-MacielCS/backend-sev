import dbConfig from "../config/db.config.js";
import { Sequelize, DataTypes } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

import User from "./user.model.js";
import UserShift from "./usershift.model.js";
import Shift from "./shift.model.js";
import UserShiftTaskList from "./usershifttasklist.model.js";
import TaskList from "./tasklist.model.js";
import Notification from "./notification.model.js";
import UserNotification from "./usernotification.model.js";
import Department from "./department.model.js";
import Schedule from "./schedule.model.js";
import ClockInOut from "./clockinout.model.js";
import Session from "./session.model.js";

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.session = Session;
db.user = User;
db.usershift = UserShift;
db.shift = Shift;
db.usershifttasklist = UserShiftTaskList; 
db.tasklist = TaskList;
db.notification = Notification;
db.usernotification = UserNotification;
db.department = Department;
db.schedule = Schedule;
db.clockinout = ClockInOut;

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
  as: "taskLists",
});

db.tasklist.belongsToMany(db.usershift, {
  through: db.usershifttasklist,
  foreignKey: "task_listID",
  otherKey: "user_shiftID",
  as: "userShifts",
});

db.notification.hasMany(db.usernotification, { foreignKey: "notificationID" });
db.usernotification.belongsTo(db.notification, { foreignKey: "notificationID" });

db.user.hasMany(db.usernotification, { foreignKey: "userID" });
db.usernotification.belongsTo(db.user, { foreignKey: "userID" });

db.department.hasMany(db.schedule, { foreignKey: "departmentID" });
db.schedule.belongsTo(db.department, { foreignKey: "departmentID" });

db.usershift.hasMany(db.clockinout, { foreignKey: "user_shift_id" });
db.clockinout.belongsTo(db.usershift, { foreignKey: "user_shift_id" });

export default db;
