import { Router } from "express";

const router = Router();

import AuthRoutes from "./auth.routes.js";
import UserRoutes from "./user.routes.js";
import UserShiftRoutes from "./usershift.routes.js";
import ShiftRoutes from "./shift.routes.js";
import UserShiftTaskListRoutes from "./usershifttasklist.routes.js";
import TaskListRoutes from "./tasklist.routes.js";

router.use("/users", UserRoutes);
router.use("/", AuthRoutes);
router.use("/usershifts", UserShiftRoutes);
router.use("/shifts", ShiftRoutes)
router.use("/usershifttasklist", UserShiftTaskListRoutes);
router.use("/tasklist", TaskListRoutes);

export default router;
