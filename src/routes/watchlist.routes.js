import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

/* ===========================
   GET WATCHLIST
=========================== */
router.get("/", authMiddleware, (req, res) => {
  res.json(req.user.watchlist || []);
});

/* ===========================
   ADD TO WATCHLIST
=========================== */
router.post("/", authMiddleware, async (req, res) => {
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
router.delete("/:movieId", authMiddleware, async (req, res) => {
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
