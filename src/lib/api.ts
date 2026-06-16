import { NextResponse } from "next/server";

export const success = (data: any, status = 200) =>
  NextResponse.json({ success: true, data }, { status });

export const error = (status: number, message: string) =>
  NextResponse.json({ success: false, error: message }, { status });
