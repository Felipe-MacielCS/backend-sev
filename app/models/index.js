import { Sequelize } from "sequelize";
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
import DepartmentUsers from "./departmentusers.model.js";
import SwapShiftRequest from "./swapshiftrequest.model.js";
import TaskListItems from "./tasklistitems.model.js";
import TaskListItemStatus from "./tasklistitemstatus.model.js";
import Unavailable from "./unavailable.model.js";
import UserPosition from "./userposition.model.js";
import Position from "./position.model.js";
import Settings from "./settings.model.js";
import SettingsValues from "./settingsvalues.model.js";

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.session = Session;
db.user = User;
db.usershift = UserShift;
db.shift = Shift;
db.usershifttasklist = UserShiftTaskList;
db.tasklist = TaskList;
db.tasklistitems = TaskListItems;
db.tasklistitemstatus = TaskListItemStatus;
db.notification = Notification;
db.usernotification = UserNotification;
db.department = Department;
db.schedule = Schedule;
db.clockinout = ClockInOut;
db.departmentusers = DepartmentUsers;
db.swapshiftrequest = SwapShiftRequest;
db.unavailable = Unavailable;
db.userposition = UserPosition;
db.position = Position;
db.settings = Settings;
db.settingsvalues = SettingsValues;

// user to shift (through usershift)
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

// usershift to user
db.usershift.belongsTo(db.user, { foreignKey: "userID" });
db.user.hasMany(db.usershift, { foreignKey: "userID" });

// usershift to shift
db.usershift.belongsTo(db.shift, { foreignKey: "shiftID" });
db.shift.hasMany(db.usershift, { foreignKey: "shiftID" });

// usershift to tasklist (through usershifttasklist)
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

// department to tasklist
db.department.hasMany(db.tasklist, { foreignKey: "departmentID" });
db.tasklist.belongsTo(db.department, { foreignKey: "departmentID" });

// tasklist to tasklistitems
db.tasklist.hasMany(db.tasklistitems, { foreignKey: "task_listID", onDelete: "CASCADE" });
db.tasklistitems.belongsTo(db.tasklist, { foreignKey: "task_listID" });

// tasklistitems to tasklistitemstatus
db.tasklistitems.hasMany(db.tasklistitemstatus, { foreignKey: "task_list_itemID", onDelete: "CASCADE" });
db.tasklistitemstatus.belongsTo(db.tasklistitems, { foreignKey: "task_list_itemID" });

// usershift to tasklistitemstatus
db.usershift.hasMany(db.tasklistitemstatus, { foreignKey: "user_shiftID", onDelete: "CASCADE" });
db.tasklistitemstatus.belongsTo(db.usershift, { foreignKey: "user_shiftID" });

// user to tasklistitemstatus (checked_by)
db.user.hasMany(db.tasklistitemstatus, { foreignKey: "checked_by" });
db.tasklistitemstatus.belongsTo(db.user, { foreignKey: "checked_by" });

// user to position (through userposition)
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

// shift to position
db.position.hasMany(db.shift, { foreignKey: "positionID" });
db.shift.belongsTo(db.position, { foreignKey: "positionID" });

// department to schedule
db.department.hasMany(db.schedule, { foreignKey: "departmentID" });
db.schedule.belongsTo(db.department, { foreignKey: "departmentID" });

// schedule to shift
db.schedule.hasMany(db.shift, { foreignKey: "scheduleID", onDelete: "CASCADE" });
db.shift.belongsTo(db.schedule, { foreignKey: "scheduleID" });

// user to department (through departmentusers)
db.user.belongsToMany(db.department, {
  through: db.departmentusers,
  foreignKey: "userID",
  otherKey: "departmentID",
  onDelete: "CASCADE",
});
db.department.belongsToMany(db.user, {
  through: db.departmentusers,
  foreignKey: "departmentID",
  otherKey: "userID",
  onDelete: "CASCADE",
});

// notification to usernotification
db.notification.hasMany(db.usernotification, { foreignKey: "notificationID", onDelete: "CASCADE" });
db.usernotification.belongsTo(db.notification, { foreignKey: "notificationID" });

// user to usernotification
db.user.hasMany(db.usernotification, { foreignKey: "userID", onDelete: "CASCADE" });
db.usernotification.belongsTo(db.user, { foreignKey: "userID" });

// usershift to clockinout
db.usershift.hasMany(db.clockinout, { foreignKey: "user_shift_id", onDelete: "CASCADE" });
db.clockinout.belongsTo(db.usershift, { foreignKey: "user_shift_id" });

// usershift to swapshiftrequest
db.usershift.hasMany(db.swapshiftrequest, { foreignKey: "user_shift_id", onDelete: "CASCADE" });
db.swapshiftrequest.belongsTo(db.usershift, { foreignKey: "user_shift_id" });

// user to unavailable
db.user.hasMany(db.unavailable, { foreignKey: "userID", onDelete: "CASCADE" });
db.unavailable.belongsTo(db.user, { foreignKey: "userID" });

// settings to settingsvalues
db.settings.hasMany(db.settingsvalues, { foreignKey: "settingID", onDelete: "CASCADE" });
db.settingsvalues.belongsTo(db.settings, { foreignKey: "settingID" });

// user to settingsvalues
db.user.hasMany(db.settingsvalues, { foreignKey: "userID", onDelete: "CASCADE" });
db.settingsvalues.belongsTo(db.user, { foreignKey: "userID" });

// department to settingsvalues
db.department.hasMany(db.settingsvalues, { foreignKey: "departmentID", onDelete: "CASCADE" });
db.settingsvalues.belongsTo(db.department, { foreignKey: "departmentID" });

export default db;