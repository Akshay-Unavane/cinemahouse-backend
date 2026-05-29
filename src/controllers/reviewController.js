import Review from "../models/Review.js";
import Movie from "../models/Movie.js";
import { ensureMovieFromTmdb } from "../utils/ensureMovie.js";

export const getReviewsForTitle = async (req, res) => {
  try {
    const tmdbId = Number(req.params.tmdbId);
    const { mediaType } = req.params;

    if (!tmdbId || !["movie", "tv"].includes(mediaType)) {
      return res.status(400).json({ message: "Invalid tmdbId or mediaType" });
    }

    const movie = await Movie.findOne({ tmdbId, mediaType });

    if (!movie) {
      return res.json({
        reviews: [],
        stats: { count: 0, averageRating: null },
        myReview: null,
      });
    }

    const reviews = await Review.find({ movie: movie._id })
      .populate("user", "username avatar")
      .sort({ createdAt: -1 });

    const ratings = reviews.filter((r) => r.rating != null).map((r) => r.rating);
    const averageRating =
      ratings.length > 0
        ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
        : null;

    let myReview = null;
    if (req.user) {
      myReview = reviews.find(
        (r) => r.user?._id?.toString() === req.user._id.toString()
      );
    }

    res.json({
      reviews: reviews.map((r) => ({
        _id: r._id,
        comment: r.comment,
        rating: r.rating,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        user: r.user
          ? {
              _id: r.user._id,
              username: r.user.username,
              avatar: r.user.avatar,
            }
          : null,
        isOwn: req.user
          ? r.user?._id?.toString() === req.user._id.toString()
          : false,
      })),
      stats: { count: reviews.length, averageRating },
      myReview: myReview
        ? {
            _id: myReview._id,
            comment: myReview.comment,
            rating: myReview.rating,
            createdAt: myReview.createdAt,
          }
        : null,
    });
  } catch (error) {
    console.error("GET REVIEWS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const createReview = async (req, res) => {
  try {
    const {
      tmdbId,
      mediaType,
      title,
      comment,
      rating,
      poster_path,
      overview,
      release_date,
    } = req.body;

    if (!tmdbId || !mediaType || !title || !comment?.trim()) {
      return res.status(400).json({ message: "tmdbId, mediaType, title, and comment are required" });
    }

    if (comment.trim().length < 10) {
      return res.status(400).json({ message: "Review must be at least 10 characters" });
    }

    if (comment.length > 2000) {
      return res.status(400).json({ message: "Review is too long (max 2000 characters)" });
    }

    if (rating != null && (rating < 1 || rating > 10)) {
      return res.status(400).json({ message: "Rating must be between 1 and 10" });
    }

    const movie = await ensureMovieFromTmdb({
      tmdbId,
      mediaType,
      title,
      poster_path,
      overview,
      release_date,
    });

    const existing = await Review.findOne({
      user: req.user._id,
      movie: movie._id,
    });

    if (existing) {
      return res.status(400).json({
        message: "You already reviewed this title. Edit your existing review instead.",
      });
    }

    const review = await Review.create({
      user: req.user._id,
      movie: movie._id,
      comment: comment.trim(),
      rating: rating ?? null,
    });

    const populated = await Review.findById(review._id).populate(
      "user",
      "username avatar"
    );

    res.status(201).json({
      message: "Review posted",
      review: {
        _id: populated._id,
        comment: populated.comment,
        rating: populated.rating,
        createdAt: populated.createdAt,
        user: {
          _id: populated.user._id,
          username: populated.user.username,
          avatar: populated.user.avatar,
        },
        isOwn: true,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "You already reviewed this title" });
    }
    console.error("CREATE REVIEW ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateReview = async (req, res) => {
  try {
    const { comment, rating } = req.body;
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only edit your own review" });
    }

    if (comment != null) {
      if (!comment.trim() || comment.trim().length < 10) {
        return res.status(400).json({ message: "Review must be at least 10 characters" });
      }
      review.comment = comment.trim();
    }

    if (rating !== undefined) {
      if (rating != null && (rating < 1 || rating > 10)) {
        return res.status(400).json({ message: "Rating must be between 1 and 10" });
      }
      review.rating = rating;
    }

    await review.save();

    const populated = await Review.findById(review._id).populate(
      "user",
      "username avatar"
    );

    res.json({
      message: "Review updated",
      review: {
        _id: populated._id,
        comment: populated.comment,
        rating: populated.rating,
        createdAt: populated.createdAt,
        updatedAt: populated.updatedAt,
        user: {
          _id: populated.user._id,
          username: populated.user.username,
          avatar: populated.user.avatar,
        },
        isOwn: true,
      },
    });
  } catch (error) {
    console.error("UPDATE REVIEW ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    const isOwner = review.user.toString() === req.user._id.toString();
    const isAdmin = (req.user.role || "").toLowerCase() === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Not allowed to delete this review" });
    }

    await review.deleteOne();
    res.json({ message: "Review deleted" });
  } catch (error) {
    console.error("DELETE REVIEW ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};
