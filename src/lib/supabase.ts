import { createClient } from "@supabase/supabase-js";
import { cache } from "react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const supabaseClient = supabase;

// ── Types ─────────────────────────────────────────────────────────────

export interface Semester {
  id: string;
  number: number;
  course_id?: string;
  course?: string;
  title?: string;
  name?: string;
  slug: string;
  cover_image_url?: string;
  content_html?: string;
  created_at?: string;
}

export interface Subject {
  id: string;
  semester_id: string;
  course_id?: string;
  semester_number?: number;
  name: string;
  slug: string;
  description?: string;
  content_html?: string;
  order_index: number;
  created_at?: string;
}

export interface Unit {
  id: string;
  subject_id: string;
  unit_number: number;
  title: string;
  slug: string;
  content_html?: string;
  order_index: number;
}

export interface Download {
  id: string;
  unit_id: string;
  file_name: string;
  file_url: string;
  file_size_kb?: number;
  uploaded_at?: string;
}

export interface Comment {
  id: string;
  parent_type: "semester" | "subject" | "unit";
  parent_id: string;
  name: string;
  email: string;
  website?: string;
  comment_text: string;
  approved: boolean;
  created_at: string;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  category?: string;
  excerpt?: string;
  content_html?: string;
  published_at: string;
}

// ── Optimized & Memoized Queries ──────────────────────────────────────────

/**
 * Fetch all semesters for a given course ('bpharm' or 'dpharm') or all semesters.
 * Wrapped in React cache() to deduplicate within request life-cycle.
 */
export const getSemesters = cache(async (courseCode?: string): Promise<Semester[]> => {
  try {
    const { data, error } = await supabase
      .from("semesters")
      .select("id, number, name, slug, content_html, course_id, courses(code, name)")
      .order("number", { ascending: true });

    if (error) {
      console.error("Error fetching semesters:", error.message);
      return [];
    }

    const items = (data || []).map((s: any) => ({
      id: s.id,
      number: s.number,
      title: s.name || `Semester ${s.number}`,
      name: s.name || `Semester ${s.number}`,
      slug: s.slug || `semester-${s.number}`,
      course: s.courses?.code || "bpharm",
      content_html: s.content_html,
    }));

    if (courseCode) {
      return items.filter((i) => i.course.toLowerCase() === courseCode.toLowerCase());
    }

    return items;
  } catch (err) {
    console.error("Failed to fetch semesters:", err);
    return [];
  }
});

/**
 * Fetch a semester by course code and semester slug directly with WHERE slug = ...
 * Wrapped in React cache() to deduplicate metadata + page generation.
 */
export const getSemesterBySlug = cache(async (courseCode: string, semesterSlug: string): Promise<Semester | null> => {
  try {
    const { data, error } = await supabase
      .from("semesters")
      .select("id, number, name, slug, content_html, course_id, courses(code, name)")
      .eq("slug", semesterSlug);

    if (error || !data || data.length === 0) return null;

    const matched = data.find(
      (s: any) => (s.courses?.code || "bpharm").toLowerCase() === courseCode.toLowerCase()
    ) || data[0];

    return {
      id: matched.id,
      number: matched.number,
      title: matched.name || `Semester ${matched.number}`,
      name: matched.name || `Semester ${matched.number}`,
      slug: matched.slug,
      course: (matched.courses as any)?.code || courseCode,
      content_html: matched.content_html,
    };
  } catch (err) {
    console.error("Failed to fetch semester by slug:", err);
    return null;
  }
});

/**
 * Fetch subjects for a semester, selecting only necessary columns and ordered by order_index.
 */
