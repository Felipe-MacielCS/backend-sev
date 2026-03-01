import settings from "../controllers/settings.controller.js";
import authenticate from "../authorization/authorization.js";
import { Router } from "express";

const settingsRouter = Router();

settingsRouter.post("/", [authenticate], settings.create);
settingsRouter.get("/", [authenticate], settings.findAll);
settingsRouter.get("/:id", [authenticate], settings.findOne);
settingsRouter.put("/:id", [authenticate], settings.update);
settingsRouter.delete("/:id", [authenticate], settings.delete);

export default settingsRouter;