import { Router } from "express";
import {
  createCost,
  updateCost,
  deleteCost,
} from "../controllers/budgetcost.controller.js";

const router = Router();

router.post("/", createCost);
router.put("/:id", updateCost);
router.delete("/:id", deleteCost);

export default router;