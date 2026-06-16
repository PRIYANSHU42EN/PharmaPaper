import { auth } from "@clerk/nextjs/server";
import { error } from "./api";

/**
 * Checks if the current user has the required role.
 * Returns an error response if they don't, or null if they are authorized.
 * 
 * Example usage in API route:
 * ```ts
 * const authError = requireRole("admin");
 * if (authError) return authError;
 * ```
 */
export function requireRole(requiredRole: "admin" | "lecturer") {
  const { sessionClaims, userId } = auth();
  
  if (!userId) {
    return error(401, "Unauthorized");
  }

  // Fallback to checking the DB role if Clerk claims aren't fully synced yet,
  // but preferably we use Clerk's publicMetadata for speed.
  const userRole = (sessionClaims?.metadata as any)?.role;
  
  if (userRole !== requiredRole) {
    return error(403, "Forbidden: Insufficient permissions");
  }

  return null;
}
