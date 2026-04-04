import unavailabilities from "../controllers/unavailability.controller.js";
import authenticate from "../authorization/authorization.js";
import { Router } from "express";

const unavailabilityRouter = Router();

unavailabilityRouter.post("/", [authenticate], unavailabilities.create);
unavailabilityRouter.get("/", [authenticate], unavailabilities.findAll);
unavailabilityRouter.get("/user/:userID", [authenticate], unavailabilities.findByUser);
unavailabilityRouter.get("/:id", [authenticate], unavailabilities.findOne);
unavailabilityRouter.put("/:id", [authenticate], unavailabilities.update);
unavailabilityRouter.delete("/:id", [authenticate], unavailabilities.delete);
unavailabilityRouter.delete("/user/:userID/past", [authenticate], unavailabilities.deletePast);

export default unavailabilityRouter;
