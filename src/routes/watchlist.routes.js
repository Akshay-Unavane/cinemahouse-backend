import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import User from "../models/User.js";

const router = express.Router();

/* ===========================
   GET WATCHLIST
=========================== */
router.get("/", authMiddleware, async (req, res) => {
  try {
    // Fetch fresh watchlist from DB to avoid stale/marshaled data
    const user = await User.findById(req.user._id).select("watchlist");
    return res.json(Array.isArray(user?.watchlist) ? user.watchlist : []);
  } catch (err) {
    console.error("GET WATCHLIST ROUTE ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/* ===========================
   ADD TO WATCHLIST
=========================== */
router.post("/", authMiddleware, async (req, res) => {
  try {
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

    // Return fresh watchlist
    const user = await User.findById(req.user._id).select("watchlist");
    return res.status(201).json(Array.isArray(user?.watchlist) ? user.watchlist : []);
  } catch (err) {
    console.error("POST WATCHLIST ROUTE ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/* ===========================
   REMOVE FROM WATCHLIST
=========================== */
router.delete("/:movieId", authMiddleware, async (req, res) => {
  try {
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

    // Return fresh watchlist
    const user = await User.findById(req.user._id).select("watchlist");
    return res.json(Array.isArray(user?.watchlist) ? user.watchlist : []);
  } catch (err) {
    console.error("DELETE WATCHLIST ROUTE ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
