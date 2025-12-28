import User from "../models/User.js";

// ================= ADD TO WATCHLIST =================
export const addToWatchlist = async (req, res) => {
  try {
    const { userId } = req.user; // from JWT middleware
    const movie = req.body;

    if (!movie?.movieId) {
      return res.status(400).json({ message: "Movie data required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const alreadyExists = user.watchlist.some(
      (m) => m.movieId === movie.movieId
    );

    if (alreadyExists) {
      return res.status(400).json({ message: "Already in watchlist" });
    }

    user.watchlist.push(movie);
    await user.save();

    res.json(user.watchlist);
  } catch (err) {
    console.error("ADD WATCHLIST ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= GET WATCHLIST =================
export const getWatchlist = async (req, res) => {
  try {
    const { userId } = req.user;

    const user = await User.findById(userId).select("watchlist");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user.watchlist);
  } catch (err) {
    console.error("GET WATCHLIST ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= REMOVE FROM WATCHLIST =================
export const removeFromWatchlist = async (req, res) => {
  try {
    const { userId } = req.user;
    const { movieId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.watchlist = user.watchlist.filter(
      (movie) => movie.movieId !== movieId
    );

    await user.save();
    res.json(user.watchlist);
  } catch (err) {
    console.error("REMOVE WATCHLIST ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};
