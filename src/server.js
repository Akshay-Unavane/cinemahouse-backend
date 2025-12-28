import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes.js";

dotenv.config();

const app = express();

// CORS CONFIGURATION
app.use(cors({
  origin: ["http://localhost:5173", "https://cinemahouse-frontend.vercel.app"], // add your frontend URL
  methods: ["GET","POST","PUT","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"],
}));

// Middleware
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);

// Test endpoint
app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

// MongoDB + Server
const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URL)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
  })
  .catch((err) => console.error("❌ MongoDB error:", err));
