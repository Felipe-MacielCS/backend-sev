import exerciseplans from "../controllers/exerciseplan.controller.js";
import authenticate from "../authorization/authorization.js";
import { Router } from "express";

const router = Router();

router.post("/", [authenticate], exerciseplans.create);
router.get("/", [authenticate], exerciseplans.findAll);
router.get("/:id", [authenticate], exerciseplans.findOne);
router.put("/:id", [authenticate], exerciseplans.update);
router.delete("/:id", [authenticate], exerciseplans.delete);

export default router;