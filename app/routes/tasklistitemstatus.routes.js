import tasklistitemstatus from "../controllers/tasklistitemstatus.controller.js";
import authenticate from "../authorization/authorization.js";
import { Router } from "express";

const router = Router();

router.post("/", [authenticate], tasklistitemstatus.create);
router.get("/", [authenticate], tasklistitemstatus.findAll);
router.get("/:id", [authenticate], tasklistitemstatus.findOne);
router.put("/:id", [authenticate], tasklistitemstatus.update);
router.delete("/:id", [authenticate], tasklistitemstatus.delete);

export default router;