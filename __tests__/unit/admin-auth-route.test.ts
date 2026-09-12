import { NextRequest } from "next/server";

// In-memory mock storage for auth record and session
let mockConfigStorage: Record<string, any> = {};

jest.mock("@supabase/supabase-js", () => {
  return {
    createClient: () => ({
      from: (table: string) => ({
        upsert: jest.fn().mockImplementation((payload: any) => {
          mockConfigStorage[payload.endpoint || payload.user_id] = payload;
          return Promise.resolve({ data: payload, error: null });
        }),
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockImplementation((col: string, val: string) => ({
            maybeSingle: jest.fn().mockImplementation(() => {
              const item = mockConfigStorage[val];
              return Promise.resolve({ data: item || null, error: null });
            }),
          })),
        }),
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockImplementation((col: string, val: string) => {
            delete mockConfigStorage[val];
            return Promise.resolve({ error: null });
          }),
        }),
      }),
    }),
  };
});

import { POST, GET } from "@/app/api/v1/admin/auth/route";

describe("Admin Auth API Route (/api/v1/admin/auth)", () => {
  beforeEach(() => {
    mockConfigStorage = {};
  });

  it("sets up master password and returns session ID on initial visit", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/admin/auth", {
      method: "POST",
      body: JSON.stringify({ action: "setup", password: "InitialPassword123" }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.sessionId).toBeTruthy();
  });

  it("handles login, session issuance, and session conflict across two devices", async () => {
    // 1. Setup initial password
    await POST(
      new NextRequest("http://localhost:3000/api/v1/admin/auth", {
        method: "POST",
        body: JSON.stringify({ action: "setup", password: "MasterPassword456" }),
      })
    );

    // 2. Device 1 logs in
    const login1Res = await POST(
      new NextRequest("http://localhost:3000/api/v1/admin/auth", {
        method: "POST",
        body: JSON.stringify({ action: "login", password: "MasterPassword456" }),
      })
    );
    const login1Json = await login1Res.json();
    const session1 = login1Json.sessionId;
    expect(session1).toBeTruthy();

    // 3. Verify Device 1 session is valid
    const check1Res = await POST(
      new NextRequest("http://localhost:3000/api/v1/admin/auth", {
        method: "POST",
        body: JSON.stringify({ action: "check-session", clientSessionId: session1 }),
      })
    );
    const check1Json = await check1Res.json();
    expect(check1Json.isValid).toBe(true);

    // 4. Device 2 logs in with same account
    const login2Res = await POST(
      new NextRequest("http://localhost:3000/api/v1/admin/auth", {
        method: "POST",
        body: JSON.stringify({ action: "login", password: "MasterPassword456" }),
      })
    );
    const login2Json = await login2Res.json();
    const session2 = login2Json.sessionId;
    expect(session2).toBeTruthy();
    expect(session2).not.toBe(session1);

    // 5. Device 1 session check must now report INVALID!
    const checkOldRes = await POST(
      new NextRequest("http://localhost:3000/api/v1/admin/auth", {
        method: "POST",
        body: JSON.stringify({ action: "check-session", clientSessionId: session1 }),
      })
    );
    const checkOldJson = await checkOldRes.json();
    expect(checkOldJson.isValid).toBe(false);

    // 6. Device 2 session is currently the active one
    const checkNewRes = await POST(
      new NextRequest("http://localhost:3000/api/v1/admin/auth", {
        method: "POST",
        body: JSON.stringify({ action: "check-session", clientSessionId: session2 }),
      })
    );
    const checkNewJson = await checkNewRes.json();
    expect(checkNewJson.isValid).toBe(true);
  });

  it("verifies current password before allowing password change and rejects wrong password", async () => {
    // Setup password
    await POST(
      new NextRequest("http://localhost:3000/api/v1/admin/auth", {
        method: "POST",
        body: JSON.stringify({ action: "setup", password: "CorrectPassword123" }),
      })
    );

    // Attempt change with wrong current password
    const failRes = await POST(
      new NextRequest("http://localhost:3000/api/v1/admin/auth", {
        method: "POST",
        body: JSON.stringify({
          action: "change-password",
          currentPassword: "WrongPassword999",
          newPassword: "BrandNewPassword789",
          confirmPassword: "BrandNewPassword789",
        }),
      })
    );
    expect(failRes.status).toBe(401);
    const failJson = await failRes.json();
    expect(failJson.error).toMatch(/incorrect/i);

    // Change with correct current password
    const successRes = await POST(
      new NextRequest("http://localhost:3000/api/v1/admin/auth", {
        method: "POST",
        body: JSON.stringify({
          action: "change-password",
          currentPassword: "CorrectPassword123",
          newPassword: "BrandNewPassword789",
          confirmPassword: "BrandNewPassword789",
        }),
      })
    );
    expect(successRes.status).toBe(200);
    const successJson = await successRes.json();
    expect(successJson.success).toBe(true);

    // Old password should now fail login
    const oldLogin = await POST(
      new NextRequest("http://localhost:3000/api/v1/admin/auth", {
        method: "POST",
        body: JSON.stringify({ action: "login", password: "CorrectPassword123" }),
      })
    );
    expect(oldLogin.status).toBe(401);

    // New password succeeds login
    const newLogin = await POST(
      new NextRequest("http://localhost:3000/api/v1/admin/auth", {
        method: "POST",
        body: JSON.stringify({ action: "login", password: "BrandNewPassword789" }),
      })
    );
    expect(newLogin.status).toBe(200);
  });
});
