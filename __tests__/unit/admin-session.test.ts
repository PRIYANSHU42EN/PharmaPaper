let mockStorage: Record<string, any> = {};

jest.mock("@supabase/supabase-js", () => {
  return {
    createClient: () => ({
      from: (table: string) => ({
        upsert: jest.fn().mockImplementation((payload: any) => {
          mockStorage[table + ":" + (payload.endpoint || payload.user_id)] = payload;
          return Promise.resolve({ data: payload, error: null });
        }),
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockImplementation((col: string, val: string) => ({
            maybeSingle: jest.fn().mockImplementation(() => {
              const item = mockStorage[table + ":" + val];
              return Promise.resolve({ data: item || null, error: null });
            }),
          })),
        }),
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockImplementation((col: string, val: string) => {
            delete mockStorage[table + ":" + val];
            return Promise.resolve({ error: null });
          }),
        }),
      }),
    }),
  };
});

import { 
  generateAdminSessionId, 
  setActiveAdminSession, 
  getActiveAdminSession, 
  clearActiveAdminSession,
  verifyMasterAdminPassword,
  updateMasterAdminPassword
} from "@/lib/admin-auth";

describe("Admin Session & Password Management", () => {
  beforeEach(() => {
    mockStorage = {};
  });

  it("generates unique random session IDs", () => {
    const id1 = generateAdminSessionId();
    const id2 = generateAdminSessionId();
    expect(id1).toBeTruthy();
    expect(id2).toBeTruthy();
    expect(id1).not.toEqual(id2);
  });

  it("enforces password length validation when updating password", async () => {
    const res = await updateMasterAdminPassword("12");
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/at least 4 characters/i);
  });

  it("handles empty or whitespace passwords gracefully", async () => {
    const res = await updateMasterAdminPassword("   ");
    expect(res.success).toBe(false);
    expect(res.error).toBeTruthy();
  });

  it("rejects verification for empty passwords", async () => {
    const isValid = await verifyMasterAdminPassword("");
    expect(isValid).toBe(false);
  });

  it("handles single active session transition correctly", async () => {
    const session1 = generateAdminSessionId();
    const session2 = generateAdminSessionId();

    await setActiveAdminSession(session1);
    let current = await getActiveAdminSession();
    expect(current).toBe(session1);

    // New login elsewhere overwrites previous session
    await setActiveAdminSession(session2);
    current = await getActiveAdminSession();
    expect(current).toBe(session2);
    expect(current).not.toBe(session1);

    // Session 1 is now invalid
    const isSession1Valid = session1 === current;
    const isSession2Valid = session2 === current;
    expect(isSession1Valid).toBe(false);
    expect(isSession2Valid).toBe(true);

    // Clear session on logout
    await clearActiveAdminSession();
    current = await getActiveAdminSession();
    expect(current).toBeNull();
  });
});
