/**
 * Client telemetry tracking helper.
 * Fires background POST requests to the analytics API route without interrupting the user.
 */
export function trackEvent(
  event: 'page_view' | 'pdf_open' | 'search' | 'trial_start',
  payload: {
    user_id?: string | null;
    material_id?: string | null;
    metadata?: Record<string, any>;
  } = {}
): void {
  if (typeof window === "undefined") return;

  const body = {
    event,
    user_id: payload.user_id || null,
    material_id: payload.material_id || null,
    metadata: payload.metadata || {},
  };

  fetch("/api/analytics/track", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  }).catch((err) => {
    // Fail silently in production to preserve UX
    console.warn("Analytics track request failed:", err);
  });
}
