import jwt from "jsonwebtoken";
import User from "../models/User.model.js";

export const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ LOAD FULL USER DOCUMENT
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user; // ✅ REAL MONGOOSE DOCUMENT
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
