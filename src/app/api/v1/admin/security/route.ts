import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireRole } from "@/lib/permissions";
import { success, error as apiError } from "@/lib/api";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export async function GET(req: NextRequest) {
  try {
    const authError = requireRole("admin");
    if (authError) return authError;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const [blocklistRes, activityRes, logsRes] = await Promise.all([
      supabase.from("ip_blocklist").select("*").order("blocked_at", { ascending: false }),
      supabase.from("suspicious_activity").select("*").order("created_at", { ascending: false }).limit(20),
      supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(50)
    ]);

    return success({
      blocklist: blocklistRes.data || [],
      suspiciousActivity: activityRes.data || [],
      auditLogs: logsRes.data || []
    });

  } catch (err) {
    console.error("Error in GET /admin/security:", err);
    return apiError(500, "Internal Server Error");
  }
}

export async function POST(req: NextRequest) {
  try {
    const authError = requireRole("admin");
    if (authError) return authError;

    const body = await req.json();
    const { action, ip, reason } = body;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (action === "block_ip") {
      await supabase.from("ip_blocklist").upsert({
        ip_address: ip,
        reason: reason || "Manual block via Admin",
        blocked_by: "admin", // from auth()
        is_active: true
      });

      await supabase.from("admin_activity_logs").insert({
        admin_id: "admin",
        action: "BLOCK_IP",
        details: { ip, reason }
      });
    }

    return success({ message: "Action successful" });

  } catch (err) {
    console.error("Error in POST /admin/security:", err);
    return apiError(500, "Internal Server Error");
  }
}
