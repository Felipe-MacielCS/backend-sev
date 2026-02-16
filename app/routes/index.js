import { Router } from "express";

const router = Router();

import AuthRoutes from "./auth.routes.js";
import UserRoutes from "./user.routes.js";
import AthleteRoutes from "./athlete.routes.js";
import Coach from "./coach.routes.js";
import Goal from "./goal.routes.js";
import Exercise from "./exercise.routes.js";
import ExercisePlan from "./exerciseplan.routes.js";
import ExercisePool from "./exercisepool.routes.js";
import ResultRoutes from "./result.routes.js";
import PlanAssignmentRoutes from "./planassignment.routes.js";
import CoachAthleteRoutes from "./coachathletes.routes.js";
import ClockInOutRoutes from "./clockinout.routes.js";


router.use("/", AuthRoutes);
router.use("/users", UserRoutes);
router.use("/athletes", AthleteRoutes);
router.use("/coaches", Coach);
router.use("/goals", Goal);
router.use("/exercises", Exercise);
router.use("/exerciseplans", ExercisePlan);
router.use("/exercisepools", ExercisePool);
router.use("/results", ResultRoutes);
router.use("/planassignments", PlanAssignmentRoutes);
router.use("/coachathletes", CoachAthleteRoutes);
router.use("/clockinout", ClockInOutRoutes);

export default router;
