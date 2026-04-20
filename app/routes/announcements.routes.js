import announcements from "../controllers/announcement.controller.js";
import authenticate from "../authorization/authorization.js";
import { Router } from "express";

const router = Router();

router.get("/", [authenticate], announcements.findAll);
router.post("/send", [authenticate], announcements.send);

export default router;
