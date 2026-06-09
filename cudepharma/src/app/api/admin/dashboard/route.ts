import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { checkRateLimit } from "@/lib/ratelimit";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const internalSecret = process.env.INTERNAL_DB_SECRET || "";

export async function GET(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "anonymous";
    const { blocked, headers } = await checkRateLimit("admin", ip);
    if (blocked) {
      return NextResponse.json(
        { error: "Too many requests. Try again in 1 minute." },
        { status: 429, headers }
      );
    }

    const { userId, sessionClaims } = await auth();

    if (!userId || (sessionClaims as any)?.metadata?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // 1. Verify User Role is Admin or Super-Admin using RPC with internal secret
    const { data: isAdmin, error: roleError } = await supabase.rpc(
      "check_user_admin_by_id",
      {
        p_secret: internalSecret,
        p_user_id: userId,
      }
    );

    if (roleError) {
      console.error("Role check database error:", roleError);
      return NextResponse.json({ error: "Internal Database Error" }, { status: 500 });
    }

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    // 2. Fetch Aggregated Dashboard Data
    const { data: adminData, error: dataError } = await supabase.rpc(
      "secure_get_admin_data",
      {
        p_secret: internalSecret,
      }
    );

    if (dataError) {
      console.error("Dashboard data retrieve error:", dataError);
      return NextResponse.json({ error: "Failed to load dashboard data" }, { status: 500 });
    }

    // 3. Fetch Platform Settings
    const { data: settingsData } = await supabase.rpc(
      "secure_get_settings",
      { p_secret: internalSecret }
    );

    // 4. Fetch Analytics Summary
    const { data: analyticsData } = await supabase.rpc(
      "secure_get_analytics_summary",
      { p_secret: internalSecret }
    );

    // 5. Use Service Role client to bypass RLS for administrative payments and trials logs
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const activeServiceKey = (!serviceRoleKey || serviceRoleKey.includes("your_service_role_key"))
      ? supabaseAnonKey
      : serviceRoleKey;

    const supabaseService = createClient(
      supabaseUrl,
      activeServiceKey
    );

    const { data: paymentsData } = await supabaseService
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: trialsData } = await supabaseService
      .from("trials")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: popularData } = await supabaseService
      .from("popular_materials")
      .select("*, study_materials(*)")
      .limit(10);

    return NextResponse.json({
      ...adminData,
      platform_settings: settingsData || {},
      analytics_summary: analyticsData || {},
      payments: paymentsData || [],
      trials: trialsData || [],
      popular_materials: popularData || [],
    });
  } catch (err: any) {
    console.error("Admin dashboard route exception:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
