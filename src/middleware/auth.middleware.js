import jwt from "jsonwebtoken";
import User from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

// ENHANCED AUTH MIDDLEWARE
export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    console.debug("AUTH HEADER:", authHeader || null);
    const token = authHeader?.split(" ")[1];

    if (!token) {
      console.warn("Auth middleware: no token provided");
      return res.status(401).json({ message: "No token provided" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
      console.debug("AUTH DECODED:", decoded);
    } catch (verifyErr) {
      console.error("JWT VERIFY ERROR:", verifyErr.name, verifyErr.message);
      return res.status(401).json({ message: "Invalid or expired token", error: verifyErr.message });
    }

    const userId = decoded?.userId || decoded?.id || decoded?._id;
    if (!userId) {
      console.warn("Auth middleware: token decoded but no user id in payload", decoded);
      return res.status(401).json({ message: "Invalid token payload" });
    }

    const user = await User.findById(userId).select("-password"); // Include watchlist

    if (!user) {
      console.warn("Auth middleware: user not found for id", userId);
      return res.status(404).json({ message: "User not found" });
    }

    // Attach full user object
    req.user = user;
    console.debug("Auth middleware: attached user id", user._id?.toString());
    next();
  } catch (err) {
    console.error("AUTH MIDDLEWARE ERROR (unexpected):", err);
    res.status(500).json({ message: "Auth middleware error" });
  }
};
