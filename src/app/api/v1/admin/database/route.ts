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

    // Call Supabase RPC or use system stats if available
    // Since we don't have direct access to postgres stats easily through PostgREST without an RPC,
    // we'll mock some high-level DB metrics for the dashboard prototype
    const dbMetrics = {
      activeConnections: Math.floor(Math.random() * 20) + 5,
      maxConnections: 100,
      cpuUsage: `${Math.floor(Math.random() * 40) + 10}%`,
      memoryUsage: `${Math.floor(Math.random() * 30) + 40}%`,
      diskIO: `${Math.floor(Math.random() * 10) + 1} MB/s`,
      cacheHitRate: "98.5%",
      tablesSize: [
        { name: "users", size: "12 MB", rows: 1245 },
        { name: "videos", size: "45 MB", rows: 340 },
        { name: "video_comments", size: "8 MB", rows: 8900 },
        { name: "audit_logs", size: "22 MB", rows: 15400 }
      ]
    };

    return success(dbMetrics);

  } catch (err) {
    console.error("Error in GET /admin/database:", err);
    return apiError(500, "Internal Server Error");
  }
}
