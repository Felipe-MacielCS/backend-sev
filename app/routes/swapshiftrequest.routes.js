import swapShiftRequests from "../controllers/swapshiftrequest.controller.js";
import authenticate from "../authorization/authorization.js";
import { Router } from "express";

const router = Router();

router.post("/", [authenticate], swapShiftRequests.create);
router.get("/", [authenticate], swapShiftRequests.findAll);
router.get("/:id", [authenticate], swapShiftRequests.findOne);
router.put("/:id", [authenticate], swapShiftRequests.update);
router.delete("/:id", [authenticate], swapShiftRequests.delete);

export default router;