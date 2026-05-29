import express from "express";
import {
   register,
   login,
   logout,
   resetPassword,
   changePassword,
   deleteAccount,
   updateUsername,
   updateAvatar,
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
router.post("/logout", authMiddleware, logout);
router.put("/change-password", authMiddleware, changePassword);
router.put("/update-username", authMiddleware, updateUsername);
router.put("/update-avatar", authMiddleware, updateAvatar);
router.delete("/delete-account", authMiddleware, deleteAccount);

router.get("/me", authMiddleware, (req, res) => {
   res.json({
      user: {
         _id: req.user._id,
         username: req.user.username,
         email: req.user.email,
         role: req.user.role || "user",
         avatar: req.user.avatar,
         isBlocked: req.user.isBlocked,
         isOnline: req.user.isOnline,
      },
   });
});

export default router;