export const getSubjects = cache(async (semesterId: string): Promise<Subject[]> => {
  try {
    const { data, error } = await supabase
      .from("subjects")
      .select("id, semester_id, name, slug, description, content_html, order_index")
      .eq("semester_id", semesterId)
      .order("order_index", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching subjects:", error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error("Failed to fetch subjects:", err);
    return [];
  }
});

/**
 * Fetch a subject by its semester ID and subject slug directly with indexed WHERE clause.
 */
export const getSubjectBySlug = cache(async (semesterId: string, subjectSlug: string): Promise<Subject | null> => {
  try {
    const { data, error } = await supabase
      .from("subjects")
      .select("id, semester_id, name, slug, description, content_html, order_index")
      .eq("semester_id", semesterId)
      .eq("slug", subjectSlug)
      .maybeSingle();

    if (error || !data) return null;
    return data;
  } catch (err) {
    console.error("Failed to fetch subject by slug:", err);
    return null;
  }
});

/**
 * Fetch units for a subject, selecting only needed columns ordered by order_index.
 */
export const getUnits = cache(async (subjectId: string): Promise<Unit[]> => {
  try {
    const { data, error } = await supabase
      .from("units")
      .select("id, subject_id, unit_number, title, slug, content_html, order_index")
      .eq("subject_id", subjectId)
      .order("order_index", { ascending: true });

    if (error) {
      console.error("Error fetching units:", error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error("Failed to fetch units:", err);
    return [];
  }
});

/**
 * Fetch a unit by subject ID and unit slug directly with indexed WHERE clause.
 */
export const getUnitBySlug = cache(async (subjectId: string, unitSlug: string): Promise<Unit | null> => {
  try {
    const { data, error } = await supabase
      .from("units")
      .select("id, subject_id, unit_number, title, slug, content_html, order_index")
      .eq("subject_id", subjectId)
      .eq("slug", unitSlug)
      .maybeSingle();

    if (error || !data) return null;
    return data;
  } catch (err) {
    console.error("Failed to fetch unit by slug:", err);
    return null;
  }
});

/**
 * Fetch download information for a unit.
 */
export const getDownload = cache(async (unitId: string): Promise<Download | null> => {
  try {
    const { data, error } = await supabase
      .from("downloads")
      .select("id, unit_id, file_name, file_url, file_size_kb, uploaded_at")
      .eq("unit_id", unitId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching download:", error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.error("Failed to fetch download:", err);
    return null;
  }
});

/**
 * Log a download event (public insert allowed by RLS).
 */
export async function logDownload(unitId: string, userAgent?: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("download_logs")
      .insert({
        unit_id: unitId,
        user_agent: userAgent || (typeof navigator !== "undefined" ? navigator.userAgent : "unknown"),
      });

    // Broadcast event on realtime channel for multi-tab live sync
    try {
      const channel = supabase.channel("download-analytics");
      channel.send({
        type: "broadcast",
        event: "download",
        payload: { unit_id: unitId, timestamp: new Date().toISOString() },
      });
    } catch (_) {}

    return !error;
  } catch (err) {
    console.error("Failed to log download:", err);
    return false;
  }
}

/**
 * Fetch approved comments for a semester, subject, or unit.
 */
export const getApprovedComments = cache(async (
  parentType: "semester" | "subject" | "unit",
  parentId: string
): Promise<Comment[]> => {
  try {
    const { data, error } = await supabase
      .from("comments")
      .select("id, parent_type, parent_id, name, email, website, comment_text, approved, created_at")
      .eq("parent_type", parentType)
      .eq("parent_id", parentId)
      .eq("approved", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching comments:", error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error("Failed to fetch comments:", err);
    return [];
  }
});

/**
 * Submit a comment for moderation (public insert allowed by RLS).
 */
export async function submitComment(comment: {
  parent_type: "semester" | "subject" | "unit";
  parent_id: string;
  name: string;
  email: string;
  website?: string;
  comment_text: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    const { error } = await supabase
      .from("comments")
      .insert({
        ...comment,
        approved: false, // Must be approved by admin
      });

    if (error) {
      return { success: false, message: error.message };
    }
    return { success: true, message: "Comment submitted successfully! It will appear once approved by our team." };
  } catch (err: any) {
    return { success: false, message: err?.message || "Failed to submit comment" };
  }
}

/**
 * Fetch recent posts for the sidebar.
 */
export const getRecentPosts = cache(async (limit = 5): Promise<Post[]> => {
  try {
    const { data, error } = await supabase
      .from("posts")
      .select("id, title, slug, category, excerpt, published_at")
      .order("published_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching recent posts:", error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error("Failed to fetch recent posts:", err);
    return [];
  }
});

/**
 * Fetch a single post by slug.
 */
export const getPostBySlug = cache(async (slug: string): Promise<Post | null> => {
  try {
    const { data, error } = await supabase
      .from("posts")
      .select("id, title, slug, category, excerpt, content_html, published_at")
      .eq("slug", slug)
      .maybeSingle();

    if (error) return null;
    return data;
  } catch (err) {
    return null;
  }
});

/**
 * Fetch platform settings fallback.
 */
export async function getSettings() {
  return {
    sitename: "PharmaPaper",
    site_name: "PharmaPaper",
    email: "pharmapaperofficial@zohomail.in",
    contact_email: "pharmapaperofficial@zohomail.in",
    telegram_url: "https://t.me/pharmapaper",
    description: "Your Gateway to Excellence in Pharmacy Education",
  };
}
