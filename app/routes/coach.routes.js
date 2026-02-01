import coaches from "../controllers/coach.controller.js";
import authenticate from "../authorization/authorization.js";
import { Router } from "express";

var coachRouter = Router();

coachRouter.post("/", [authenticate], coaches.create);
coachRouter.get("/", [authenticate], coaches.findAll);
coachRouter.get("/:id", [authenticate], coaches.findOne);
coachRouter.put("/:id", [authenticate], coaches.update);
coachRouter.delete("/:id", [authenticate], coaches.delete);

export default coachRouter;