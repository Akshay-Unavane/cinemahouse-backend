import mongoose from "mongoose";

const movieSchema = new mongoose.Schema(
  {
    tmdbId: {
      type: Number,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    mediaType: {
      type: String,
      enum: ["movie", "tv"],
      default: "movie",
    },
    poster_path: {
      type: String,
      default: null,
    },
    overview: {
      type: String,
      default: "",
    },
    release_date: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

movieSchema.index({ tmdbId: 1, mediaType: 1 }, { unique: true });

const Movie = mongoose.model("Movie", movieSchema);
export default Movie;
