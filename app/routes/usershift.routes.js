import userShifts from "../controllers/usershift.controller.js";
import authenticate from "../authorization/authorization.js";
import { Router } from "express";

const userShiftRouter = Router();

userShiftRouter.post("/", [authenticate], userShifts.create);
userShiftRouter.get("/", [authenticate], userShifts.findAll);
userShiftRouter.get("/:id", [authenticate], userShifts.findOne);
userShiftRouter.put("/:id", [authenticate], userShifts.update);
userShiftRouter.delete("/:id", [authenticate], userShifts.delete);

export default userShiftRouter;
