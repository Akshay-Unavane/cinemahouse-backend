import Movie from "../models/Movie.js";

export async function ensureMovieFromTmdb(payload) {
  const { tmdbId, mediaType, title, poster_path, overview, release_date } = payload;

  if (!tmdbId || !mediaType || !title) {
    throw new Error("Missing movie metadata");
  }

  return Movie.findOneAndUpdate(
    { tmdbId, mediaType },
    {
      tmdbId,
      mediaType,
      title,
      poster_path: poster_path ?? null,
      overview: overview ?? "",
      release_date: release_date ?? null,
    },
    { upsert: true, new: true }
  );
}
