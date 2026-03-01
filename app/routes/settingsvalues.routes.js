import settingsValues from "../controllers/settingsvalues.controller.js";
import authenticate from "../authorization/authorization.js";
import { Router } from "express";

const settingsValuesRouter = Router();

settingsValuesRouter.post("/", [authenticate], settingsValues.create);
settingsValuesRouter.get("/", [authenticate], settingsValues.findAll);
settingsValuesRouter.get("/:id", [authenticate], settingsValues.findOne);
settingsValuesRouter.put("/:id", [authenticate], settingsValues.update);
settingsValuesRouter.delete("/:id", settingsValues.delete);

export default settingsValuesRouter;