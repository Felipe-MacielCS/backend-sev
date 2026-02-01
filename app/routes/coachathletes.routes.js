import coachAthlete from "../controllers/coachathlete.controller.js";
import authenticate from "../authorization/authorization.js";
import { Router } from "express";

const router = Router();

router.post("/", [authenticate], coachAthlete.create);
router.get("/", [authenticate], coachAthlete.findAll);
router.delete("/:coachID/:athleteID", [authenticate], coachAthlete.delete);

export default router;
