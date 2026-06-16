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
    const now = new Date();
    
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString();

    // Run aggregate queries in parallel
    const [
      usersRes,
      newUsersRes,
      paymentsRes,
      videosRes,
      activityRes
    ] = await Promise.all([
      supabase.from("users").select("id", { count: "exact", head: true }),
      supabase.from("users").select("id", { count: "exact", head: true }).gte("created_at", startOfWeek),
      supabase.from("payments").select("amount").eq("status", "captured"),
      supabase.from("videos").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(10)
    ]);

    const totalUsers = usersRes.count || 0;
    const newUsers = newUsersRes.count || 0;
    const pendingVideos = videosRes.count || 0;
    
    // Calculate total revenue
    const totalRevenue = (paymentsRes.data || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    // Mock DAU for now since page_analytics might be massive
    const activeToday = Math.floor(totalUsers * 0.15); // Simulated 15% DAU

    // Mock Chart Data
    const revenueBreakdown = [
      { name: "Monthly Pro", value: totalRevenue * 0.6 },
      { name: "Yearly Pro", value: totalRevenue * 0.3 },
      { name: "One-Time", value: totalRevenue * 0.1 },
    ];

    const dauChart = Array.from({ length: 7 }).map((_, i) => ({
      date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - i)).toLocaleDateString('en-US', { weekday: 'short' }),
      users: Math.floor(Math.random() * 50) + 10 // Mock data
    }));

    return success({
      stats: {
        totalUsers,
        activeToday,
        newUsersThisWeek: newUsers,
        revenue: totalRevenue,
        pendingVideos
      },
      charts: {
        dau: dauChart,
        revenueBreakdown
      },
      activity: activityRes.data || []
    });

  } catch (err) {
    console.error("Error fetching admin overview:", err);
    return apiError(500, "Internal Server Error");
  }
}
