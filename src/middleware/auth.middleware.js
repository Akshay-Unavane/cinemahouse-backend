import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { getJwtSecret } from "../config/env.js";
// ENHANCED AUTH MIDDLEWARE
export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, getJwtSecret());    } catch (verifyErr) {
      return res.status(401).json({ message: "Invalid or expired token", error: verifyErr.message });
    }

    const userId = decoded?.userId || decoded?.id || decoded?._id;
    if (!userId) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    const user = await User.findById(userId).select("-password"); // Include watchlist

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: "Your account has been blocked" });
    }

    user.lastActiveAt = new Date();
    if (!user.isOnline) user.isOnline = true;
    await user.save();

    req.user = user;
    next();
  } catch (err) {
    console.error("AUTH MIDDLEWARE ERROR (unexpected):", err);
    res.status(500).json({ message: "Auth middleware error" });
  }
};

