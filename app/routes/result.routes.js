import results from "../controllers/result.controller.js";
import authenticate from "../authorization/authorization.js";
import { Router } from "express";

var resultRouter = Router();

resultRouter.post("/",  results.create);
resultRouter.get("/",  results.findAll);
resultRouter.get("/:id",  results.findOne);
resultRouter.put("/:id",results.update);
resultRouter.delete("/:id",  results.delete);

export default resultRouter;
