import calendar from "../controllers/calendar.controller.js";
import { Router } from "express";

const router = Router();

router.post("/sync", calendar.syncCalendar);

export default router;