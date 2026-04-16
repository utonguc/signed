import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL ?? "http://api:5000";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ detail: "Missing token" }, { status: 400 });
  }

  try {
    const upstream = await fetch(
      `${API_URL}/v1/portal/preview?token=${encodeURIComponent(token)}`,
      { cache: "no-store" },
    );
    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch (err) {
    console.error("[portal/preview] upstream fetch failed:", err);
    return NextResponse.json({ detail: "Backend unreachable" }, { status: 502 });
  }
}
