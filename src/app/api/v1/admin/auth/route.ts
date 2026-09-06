import { NextRequest, NextResponse } from "next/server";
import { 
  isAdminPasswordConfigured, 
  setMasterAdminPassword, 
  verifyMasterAdminPassword 
} from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  try {
    const isConfigured = await isAdminPasswordConfigured();
    const passcode = req.headers.get("x-admin-passcode") || req.nextUrl.searchParams.get("passcode");
    
    let isSessionValid = false;
    if (passcode && isConfigured) {
      isSessionValid = await verifyMasterAdminPassword(passcode);
    }

    return NextResponse.json({
      isConfigured,
      isSessionValid,
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
    const { action, password } = body;

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    if (action === "setup") {
      const result = await setMasterAdminPassword(password.trim());
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        message: "Permanent admin password set successfully.",
      });
    }

    if (action === "login" || action === "verify") {
      const isValid = await verifyMasterAdminPassword(password.trim());
      if (!isValid) {
        return NextResponse.json(
          { error: "Incorrect admin password. Please try again." },
          { status: 401 }
        );
      }
      return NextResponse.json({
        success: true,
        message: "Admin authenticated successfully.",
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
