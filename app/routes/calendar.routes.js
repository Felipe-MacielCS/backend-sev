import calendar from "../controllers/calendar.controller.js";
import authenticate from "../authorization/authorization.js";
import { Router } from "express";

const router = Router();

router.get("/status", [authenticate], calendar.status);
router.post("/connect", [authenticate], calendar.connect);
router.post("/sync", [authenticate], calendar.syncCalendar);

export default router;
