import { NextRequest, NextResponse } from "next/server";
import { loginApi } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    const data = await loginApi(email, password);

    const res = NextResponse.json({ ok: true, email: data.email, role: data.role });
    res.cookies.set("token", data.token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24h
      path: "/",
    });
    return res;
  } catch {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
}
