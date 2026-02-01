import athletes from "../controllers/athlete.controller.js";
import authenticate from "../authorization/authorization.js";
import { Router } from "express";
var athleteRouter = Router();

athleteRouter.post("/", [authenticate], athletes.create);
athleteRouter.get("/", [authenticate], athletes.findAll);
athleteRouter.get("/:id", [authenticate], athletes.findOne);
athleteRouter.put("/:id", [authenticate], athletes.update);
athleteRouter.delete("/:id", [authenticate], athletes.delete);

export default athleteRouter;