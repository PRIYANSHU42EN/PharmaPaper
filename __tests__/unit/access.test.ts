// Provide env vars for module-level guard BEFORE importing the module
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";

import { getUserAccess } from "@/lib/access";

// ── Mock @supabase/supabase-js ────────────────────────────────────────────────
const mockSingle = jest.fn();
const mockMaybeSingle = jest.fn();
const mockLimit = jest.fn(() => ({ maybeSingle: mockMaybeSingle }));
const mockOrder = jest.fn(() => ({ limit: mockLimit }));
const mockEq = jest.fn(() => ({ eq: mockEq, maybeSingle: mockMaybeSingle, order: mockOrder, limit: mockLimit }));
const mockSelect = jest.fn(() => ({ eq: mockEq }));
const mockFrom = jest.fn(() => ({ select: mockSelect }));

jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => ({
    from: mockFrom,
  })),
}));

// Helper to reset mocks between tests
function resetMocks() {
  mockMaybeSingle.mockReset();
  mockLimit.mockReturnValue({ maybeSingle: mockMaybeSingle });
  mockOrder.mockReturnValue({ limit: mockLimit });
  mockEq.mockReturnValue({ eq: mockEq, maybeSingle: mockMaybeSingle, order: mockOrder, limit: mockLimit });
  mockSelect.mockReturnValue({ eq: mockEq });
  mockFrom.mockReturnValue({ select: mockSelect });
}

// ── Test Suite ────────────────────────────────────────────────────────────────

describe("getUserAccess()", () => {
  beforeEach(resetMocks);

  // ── Test 1 ─────────────────────────────────────────────────────────────────
  test("returns level:none for null userId", async () => {
    const result = await getUserAccess(null);
    expect(result.level).toBe("none");
    expect(result.canWatchVideos).toBe(false);
    expect(result.canReadPDFs).toBe(false);
    expect(result.canAccessPYQs).toBe(false);
    expect(result.canTakeExams).toBe(false);
    expect(result.canComment).toBe(false);
    expect(result.isTrial).toBe(false);
  });

  // ── Test 2 ─────────────────────────────────────────────────────────────────
  test("returns level:none for undefined userId", async () => {
    const result = await getUserAccess(undefined);
    expect(result.level).toBe("none");
  });

  // ── Test 3 ─────────────────────────────────────────────────────────────────
  test("returns level:trial for active trial with days remaining", async () => {
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    // First query (trials) returns active trial
    mockMaybeSingle
      .mockResolvedValueOnce({ data: { trial_end: futureDate, status: "active" }, error: null })
      // Second query (payments) should not be called in trial path
      .mockResolvedValueOnce({ data: null, error: null });

    const result = await getUserAccess("user_test_123");
    expect(result.level).toBe("trial");
    expect(result.isTrial).toBe(true);
    expect(result.canWatchVideos).toBe(true);
    expect(result.canReadPDFs).toBe(true);
    expect(result.canAccessPYQs).toBe(true);
    expect(result.canTakeExams).toBe(true);
    expect(result.daysLeft).toBeGreaterThan(0);
    expect(result.daysLeft).toBeLessThanOrEqual(14);
  });

  // ── Test 4 ─────────────────────────────────────────────────────────────────
  test("expired trial falls through to free level", async () => {
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    // Expired trial
    mockMaybeSingle
      .mockResolvedValueOnce({ data: { trial_end: pastDate, status: "active" }, error: null })
      // No active payment
      .mockResolvedValueOnce({ data: null, error: null });

    const result = await getUserAccess("user_expired_trial");
    expect(result.level).toBe("free");
    expect(result.isTrial).toBe(false);
    expect(result.canReadPDFs).toBe(false);
  });

  // ── Test 5 ─────────────────────────────────────────────────────────────────
  test("returns level:premium for active paid premium subscription", async () => {
    const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    // No trial
    mockMaybeSingle
      .mockResolvedValueOnce({ data: null, error: null })
      // Active premium payment
      .mockResolvedValueOnce({
        data: { access_level: "premium", plan_type: "premium_monthly", expires_at: futureDate, status: "paid" },
        error: null,
      });

    const result = await getUserAccess("user_premium_123");
    expect(result.level).toBe("premium");
    expect(result.isTrial).toBe(false);
    expect(result.canReadPDFs).toBe(true);
    expect(result.canWatchVideos).toBe(true);
    expect(result.canAccessPYQs).toBe(true);
  });

  // ── Test 6 ─────────────────────────────────────────────────────────────────
  test("returns level:video_only for video_pass plan", async () => {
    const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    mockMaybeSingle
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({
        data: { access_level: "video_only", plan_type: "video_monthly", expires_at: futureDate, status: "paid" },
        error: null,
      });

    const result = await getUserAccess("user_video_only");
    expect(result.level).toBe("video_only");
    expect(result.canWatchVideos).toBe(true);
    expect(result.canReadPDFs).toBe(false);    // video_only cannot read PDFs
    expect(result.canAccessPYQs).toBe(false);  // video_only cannot access PYQs
  });

  // ── Test 7 ─────────────────────────────────────────────────────────────────
  test("returns level:free for authenticated user with no plan", async () => {
    // No trial, no payment
    mockMaybeSingle
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: null, error: null });

    const result = await getUserAccess("user_free_123");
    expect(result.level).toBe("free");
    expect(result.canWatchVideos).toBe(false);
    expect(result.canReadPDFs).toBe(false);
  });
});
