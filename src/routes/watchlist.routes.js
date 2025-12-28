import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

// AUTH MIDDLEWARE (USER ONLY)
const auth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer "))
    return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(authHeader.split(" ")[1], JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) return res.status(401).json({ message: "User not found" });

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// GET WATCHLIST
router.get("/", auth, (req, res) => {
  res.json(req.user.watchlist);
});

// ADD TO WATCHLIST
router.post("/", auth, async (req, res) => {
  const exists = req.user.watchlist.some(
    m => m.movieId === req.body.movieId
  );

  if (exists)
    return res.status(400).json({ message: "Already in watchlist" });

  req.user.watchlist.push(req.body);
  await req.user.save();

  res.status(201).json(req.user.watchlist);
});

// REMOVE FROM WATCHLIST
router.delete("/:movieId", auth, async (req, res) => {
  const movieId = Number(req.params.movieId);

  const initialLength = req.user.watchlist.length;
  req.user.watchlist = req.user.watchlist.filter(
    m => m.movieId !== movieId
  );

  if (req.user.watchlist.length === initialLength)
    return res.status(400).json({ message: "Movie not found" });

  await req.user.save();
  res.json({ message: "Removed from watchlist" });
});

export default router;
