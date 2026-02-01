import exercises from "../controllers/exercise.controller.js";
import authenticate from "../authorization/authorization.js";
import { Router } from "express";

const router = Router();

router.post("/", [authenticate], exercises.create);
router.get("/", [authenticate], exercises.findAll);
router.get("/:id", [authenticate], exercises.findOne);
router.put("/:id", [authenticate], exercises.update);
router.delete("/:id", [authenticate], exercises.delete);

export default router;