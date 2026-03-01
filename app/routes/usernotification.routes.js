import userNotifications from "../controllers/usernotification.controller.js";
import authenticate from "../authorization/authorization.js";
import { Router } from "express";

const router = Router();

router.post("/", [authenticate], userNotifications.create);
router.get("/", [authenticate], userNotifications.findAll);
router.get("/:id", [authenticate], userNotifications.findOne);
router.put("/:id", [authenticate], userNotifications.update);
router.delete("/:id", [authenticate], userNotifications.delete);

export default router;