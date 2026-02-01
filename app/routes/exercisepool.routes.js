import exercisepools from "../controllers/exercisepool.controller.js";
import authenticate from "../authorization/authorization.js";
import { Router } from "express";

const router = Router();

router.post("/", [authenticate], exercisepools.create);
router.get("/", [authenticate], exercisepools.findAll);
router.get("/:exerciseID/:planID", [authenticate], exercisepools.findOne);
router.put("/:exerciseID/:planID", [authenticate], exercisepools.update);
router.delete("/:exerciseID/:planID", [authenticate], exercisepools.delete);

export default router;