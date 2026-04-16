import { cookies } from "next/headers";
import { getUsers, getTenant } from "@/lib/api";
import UsersClient from "./users-client";
import { getT } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";

export default async function UsersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const jar = await cookies();
  const token = jar.get("token")?.value ?? "";
  const lang = (jar.get("lang")?.value ?? "tr") as Lang;
  const T = getT(lang);

  const [tenant, users] = await Promise.all([
    getTenant(token, id),
    getUsers(token, id),
  ]);

  return (
    <div className="max-w-4xl">
      <div className="mb-1 text-sm text-gray-400">{tenant.name}</div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{T.users.title}</h1>
      </div>
      <UsersClient tenantId={id} initialUsers={users} />
    </div>
  );
}
