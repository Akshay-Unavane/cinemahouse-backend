import jwt from "jsonwebtoken";
import User from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET || "Your_jwt_secret"

// ENHANCED AUTH MIDDLEWARE
export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    req.user = { userId: user._id, username: user.username };
    next();
  } catch (err) {
    console.error("AUTH MIDDLEWARE ERROR:", err);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};
