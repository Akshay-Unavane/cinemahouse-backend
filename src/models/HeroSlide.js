import mongoose from "mongoose";

const heroSlideSchema = new mongoose.Schema(
  {
    tmdbId: {
      type: Number,
      required: true,
    },
    mediaType: {
      type: String,
      enum: ["movie", "tv"],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    overview: {
      type: String,
      default: "",
    },
    backdrop_path: {
      type: String,
      default: null,
    },
    poster_path: {
      type: String,
      default: null,
    },
    vote_average: {
      type: Number,
      default: 0,
    },
    release_date: {
      type: String,
      default: null,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

heroSlideSchema.index({ tmdbId: 1, mediaType: 1 }, { unique: true });

const HeroSlide = mongoose.model("HeroSlide", heroSlideSchema);
export default HeroSlide;
