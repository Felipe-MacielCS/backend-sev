import dbConfig from "../config/db.config.js";
import { Sequelize, DataTypes } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

import User from "./user.model.js";
import Athlete from "./athlete.model.js";
import Session from "./session.model.js";
import Coach from "./coach.model.js";
import Goal from "./goal.model.js";
import Exercise from "./exercise.model.js";
import ExercisePlan from "./exerciseplan.model.js";
import ExercisePool from "./exercisepool.model.js";
import Result from "./result.model.js";
import PlanAssignment from "./planassignment.model.js";
import CoachAthlete from "./coachathlete.model.js";

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.user = User;
db.session = Session;
db.athlete = Athlete;
db.coach = Coach;
db.goal = Goal;
db.exercise = Exercise;
db.exerciseplan = ExercisePlan;
db.exercisepool = ExercisePool;
db.result = Result;
db.planassignment = PlanAssignment;
db.coachathlete = CoachAthlete;

// User to Athlete
db.user.hasMany(db.athlete, { foreignKey: "userID", onDelete: "CASCADE" });
db.athlete.belongsTo(db.user, { foreignKey: "userID" });

// User to Coach
db.user.hasOne(db.coach, { foreignKey: "userID", onDelete: "CASCADE" });
db.coach.belongsTo(db.user, { foreignKey: "userID" });

// Athlete to Goal
db.athlete.hasMany(db.goal, { foreignKey: "athleteID", onDelete: "RESTRICT" });
db.goal.belongsTo(db.athlete, { foreignKey: "athleteID" });

// Exercise to Goal
db.exercise.hasMany(db.goal, { foreignKey: "exerciseID", onDelete: "RESTRICT" });
db.goal.belongsTo(db.exercise, { foreignKey: "exerciseID" });

// Goal to Result
db.goal.hasMany(db.result, { foreignKey: "goalID", onDelete: "CASCADE" });
db.result.belongsTo(db.goal, { foreignKey: "goalID" });

// Coach to ExercisePlan
db.coach.hasMany(db.exerciseplan, { foreignKey: "coachID", onDelete: "CASCADE" });
db.exerciseplan.belongsTo(db.coach, { foreignKey: "coachID" });

db.department.hasMany(db.schedule, { foreignKey: "departmentID" });
db.schedule.belongsTo(db.department, { foreignKey: "departmentID" });

// Exercise to ExercisePlan using exercisePool
db.exercise.belongsToMany(db.exerciseplan, {
  through: db.exercisepool,
  foreignKey: "exerciseID",
  otherKey: "planID",
  onDelete: "CASCADE",
});

db.exerciseplan.belongsToMany(db.exercise, {
  through: db.exercisepool,
  foreignKey: "planID",
  otherKey: "exerciseID",
  onDelete: "CASCADE",
});

// Athlete to ExercisePlan using PlanAssignment
Athlete.belongsToMany(ExercisePlan, {
  through: PlanAssignment,
  foreignKey: "athleteID",
  otherKey: "planID",
  as: "plans",
});

ExercisePlan.belongsToMany(Athlete, {
  through: PlanAssignment,
  foreignKey: "planID",
  otherKey: "athleteID",
  as: "athletes",
});

// Coach to Athlete using CoachAthlete
db.coach.belongsToMany(db.athlete, {
  through: db.coachathlete,
  foreignKey: "coachID",
  otherKey: "athleteID",
  as: "athletes",
});

db.athlete.belongsToMany(db.coach, {
  through: db.coachathlete,
  foreignKey: "athleteID",
  otherKey: "coachID",
  as: "coaches",
});

export default db;
