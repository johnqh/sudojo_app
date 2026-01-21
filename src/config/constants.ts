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
  API_URL: import.meta.env.VITE_SUDOJO_API_URL || "https://api.sudojo.com",
  DEV_MODE: import.meta.env.VITE_DEV_MODE === "true",

  // RevenueCat API keys
  REVENUECAT_API_KEY: import.meta.env.VITE_REVENUECAT_API_KEY || "",
  REVENUECAT_API_KEY_SANDBOX:
    import.meta.env.VITE_REVENUECAT_API_KEY_SANDBOX || "",

  // Social handles
  TWITTER_HANDLE: import.meta.env.VITE_TWITTER_HANDLE || "",
  DISCORD_INVITE: import.meta.env.VITE_DISCORD_INVITE || "",

  // Meet with Founder
  MEET_FOUNDER_URL: import.meta.env.VITE_MEET_FOUNDER_URL || undefined,
} as const;
