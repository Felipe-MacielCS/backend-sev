import goals from "../controllers/goal.controller.js";
import authenticate from "../authorization/authorization.js";
import { Router } from "express";

const router = Router();

router.post("/", [authenticate], goals.create);
router.get("/", [authenticate], goals.findAll);
router.get("/:id", [authenticate], goals.findOne);
router.put("/:id", [authenticate], goals.update);
router.delete("/:id", [authenticate], goals.delete);

export default router;