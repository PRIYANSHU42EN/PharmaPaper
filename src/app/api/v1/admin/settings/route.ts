import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireRole } from "@/lib/permissions";
import { success, error as apiError } from "@/lib/api";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export async function GET(req: NextRequest) {
  try {
    const authError = await requireRole("admin");
    if (authError) return authError;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: config, error: dbError } = await supabase
      .from("platform_config")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (dbError && dbError.code !== "PGRST116") {
      console.error("Error fetching config:", dbError);
      return apiError(500, "Database error");
    }

    // Default configuration if not found
    const currentConfig = config || {
      maintenance_mode: false,
      signup_enabled: true,
      global_announcement: null
    };

    return success({ config: currentConfig });

  } catch (err) {
    console.error("Error in GET /admin/settings:", err);
    return apiError(500, "Internal Server Error");
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authError = await requireRole("admin");
    if (authError) return authError;

    const body = await req.json();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Insert a new config record to maintain history
    const { data: newConfig, error } = await supabase
      .from("platform_config")
      .insert({
        maintenance_mode: body.maintenance_mode,
        signup_enabled: body.signup_enabled,
        global_announcement: body.global_announcement,
        updated_by: "admin"
      })
      .select()
      .single();

    if (error) {
      console.error("Error updating config:", error);
      return apiError(500, "Failed to update configuration");
    }

    await supabase.from("admin_activity_logs").insert({
      admin_id: "admin",
      action: "UPDATE_CONFIG",
      details: body
    });

    return success({ config: newConfig });

  } catch (err) {
    console.error("Error in PATCH /admin/settings:", err);
    return apiError(500, "Internal Server Error");
  }
}
