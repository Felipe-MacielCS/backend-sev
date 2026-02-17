import { Router } from "express";
import authenticate from "../authorization/authorization.js";
import schedules from "../controllers/schedule.controller.js";

const router = Router();

router.post("/", [authenticate], schedules.create);
router.get("/", [authenticate], schedules.findAll);
router.get("/:id", [authenticate], schedules.findOne);
router.put("/:id", [authenticate], schedules.update);
router.delete("/:id", [authenticate], schedules.delete);

export default router;
