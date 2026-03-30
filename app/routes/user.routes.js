import users from "../controllers/user.controller.js";
import authenticate from "../authorization/authorization.js";
import { Router } from "express";

const router = Router();

const isAdmin = (req, res, next) => {
  if (req.userRole === "Admin") next();
  else res.status(403).send({ message: "Requires Admin Role" });
};

const isManagerOrAdmin = (req, res, next) => {
  if (req.userRole === "Admin" || req.userRole === "Manager") next();
  else res.status(403).send({ message: "Requires Manager or Admin Role" });
};

router.get("/", [authenticate], users.findAll);
router.get("/:id", [authenticate], users.findOne);

router.post("/", [authenticate, isAdmin], users.create);
router.put("/:id", [authenticate, isManagerOrAdmin], users.update);
router.delete("/:id", [authenticate, isAdmin], users.delete);

export default router;
