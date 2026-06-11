import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  // Points to your Next.js app directory — loads next.config.js and .env.* files in test env
  dir: "./",
});

const config: Config = {
  testEnvironment: "node",

  // Module name mapper for @ path alias (next/jest wraps this but we're explicit)
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },

  // Match test files
  testMatch: [
    "**/__tests__/**/*.test.ts",
    "**/__tests__/**/*.test.tsx",
    "**/*.spec.ts",
    "**/*.spec.tsx",
  ],

  // Do not transform node_modules (next/jest handles this)
  transformIgnorePatterns: [
    "/node_modules/(?!(@clerk|@supabase|@upstash|razorpay)/)",
  ],

  // Coverage exclusions
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/app/**/layout.tsx",
    "!src/components/HeroCanvas.tsx",
  ],

  // Ignore
  testPathIgnorePatterns: ["/node_modules/", "/.next/"],
};

// createJestConfig wraps config to apply Next.js transforms (SWC, module resolution, etc.)
export default createJestConfig(config);
