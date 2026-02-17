import departments from "../controllers/department.controller.js";
import authenticate from "../authorization/authorization.js";
import { Router } from "express";

const router = Router();

router.post("/", [authenticate], departments.create);
router.get("/", [authenticate], departments.findAll);
router.get("/:id", [authenticate], departments.findOne);
router.put("/:id", [authenticate], departments.update);
router.delete("/:id", [authenticate], departments.delete);

export default router;