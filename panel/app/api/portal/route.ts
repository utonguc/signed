/**
 * Proxy for the user self-service portal.
 * Forwards PUT requests to the backend without requiring a session token.
 */
import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL ?? "http://api:5000";

export async function PUT(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ detail: "Missing token" }, { status: 400 });
  }

  const body = await req.json();

  let upstream: Response;
  try {
    upstream = await fetch(`${API_URL}/v1/portal?token=${encodeURIComponent(token)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.error("[portal] upstream fetch failed:", err);
    return NextResponse.json({ detail: "Backend unreachable" }, { status: 502 });
  }

  const data = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    console.warn("[portal] upstream error %d: %o", upstream.status, data);
  }
  return NextResponse.json(data, { status: upstream.status });
}
