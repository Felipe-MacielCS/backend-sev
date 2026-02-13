import shifts from "../controllers/shift.controller.js";
import authenticate from "../authorization/authorization.js";
import { Router } from "express";

const shiftRouter = Router();

shiftRouter.post("/", [authenticate], shifts.create);
shiftRouter.get("/", [authenticate], shifts.findAll);
shiftRouter.get("/:id", [authenticate], shifts.findOne);
shiftRouter.put("/:id", [authenticate], shifts.update);
shiftRouter.delete("/:id", [authenticate], shifts.delete);

export default shiftRouter;
