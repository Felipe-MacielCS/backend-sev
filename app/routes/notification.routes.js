import { Router } from "express";
import authenticate from "../authorization/authorization.js";
import notifications from "../controllers/notification.controller.js";
import userNotifications from "../controllers/usernotification.controller.js";

const router = Router();

router.post("/", [authenticate], notifications.create);
router.get("/", [authenticate], notifications.findAll);

// inbox before "/:id"
router.get("/users/:userID/inbox", [authenticate], userNotifications.findByUser);

router.post("/:notificationID/deliver", [authenticate], notifications.deliver);
router.get("/:id", [authenticate], notifications.findOne);

router.delete("/user-notifications/:id", [authenticate], userNotifications.delete);

export default router;
