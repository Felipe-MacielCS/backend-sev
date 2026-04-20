import { Router } from "express";
import authenticate from "../authorization/authorization.js";
import payroll from "../controllers/payroll.controller.js";

const router = Router();

router.get("/department/:departmentID", [authenticate], payroll.getWeeklyPayroll);
router.put("/override/:userShiftID", [authenticate], payroll.savePayrollOverride);
router.delete("/override/:userShiftID", [authenticate], payroll.clearPayrollOverride);

export default router;