import User from "../models/User.js";
import Movie from "../models/Movie.js";

/**
 * Upsert Movie documents from every user's embedded watchlist.
 */
export async function syncMoviesFromWatchlists() {
  const users = await User.find({
    "watchlist.0": { $exists: true },
  }).select("watchlist");

  let synced = 0;

  for (const user of users) {
    for (const item of user.watchlist || []) {
      if (!item?.movieId || !item?.title || !item?.mediaType) continue;

      await Movie.findOneAndUpdate(
        { tmdbId: item.movieId, mediaType: item.mediaType },
        {
          tmdbId: item.movieId,
          title: item.title,
          mediaType: item.mediaType,
          poster_path: item.poster_path ?? null,
          release_date: item.release_date ?? null,
        },
        { upsert: true, new: true }
      );
      synced += 1;
    }
  }

  return synced;
}
