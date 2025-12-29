import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

/* ===========================
   AUTH MIDDLEWARE
=========================== */
const auth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

/* ===========================
   GET WATCHLIST
=========================== */
router.get("/", auth, (req, res) => {
  res.json(req.user.watchlist || []);
});

/* ===========================
   ADD TO WATCHLIST
=========================== */
router.post("/", auth, async (req, res) => {
  const { movieId, mediaType } = req.body;

  if (!movieId || !mediaType) {
    return res
      .status(400)
      .json({ message: "movieId and mediaType are required" });
  }

  const exists = req.user.watchlist.some(
    (m) => m.movieId === movieId && m.mediaType === mediaType
  );

  if (exists) {
    return res.status(400).json({ message: "Already in watchlist" });
  }

  req.user.watchlist.push(req.body);
  await req.user.save();

  res.status(201).json(req.user.watchlist);
});

/* ===========================
   REMOVE FROM WATCHLIST
=========================== */
router.delete("/:movieId", auth, async (req, res) => {
  const movieId = Number(req.params.movieId);
  const { mediaType } = req.body;

  if (!mediaType) {
    return res
      .status(400)
      .json({ message: "mediaType is required" });
  }

  const initialLength = req.user.watchlist.length;

  req.user.watchlist = req.user.watchlist.filter(
    (m) => !(m.movieId === movieId && m.mediaType === mediaType)
  );

  if (req.user.watchlist.length === initialLength) {
    return res.status(400).json({ message: "Item not found" });
  }

  await req.user.save();
  res.json({ message: "Removed from watchlist" });
});

export default router;
