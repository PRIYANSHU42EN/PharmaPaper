import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

const AUTH_CONFIG_ENDPOINT = "__master_admin_auth__";

/**
 * Retrieve the stored salt and hash for the permanent admin password.
 */
export async function getMasterAdminPasswordRecord(): Promise<{ salt: string; hash: string } | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from("rate_limit_config")
      .select("updated_by")
      .eq("endpoint", AUTH_CONFIG_ENDPOINT)
      .maybeSingle();

    if (error || !data?.updated_by) {
      return null;
    }

    const [salt, hash] = data.updated_by.split(":");
    if (!salt || !hash) return null;
    return { salt, hash };
  } catch (err) {
    console.error("Failed to read admin auth record:", err);
    return null;
  }
}

/**
 * Check if a permanent admin password has already been configured.
 */
export async function isAdminPasswordConfigured(): Promise<boolean> {
  const record = await getMasterAdminPasswordRecord();
  return record !== null;
}

/**
 * Set the permanent admin password for the platform on initial visit.
 */
export async function setMasterAdminPassword(password: string): Promise<{ success: boolean; error?: string }> {
  if (!password || password.trim().length < 4) {
    return { success: false, error: "Password must be at least 4 characters long." };
  }

  const existing = await getMasterAdminPasswordRecord();
  if (existing) {
    return { success: false, error: "Admin password has already been configured permanently." };
  }

  try {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.createHash("sha256").update(password + salt).digest("hex");

    const { error } = await supabaseAdmin
      .from("rate_limit_config")
      .upsert({
        endpoint: AUTH_CONFIG_ENDPOINT,
        limit_count: 1,
        window_seconds: 1,
        is_active: true,
        updated_by: `${salt}:${hash}`,
      });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to set master password" };
  }
}

/**
 * Verify an input password against the permanent stored hash.
 */
export async function verifyMasterAdminPassword(password: string): Promise<boolean> {
  if (!password) return false;

  // Support environment variable override if defined
  if (process.env.ADMIN_PASSWORD && password === process.env.ADMIN_PASSWORD) {
    return true;
  }

  const record = await getMasterAdminPasswordRecord();
  if (!record) {
    // If not yet configured, reject login until setup is completed
    return false;
  }

  const testHash = crypto.createHash("sha256").update(password + record.salt).digest("hex");
  return testHash === record.hash;
}

const SESSION_CONFIG_ENDPOINT = "__admin_active_session__";

/**
 * Generate a cryptographically secure random session ID.
 */
export function generateAdminSessionId(): string {
  return crypto.randomUUID();
}

/**
 * Set the single active session ID in the database.
 * Overwrites any previous session, effectively invalidating earlier logins.
 */
export async function setActiveAdminSession(sessionId: string): Promise<boolean> {
  try {
    // 1. Try dedicated admin_active_sessions table if it exists
    await supabaseAdmin
      .from("admin_active_sessions")
      .upsert({
        user_id: "master_admin",
        session_id: sessionId,
        updated_at: new Date().toISOString(),
      })
      .maybeSingle();
  } catch (_) {}

  try {
    // 2. Persist in rate_limit_config as reliable shared storage
    const { error } = await supabaseAdmin
      .from("rate_limit_config")
      .upsert({
        endpoint: SESSION_CONFIG_ENDPOINT,
        limit_count: 1,
        window_seconds: 1,
        is_active: true,
        updated_by: sessionId,
        updated_at: new Date().toISOString(),
      });

    return !error;
  } catch (err) {
    console.error("Failed to set active admin session:", err);
    return false;
  }
}

/**
 * Retrieve the current valid active session ID from the database.
 */
export async function getActiveAdminSession(): Promise<string | null> {
  try {
    // Check admin_active_sessions table first
    const { data: directData, error: directErr } = await supabaseAdmin
      .from("admin_active_sessions")
      .select("session_id")
      .eq("user_id", "master_admin")
      .maybeSingle();

    if (!directErr && directData?.session_id) {
      return directData.session_id;
    }
  } catch (_) {}

  try {
    // Fallback to rate_limit_config
    const { data, error } = await supabaseAdmin
      .from("rate_limit_config")
      .select("updated_by")
      .eq("endpoint", SESSION_CONFIG_ENDPOINT)
      .maybeSingle();

    if (error || !data?.updated_by) {
      return null;
    }
    return data.updated_by;
  } catch (err) {
    console.error("Failed to get active admin session:", err);
    return null;
  }
}

/**
 * Clear the active admin session upon logout or password change.
 */
export async function clearActiveAdminSession(): Promise<void> {
  try {
    await supabaseAdmin
      .from("admin_active_sessions")
      .delete()
      .eq("user_id", "master_admin");
  } catch (_) {}

  try {
    await supabaseAdmin
      .from("rate_limit_config")
      .delete()
      .eq("endpoint", SESSION_CONFIG_ENDPOINT);
  } catch (_) {}
}

/**
 * Update the master admin password to a new password and clear active sessions.
 */
export async function updateMasterAdminPassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
  if (!newPassword || newPassword.trim().length < 4) {
    return { success: false, error: "New password must be at least 4 characters long." };
  }

  try {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.createHash("sha256").update(newPassword + salt).digest("hex");

    const { error } = await supabaseAdmin
      .from("rate_limit_config")
      .upsert({
        endpoint: AUTH_CONFIG_ENDPOINT,
        limit_count: 1,
        window_seconds: 1,
        is_active: true,
        updated_by: `${salt}:${hash}`,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      return { success: false, error: error.message };
    }

    // Clear active session to force fresh login with the new password
    await clearActiveAdminSession();

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to update master password" };
  }
}

