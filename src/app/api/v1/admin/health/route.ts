import { NextRequest } from "next/server";
import { requireRole } from "@/lib/permissions";
import { success, error as apiError } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    const authError = await requireRole("admin");
    if (authError) return authError;

    // A real system health endpoint would ping Supabase, Redis, Resend, Clerk APIs
    // For this prototype, we'll return mocked data

    const services = [
      { name: "Supabase Database", status: "operational", uptime: "99.99%", latency: "24ms" },
      { name: "Supabase Storage", status: "operational", uptime: "99.99%", latency: "45ms" },
      { name: "Supabase Realtime", status: "operational", uptime: "99.95%", latency: "12ms" },
      { name: "Upstash Redis", status: "operational", uptime: "100%", latency: "8ms" },
      { name: "Clerk Auth", status: "operational", uptime: "99.99%", latency: "110ms" },
      { name: "Resend Email", status: "degraded", uptime: "98.5%", latency: "850ms" },
      { name: "Razorpay Sandbox", status: "operational", uptime: "99.9%", latency: "210ms" }
    ];

    return success({ services });

  } catch (err) {
    console.error("Error in GET /admin/health:", err);
    return apiError(500, "Internal Server Error");
  }
}
