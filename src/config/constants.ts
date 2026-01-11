import packageJson from "../../package.json";

// App Constants
export const CONSTANTS = {
  // Branding
  APP_NAME: import.meta.env.VITE_APP_NAME || "Sudojo",
  APP_DOMAIN: import.meta.env.VITE_APP_DOMAIN || "sudojo.com",
  COMPANY_NAME: import.meta.env.VITE_COMPANY_NAME || "Sudobility",
  APP_VERSION: packageJson.version,
  SUPPORT_EMAIL: import.meta.env.VITE_SUPPORT_EMAIL || "support@sudojo.com",

  // API
  API_URL: import.meta.env.VITE_API_BASE_URL || "https://api.sudojo.com",
  DEV_MODE: import.meta.env.VITE_DEV_MODE === "true",

  // Social handles
  TWITTER_HANDLE: import.meta.env.VITE_TWITTER_HANDLE || "",
  DISCORD_INVITE: import.meta.env.VITE_DISCORD_INVITE || "",
} as const;
