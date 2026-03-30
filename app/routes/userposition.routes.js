import userPositions from "../controllers/userposition.controller.js";
import authenticate from "../authorization/authorization.js";
import { Router } from "express";

const userPositionRouter = Router();

userPositionRouter.post("/", [authenticate], userPositions.create);
userPositionRouter.get("/", [authenticate], userPositions.findAll);
userPositionRouter.get("/:id", [authenticate], userPositions.findOne);
userPositionRouter.delete("/:id", [authenticate], userPositions.delete);
userPositionRouter.delete("/", [authenticate], userPositions.deleteByPair);

export default userPositionRouter;
