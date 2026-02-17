import departmentUsers from "../controllers/departmentUser.controller.js";
import authenticate from "../authorization/authorization.js";
import { Router } from "express";

const router = Router();

router.post("/", [authenticate], departmentUsers.create);
router.get("/", [authenticate], departmentUsers.findAll);
router.get("/:id", [authenticate], departmentUsers.findOne);
router.put("/:id", [authenticate], departmentUsers.update);
router.delete("/:id", [authenticate], departmentUsers.delete);

export default router;