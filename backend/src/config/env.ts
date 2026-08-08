import dotenv from "dotenv";

dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 5000),

  databaseUrl: required("DATABASE_URL"),

  jwtAccessSecret: required("JWT_ACCESS_SECRET"),
  jwtRefreshSecret: required("JWT_REFRESH_SECRET"),
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "15m",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d",

  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:5173",

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? "",
    apiKey: process.env.CLOUDINARY_API_KEY ?? "",
    apiSecret: process.env.CLOUDINARY_API_SECRET ?? "",
  },

  groq: {
    apiKey: process.env.GROQ_API_KEY ?? "",
    fallbackKeys: (process.env.GROQ_FALLBACK_KEYS ?? "")
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean),
    model: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
  },

  uploadDir: process.env.UPLOAD_DIR ?? "uploads",
};

export const isCloudinaryConfigured =
  !!env.cloudinary.cloudName && !!env.cloudinary.apiKey && !!env.cloudinary.apiSecret;

export const isGroqConfigured = !!env.groq.apiKey;
