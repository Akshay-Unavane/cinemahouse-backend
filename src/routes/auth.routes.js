import express from "express";
import {
  register,
  login,
  resetPassword,
  deleteAccount,
} from "../controllers/auth.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

/* =======================
   PREFLIGHT (IMPORTANT)
======================= */
router.options("*", (req, res) => {
  res.sendStatus(200);
});

/* =======================
   AUTH ROUTES
======================= */
router.post("/register", register);
router.post("/login", login);
router.post("/reset-password", resetPassword);

/* =======================
   PROTECTED ROUTES
======================= */
router.delete("/delete-account", authMiddleware, deleteAccount);

export default router;
