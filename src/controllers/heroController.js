import HeroSlide from "../models/HeroSlide.js";

const MAX_HERO_SLIDES = 12;

export const getHeroSlides = async (req, res) => {
  try {
    const slides = await HeroSlide.find().sort({ sortOrder: 1, createdAt: 1 });
    res.json({ slides });
  } catch (error) {
    console.error("GET HERO SLIDES ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const addHeroSlide = async (req, res) => {
  try {
    const {
      tmdbId,
      mediaType,
      title,
      overview,
      backdrop_path,
      poster_path,
      vote_average,
      release_date,
    } = req.body;

    if (!tmdbId || !mediaType || !title) {
      return res.status(400).json({ message: "tmdbId, mediaType, and title are required" });
    }

    if (!["movie", "tv"].includes(mediaType)) {
      return res.status(400).json({ message: "mediaType must be movie or tv" });
    }

    if (!backdrop_path) {
      return res
        .status(400)
        .json({ message: "This title has no backdrop image and cannot be added to hero" });
    }

    const count = await HeroSlide.countDocuments();
    if (count >= MAX_HERO_SLIDES) {
      return res.status(400).json({ message: `Hero section allows up to ${MAX_HERO_SLIDES} slides` });
    }

    const exists = await HeroSlide.findOne({ tmdbId, mediaType });
    if (exists) {
      return res.status(400).json({ message: "Already in hero section" });
    }

    const maxOrder = await HeroSlide.findOne().sort({ sortOrder: -1 }).select("sortOrder");
    const sortOrder = (maxOrder?.sortOrder ?? -1) + 1;

    const slide = await HeroSlide.create({
      tmdbId,
      mediaType,
      title,
      overview: overview || "",
      backdrop_path,
      poster_path: poster_path || null,
      vote_average: vote_average ?? 0,
      release_date: release_date || null,
      sortOrder,
    });

    res.status(201).json({ message: "Added to hero section", slide });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Already in hero section" });
    }
    console.error("ADD HERO SLIDE ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const removeHeroSlide = async (req, res) => {
  try {
    const slide = await HeroSlide.findByIdAndDelete(req.params.id);
    if (!slide) {
      return res.status(404).json({ message: "Hero slide not found" });
    }
    res.json({ message: "Removed from hero section" });
  } catch (error) {
    console.error("REMOVE HERO SLIDE ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const reorderHeroSlides = async (req, res) => {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return res.status(400).json({ message: "orderedIds array is required" });
    }

    await Promise.all(
      orderedIds.map((id, index) =>
        HeroSlide.findByIdAndUpdate(id, { sortOrder: index })
      )
    );

    const slides = await HeroSlide.find().sort({ sortOrder: 1 });
    res.json({ message: "Hero order updated", slides });
  } catch (error) {
    console.error("REORDER HERO SLIDES ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};
