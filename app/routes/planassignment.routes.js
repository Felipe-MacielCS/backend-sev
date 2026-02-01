import express from "express";
import planassignment from "../controllers/planassignment.controller.js";
import authenticate from "../authorization/authorization.js";

const router = express.Router();

router.post("/", [authenticate], planassignment.create);
router.get("/", [authenticate], planassignment.findAll);
router.delete("/:planID/:athleteID", [authenticate], planassignment.delete);

export default router;
