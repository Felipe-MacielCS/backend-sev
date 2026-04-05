import { Router } from "express";
import {
  getDepartmentBudget,
  saveDepartmentBudget,
} from "../controllers/budget.controller.js";

const router = Router();

router.get("/department/:departmentID", getDepartmentBudget);
router.post("/department/:departmentID", saveDepartmentBudget);

export default router;