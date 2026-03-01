import notifications from "../controllers/notification.controller.js";
import authenticate from "../authorization/authorization.js";
import { Router } from "express";

const router = Router();

router.post("/", [authenticate], notifications.create);
router.get("/", [authenticate], notifications.findAll);
router.get("/:id", [authenticate], notifications.findOne);
router.put("/:id", [authenticate], notifications.update);
router.delete("/:id", [authenticate], notifications.delete);

export default router;