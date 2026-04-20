import shiftTaskLists from "../controllers/shifttasklist.controller.js";
import authenticate from "../authorization/authorization.js";
import { Router } from "express";

const shiftTaskListRouter = Router();

shiftTaskListRouter.post("/", [authenticate], shiftTaskLists.create);
shiftTaskListRouter.get("/", [authenticate], shiftTaskLists.findAll);
shiftTaskListRouter.get("/:id", [authenticate], shiftTaskLists.findOne);
shiftTaskListRouter.put("/:id", [authenticate], shiftTaskLists.update);
shiftTaskListRouter.delete("/:id?", [authenticate], shiftTaskLists.delete);

export default shiftTaskListRouter;
