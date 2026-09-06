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
