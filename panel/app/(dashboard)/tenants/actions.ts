"use server";

import { cookies } from "next/headers";
import { createTenant } from "@/lib/api";

export async function createTenantAction(name: string, slug: string) {
  const token = (await cookies()).get("token")?.value ?? "";
  await createTenant(token, { name, slug });
}
