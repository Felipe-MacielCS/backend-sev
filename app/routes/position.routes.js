import positions from "../controllers/position.controller.js";
import authenticate from "../authorization/authorization.js";
import { Router } from "express";

const positionRouter = Router();
positionRouter.post("/", [authenticate], positions.create);
positionRouter.get("/", [authenticate], positions.findAll);
positionRouter.get("/:id", [authenticate], positions.findOne);
positionRouter.put("/:id", [authenticate], positions.update);
positionRouter.delete("/:id", [authenticate], positions.delete);
positionRouter.patch("/:id/restore", [authenticate], positions.restore);
positionRouter.get("/:id/users", [authenticate], positions.getPositionUsers);

export default positionRouter;