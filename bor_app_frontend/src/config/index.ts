// Read from Vite environment variables (prefixed with VITE_)
// Create .env.development and/or .env.production in the bor_app_frontend root.
// Example .env.development:
// VITE_API_BASE_URL=/api/v1
// VITE_APP_NAME="BoR Application"

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/v1"; // Default to /api/v1 for app
export const APP_NAME = import.meta.env.VITE_APP_NAME || "BoR App";

if (!import.meta.env.VITE_API_BASE_URL) {
  console.warn(
    `VITE_API_BASE_URL is not set in .env file for the application frontend. Defaulting to ${API_BASE_URL}. ` +
    "Create .env.development or .env.production in the bor_app_frontend project root."
  );
}
