import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { optionalAuth } from "../middleware/optionalAuth.js";
import {
  getReviewsForTitle,
  createReview,
  updateReview,
  deleteReview,
} from "../controllers/reviewController.js";

const router = express.Router();

router.get("/:mediaType/:tmdbId", optionalAuth, getReviewsForTitle);
router.post("/", authMiddleware, createReview);
router.put("/:id", authMiddleware, updateReview);
router.delete("/:id", authMiddleware, deleteReview);

export default router;
