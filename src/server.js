import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes.js";
import watchlistRoutes from "./routes/watchlist.routes.js"; // ✅ ADD THIS

dotenv.config();

const app = express();

// CORS CONFIGURATION
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://cinemahouse-frontend.vercel.app",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// MIDDLEWARE
// Allow larger JSON payloads for avatar data URLs (but keep reasonable limit)
app.use(express.json({ limit: "5mb" }));

// ROUTES (AUTH — UNCHANGED)
app.use("/api/auth", authRoutes);

// ROUTES (WATCHLIST — ✅ NEW)
app.use("/api/watchlist", watchlistRoutes);

// TEST ENDPOINT
app.get("/", (req, res) => {
  res.send("Backend running Successfully 🚀");
});

// SERVER + MONGO
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () =>
      console.log(`✅ Server running on port ${PORT}`)
    );
  })
  .catch((err) =>
    console.error("❌ MongoDB connection error:", err)
  );
