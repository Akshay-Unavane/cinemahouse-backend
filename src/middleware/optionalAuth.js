import jwt from "jsonwebtoken";
import User from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

/** Attaches req.user when token is valid; continues without user if missing/invalid */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded?.userId || decoded?.id || decoded?._id;
    if (!userId) return next();

    const user = await User.findById(userId).select("-password");
    if (user && !user.isBlocked) {
      req.user = user;
    }
    next();
  } catch {
    next();
  }
};
