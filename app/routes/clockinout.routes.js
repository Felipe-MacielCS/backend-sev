import { Router } from "express";
import authenticate from "../authorization/authorization.js";
import clockinout from "../controllers/clockinout.controller.js";

const router = Router();

// Create manual clock record
router.post("/", [authenticate], clockinout.create);

// Update manual clock record
router.put("/:id", [authenticate], clockinout.update);

// Clock In
router.post(
  "/user-shifts/:userShiftID/clock-in",
  [authenticate],
  clockinout.clockIn
);

// Clock Out
router.post(
  "/user-shifts/:userShiftID/clock-out",
  [authenticate],
  clockinout.clockOut
);

// Get timecard for a user shift
router.get(
  "/user-shifts/:userShiftID",
  [authenticate],
  clockinout.findByUserShift
);

export default router;
