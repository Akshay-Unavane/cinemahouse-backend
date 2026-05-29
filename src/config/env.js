const DEFAULT_CORS = [
  "http://localhost:5173",
  "https://cinemahouse-frontend.vercel.app",
];

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;

  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET is required in production");
  }

  console.warn("⚠️  JWT_SECRET not set — using development fallback");
  return "dev-only-jwt-secret-change-me";
}

export function getCorsOrigins() {
  const raw = process.env.CORS_ORIGINS || process.env.FRONTEND_URL || "";
  const extra = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return [...new Set([...DEFAULT_CORS, ...extra])];
}

export function validateEnv() {
  const missing = [];
  if (!process.env.MONGO_URL) missing.push("MONGO_URL");

  if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
    missing.push("JWT_SECRET");
  }

  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}
