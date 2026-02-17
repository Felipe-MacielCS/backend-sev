import userShiftTaskLists from "../controllers/usershifttasklist.controller.js";
import authenticate from "../authorization/authorization.js";
import { Router } from "express";

const userShiftTaskListRouter = Router();

userShiftTaskListRouter.post("/", [authenticate], userShiftTaskLists.create);
userShiftTaskListRouter.get("/", [authenticate], userShiftTaskLists.findAll);
userShiftTaskListRouter.get("/:id", [authenticate], userShiftTaskLists.findOne);
userShiftTaskListRouter.put("/:id", [authenticate], userShiftTaskLists.update);
userShiftTaskListRouter.delete("/:id", [authenticate], userShiftTaskLists.delete);

export default userShiftTaskListRouter;
