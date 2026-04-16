"use server";
import { cookies } from "next/headers";
import type { Lang } from "./index";

export async function setLangAction(lang: Lang) {
  (await cookies()).set("lang", lang, {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
  });
}
