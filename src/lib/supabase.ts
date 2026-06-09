import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials are missing. Please check your .env.local file.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─── Study Materials Queries ─────────────────────────────────────────────────

export interface StudyMaterial {
  id: string;
  title: string;
  course: string;       // 'B.Pharm' or 'D.Pharm'
  semester: number;
  subject: string;
  type: string;         // 'notes', 'pyq', 'pdf', etc.
  file_url: string;
  created_at: string;
}

/**
 * Fetches study materials filtered by course and semester.
 * Uses the existing `study_materials` table with public read RLS.
 */
export async function getMaterials(
  course: string,
  semester: number
): Promise<StudyMaterial[]> {
  const { data, error } = await supabase
    .from("study_materials")
    .select("*")
    .eq("course", course)
    .eq("semester", semester)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching materials:", error.message);
    return [];
  }

  return (data as StudyMaterial[]) || [];
}

/**
 * Fetches study materials filtered by course, semester, and subject.
 */
export async function getMaterialsBySubject(
  course: string,
  semester: number,
  subject: string
): Promise<StudyMaterial[]> {
  const { data, error } = await supabase
    .from("study_materials")
    .select("*")
    .eq("course", course)
    .eq("semester", semester)
    .eq("subject", subject)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching materials by subject:", error.message);
    return [];
  }

  return (data as StudyMaterial[]) || [];
}

/**
 * Fetches all PYQ (Previous Year Question) papers for a given course and semester.
 */
export async function getPYQs(
  course: string,
  semester: number
): Promise<StudyMaterial[]> {
  const { data, error } = await supabase
    .from("study_materials")
    .select("*")
    .eq("course", course)
    .eq("semester", semester)
    .eq("type", "pyq")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching PYQs:", error.message);
    return [];
  }

  return (data as StudyMaterial[]) || [];
}

// ─── Analytics Tracking ──────────────────────────────────────────────────────
// All tracking functions are fire-and-forget — errors are silently logged.
// Events are stored in `page_analytics` with an `event_type` discriminator.

type AnalyticsEventType = "page_view" | "pdf_download" | "pdf_view" | "login" | "signup" | "search";

/**
 * Tracks any analytics event. Core function used by all specific trackers.
 */
async function trackEvent(
  eventType: AnalyticsEventType,
  page: string,
  userId?: string | null,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const { error } = await supabase.from("page_analytics").insert({
      event_type: eventType,
      page,
      user_id: userId || null,
      metadata: metadata || {},
    });

    if (error) {
      console.error(`Analytics [${eventType}] error:`, error.message);
    }
  } catch (err) {
    // Fire-and-forget — never block the user experience
    console.error(`Analytics [${eventType}] exception:`, err);
  }
}

/** Track a page view */
export function trackPageView(
  page: string,
  userId?: string | null,
  metadata?: Record<string, unknown>
): void {
  trackEvent("page_view", page, userId, metadata);
}

/** Track a PDF download event */
export function trackPdfDownload(
  pdfUrl: string,
  pdfTitle: string,
  userId?: string | null
): void {
  trackEvent("pdf_download", pdfUrl, userId, { title: pdfTitle });
}

/** Track a PDF inline view event */
export function trackPdfView(
  pdfUrl: string,
  pdfTitle: string,
  userId?: string | null
): void {
  trackEvent("pdf_view", pdfUrl, userId, { title: pdfTitle });
}

/** Track a user login event */
export function trackLogin(userId: string, email: string): void {
  trackEvent("login", "/login", userId, { email });
}

/** Track a user signup event */
export function trackSignup(userId: string, email: string): void {
  trackEvent("signup", "/signup", userId, { email });
}

/** Track a search query */
export function trackSearch(
  query: string,
  page: string,
  userId?: string | null
): void {
  trackEvent("search", page, userId, { query });
}

// ─── Platform Settings ───────────────────────────────────────────────────────

export interface PlatformSettings {
  sitename: string;
  email: string;
  description: string;
  [key: string]: string;
}

/**
 * Fetches all platform settings. Public read is enabled via RLS.
 */
export async function getSettings(): Promise<PlatformSettings> {
  const defaults: PlatformSettings = {
    sitename: "Pharma Paper",
    email: "admin@pharmapaper.com",
    description: "Your Complete Pharmacy Study Vault",
  };

  try {
    const { data, error } = await supabase
      .from("platform_settings")
      .select("key, value");

    if (error) {
      console.error("Error fetching settings:", error.message);
      return defaults;
    }

    const settings = { ...defaults };
    (data || []).forEach((row: { key: string; value: string }) => {
      settings[row.key] = row.value;
    });

    return settings;
  } catch (err) {
    console.error("Settings fetch exception:", err);
    return defaults;
  }
}
