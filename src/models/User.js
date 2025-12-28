import mongoose from "mongoose";

const watchlistSchema = new mongoose.Schema({
  movieId: {
    type: Number,
    required: true,
  },

  title: {
    type: String,
    required: true,
  },

  mediaType: {
    type: String,
    enum: ["movie", "tv"],
    required: true,
  },

  poster_path: {
    type: String,
    default: null,
  },

  release_date: {
    type: String,
    default: null,
  },
});

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      unique: true,
      required: true,
    },

    password: {
      type: String,
      required: true,
    },

    avatar: {
      type: String,
      default: "",
    },

    watchlist: [watchlistSchema],
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
