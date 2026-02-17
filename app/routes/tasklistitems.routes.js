import tasklistitems from "../controllers/tasklistitem.controller.js";
import authenticate from "../authorization/authorization.js";
import { Router } from "express";

const router = Router();

router.post("/", [authenticate], tasklistitems.create);
router.get("/", [authenticate], tasklistitems.findAll);
router.get("/:id", [authenticate], tasklistitems.findOne);
router.put("/:id", [authenticate], tasklistitems.update);
router.delete("/:id", [authenticate], tasklistitems.delete);

export default router;