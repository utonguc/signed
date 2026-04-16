import { cookies } from "next/headers";
import { getDomains, getTenant } from "@/lib/api";
import DomainsClient from "./domains-client";
import { getT } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";

export default async function DomainsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const jar = await cookies();
  const token = jar.get("token")?.value ?? "";
  const lang = (jar.get("lang")?.value ?? "tr") as Lang;
  const T = getT(lang);

  const [tenant, domains] = await Promise.all([
    getTenant(token, id),
    getDomains(token, id),
  ]);

  return (
    <div className="max-w-2xl">
      <div className="mb-1 text-sm text-gray-400">{tenant.name}</div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{T.domains.title}</h1>
      </div>
      <p className="text-sm text-gray-500 mb-4">{T.domains.description}</p>
      <DomainsClient tenantId={id} initialDomains={domains} />
    </div>
  );
}
