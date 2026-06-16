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

    // Mock data for analytics dashboard for Phase 3 since we don't have all tables heavily populated
    const data = {
      traffic: {
        pageViews: 124500,
        uniqueVisitors: 45200,
        avgSessionDuration: "12m 45s",
        bounceRate: "34%",
        daily: Array.from({ length: 14 }).map((_, i) => ({
          day: new Date(Date.now() - (13 - i) * 86400000).toLocaleDateString('en-US', { weekday: 'short' }),
          views: Math.floor(Math.random() * 5000) + 5000,
          visitors: Math.floor(Math.random() * 2000) + 1000
        }))
      },
      content: {
        topVideos: [
          { title: "Pharmacology Basics", views: 4500, likes: 340 },
          { title: "Organic Chemistry 101", views: 3200, likes: 210 },
          { title: "Anatomy & Physiology", views: 2800, likes: 190 },
        ],
        topSearches: [
          { term: "biochemistry", count: 1200 },
          { term: "pathology notes", count: 850 },
          { term: "semester 3 pyq", count: 640 },
        ]
      }
    };

    return success(data);

  } catch (err) {
    console.error("Error in GET /admin/analytics:", err);
    return apiError(500, "Internal Server Error");
  }
}
