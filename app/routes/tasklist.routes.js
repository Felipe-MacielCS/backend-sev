import taskLists from "../controllers/tasklist.controller.js";
import authenticate from "../authorization/authorization.js";
import { Router } from "express";

const taskListRouter = Router();

taskListRouter.post("/", [authenticate], taskLists.create);
taskListRouter.get("/", [authenticate], taskLists.findAll);
taskListRouter.get("/:id", [authenticate], taskLists.findOne);
taskListRouter.put("/:id", [authenticate], taskLists.update);
taskListRouter.delete("/:id", [authenticate], taskLists.delete);

export default taskListRouter;
