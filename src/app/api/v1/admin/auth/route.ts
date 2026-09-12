import { NextRequest, NextResponse } from "next/server";
import { 
  isAdminPasswordConfigured, 
  setMasterAdminPassword, 
  verifyMasterAdminPassword,
  generateAdminSessionId,
  setActiveAdminSession,
  getActiveAdminSession,
  clearActiveAdminSession,
  updateMasterAdminPassword
} from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  try {
    const isConfigured = await isAdminPasswordConfigured();
    const passcode = req.headers.get("x-admin-passcode") || req.nextUrl.searchParams.get("passcode");
    const clientSessionId = req.headers.get("x-admin-session-id") || req.nextUrl.searchParams.get("sessionId");
    
    let isSessionValid = false;
    let isSingleSessionActive = true;
    const activeSessionId = await getActiveAdminSession();

    if (passcode && isConfigured) {
      isSessionValid = await verifyMasterAdminPassword(passcode);
    }

    if (clientSessionId && activeSessionId) {
      isSingleSessionActive = clientSessionId === activeSessionId;
    }

    return NextResponse.json({
      isConfigured,
      isSessionValid,
      isSingleSessionActive,
      activeSessionId,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, password, currentPassword, newPassword, confirmPassword, clientSessionId } = body;

    // Check single active session heartbeat / validation
    if (action === "check-session") {
      const activeSessionId = await getActiveAdminSession();
      const isValid = Boolean(
        clientSessionId && 
        activeSessionId && 
        clientSessionId === activeSessionId
      );
      return NextResponse.json({
        isValid,
        activeSessionId,
      });
    }

    // Explicit logout
    if (action === "logout") {
      await clearActiveAdminSession();
      return NextResponse.json({ success: true, message: "Logged out successfully" });
    }

    // Setup first-time master password
    if (action === "setup") {
      if (!password || typeof password !== "string") {
        return NextResponse.json({ error: "Password is required" }, { status: 400 });
      }
      const result = await setMasterAdminPassword(password.trim());
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      // Generate and register single active session
      const sessionId = generateAdminSessionId();
      await setActiveAdminSession(sessionId);

      return NextResponse.json({
        success: true,
        sessionId,
        message: "Permanent admin password set successfully.",
      });
    }

    // Login with password
    if (action === "login" || action === "verify") {
      if (!password || typeof password !== "string") {
        return NextResponse.json({ error: "Password is required" }, { status: 400 });
      }
      const isValid = await verifyMasterAdminPassword(password.trim());
      if (!isValid) {
        return NextResponse.json(
          { error: "Incorrect admin password. Please try again." },
          { status: 401 }
        );
      }

      // Generate and register single active session (invalidates any older session)
      const sessionId = generateAdminSessionId();
      await setActiveAdminSession(sessionId);

      return NextResponse.json({
        success: true,
        sessionId,
        message: "Admin authenticated successfully.",
      });
    }

    // Change Password (Part 3)
    if (action === "change-password") {
      if (!currentPassword || typeof currentPassword !== "string") {
        return NextResponse.json({ error: "Current password is required" }, { status: 400 });
      }
      if (!newPassword || typeof newPassword !== "string" || newPassword.trim().length < 4) {
        return NextResponse.json({ error: "New password must be at least 4 characters long" }, { status: 400 });
      }
      if (newPassword !== confirmPassword) {
        return NextResponse.json({ error: "New passwords do not match" }, { status: 400 });
      }

      // Step 2 from prompt: first re-verify the current password
      const isCurrentValid = await verifyMasterAdminPassword(currentPassword.trim());
      if (!isCurrentValid) {
        return NextResponse.json(
          { error: "The current password you entered is incorrect." },
          { status: 401 }
        );
      }

      // Step 3 & 5: update master password and clear active sessions
      const updateResult = await updateMasterAdminPassword(newPassword.trim());
      if (!updateResult.success) {
        return NextResponse.json({ error: updateResult.error }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: "Password changed successfully. Active sessions have been revoked. Please sign in with your new password.",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Authentication error" },
      { status: 500 }
    );
  }
}
