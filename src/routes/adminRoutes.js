import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { adminMiddleware } from "../middleware/adminMiddleware.js";
import {
  verifyAdminAccess,
  getStats,
  getAllUsers,
  toggleBlockUser,
  deleteUser,
  getAllMovies,
  deleteMovie,
  getAllReviews,
  deleteReview,
} from "../controllers/adminController.js";
import {
  getHeroSlides,
  addHeroSlide,
  removeHeroSlide,
  reorderHeroSlides,
} from "../controllers/heroController.js";

const router = express.Router();

router.post("/verify-access", authMiddleware, verifyAdminAccess);

router.use(authMiddleware, adminMiddleware);

router.get("/stats", getStats);
router.get("/users", getAllUsers);
router.patch("/users/:id/block", toggleBlockUser);
router.delete("/users/:id", deleteUser);
router.get("/movies", getAllMovies);
router.delete("/movies/:id", deleteMovie);
router.get("/reviews", getAllReviews);
router.delete("/reviews/:id", deleteReview);

router.get("/hero", getHeroSlides);
router.post("/hero", addHeroSlide);
router.delete("/hero/:id", removeHeroSlide);
router.patch("/hero/reorder", reorderHeroSlides);

export default router;
