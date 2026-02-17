import users from "../controllers/user.controller.js";
import authenticate from "../authorization/authorization.js";
import { Router } from "express";

const userRouter = Router();

userRouter.post("/", [authenticate], users.create);
userRouter.get("/", [authenticate], users.findAll);
userRouter.get("/:id", [authenticate], users.findOne);
userRouter.put("/:id", [authenticate], users.update);
userRouter.delete("/:id", [authenticate], users.delete);

export default userRouter;
