// Read from Vite environment variables (prefixed with VITE_)
// See .env.development or .env.production files
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

// Example of other configurations you might want
// export const APP_VERSION = import.meta.env.VITE_APP_VERSION || "0.0.1";

// It's good practice to ensure critical environment variables are checked or have fallbacks.
if (!import.meta.env.VITE_API_BASE_URL) {
  console.warn(
    "VITE_API_BASE_URL is not set in .env file. Defaulting to /api. " +
    "Create .env.development or .env.production in the project root (bor_admin_frontend)."
  );
}
