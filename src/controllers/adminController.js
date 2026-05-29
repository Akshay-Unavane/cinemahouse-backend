import User from "../models/User.js";
import Movie from "../models/Movie.js";
import Review from "../models/Review.js";
import bcrypt from "bcryptjs";
import { syncMoviesFromWatchlists } from "../utils/syncMovies.js";
import {
  formatUserForAdmin,
  getOnlineSinceDate,
} from "../utils/onlineStatus.js";

/* =========================
   VERIFY ADMIN ACCESS (password)
========================= */
export const verifyAdminAccess = async (req, res) => {
  try {
    const role = (req.user.role || "").toLowerCase();
    if (role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    res.json({
      message: "Admin access verified",
      expiresInSeconds: 30 * 60,
    });
  } catch (error) {
    console.error("VERIFY ADMIN ACCESS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   DASHBOARD STATS
========================= */
export const getStats = async (req, res) => {
  try {
    await syncMoviesFromWatchlists();
    const onlineSince = getOnlineSinceDate();

    const [totalUsers, primeMembers, onlineUsers, totalMovies, totalReviews] =
      await Promise.all([
        User.countDocuments(),
        User.countDocuments({ role: "prime" }),
        User.countDocuments({
          isOnline: true,
          lastActiveAt: { $gte: onlineSince },
        }),
        Movie.countDocuments(),
        Review.countDocuments(),
      ]);

    res.json({
      totalUsers,
      primeMembers,
      onlineUsers,
      totalMovies,
      totalReviews,
    });
  } catch (error) {
    console.error("ADMIN STATS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   USER MANAGEMENT
========================= */
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password -watchlist")
      .sort({ createdAt: -1 });

    res.json({ users: users.map(formatUserForAdmin) });
  } catch (error) {
    console.error("ADMIN GET USERS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const toggleBlockUser = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user._id.toString();

    if (id === adminId) {
      return res.status(400).json({ message: "Cannot block your own account" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isBlocked = !user.isBlocked;
    if (user.isBlocked) {
      user.isOnline = false;
    }
    await user.save();

    res.json({
      message: user.isBlocked ? "User blocked" : "User unblocked",
      user: formatUserForAdmin(user),
    });
  } catch (error) {
    console.error("ADMIN BLOCK USER ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user._id.toString();

    if (id === adminId) {
      return res.status(400).json({ message: "Cannot delete your own account" });
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await Review.deleteMany({ user: id });

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("ADMIN DELETE USER ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   MOVIE MANAGEMENT
========================= */
export const getAllMovies = async (req, res) => {
  try {
    await syncMoviesFromWatchlists();
    const movies = await Movie.find().sort({ createdAt: -1 });
    res.json({ movies });
  } catch (error) {
    console.error("ADMIN GET MOVIES ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteMovie = async (req, res) => {
  try {
    const { id } = req.params;

    const movie = await Movie.findByIdAndDelete(id);
    if (!movie) {
      return res.status(404).json({ message: "Movie not found" });
    }

    await User.updateMany(
      {
        "watchlist.movieId": movie.tmdbId,
        "watchlist.mediaType": movie.mediaType,
      },
      {
        $pull: {
          watchlist: {
            movieId: movie.tmdbId,
            mediaType: movie.mediaType,
          },
        },
      }
    );

    await Review.deleteMany({ movie: id });

    res.json({ message: "Movie deleted successfully" });
  } catch (error) {
    console.error("ADMIN DELETE MOVIE ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   REVIEW MANAGEMENT
========================= */
export const getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate("user", "username email")
      .populate("movie", "title tmdbId mediaType")
      .sort({ createdAt: -1 });

    res.json({ reviews });
  } catch (error) {
    console.error("ADMIN GET REVIEWS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findByIdAndDelete(id);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("ADMIN DELETE REVIEW ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};
