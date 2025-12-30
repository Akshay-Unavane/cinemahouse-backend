import express from "express";
import {
  register,
  login,
  resetPassword,
  deleteAccount,
  updateUsername,
} from "../controllers/auth.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

/* =======================
   AUTH ROUTES
======================= */
router.post("/register", register);
router.post("/login", login);
router.post("/reset-password", resetPassword);

/* =======================
   PROTECTED ROUTES
======================= */
router.put("/update-username", authMiddleware, updateUsername);
router.delete("/delete-account", authMiddleware, deleteAccount);

export default router;
