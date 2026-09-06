import { error } from "./api";

/**
 * Fallback role check (master admin passcode is primary authorization in admin routes).
 */
export async function requireRole(requiredRole: "admin" | "lecturer") {
  return error(401, "Unauthorized: Master passcode required");
}

