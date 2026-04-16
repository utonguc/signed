import { cookies } from "next/headers";
import { getDisclaimers, getTenant } from "@/lib/api";
import DisclaimersClient from "./disclaimers-client";
import { getT } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";

export default async function DisclaimersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const jar = await cookies();
  const token = jar.get("token")?.value ?? "";
  const lang = (jar.get("lang")?.value ?? "tr") as Lang;
  const T = getT(lang);

  const [tenant, disclaimers] = await Promise.all([
    getTenant(token, id),
    getDisclaimers(token, id),
  ]);

  return (
    <div className="max-w-3xl">
      <div className="mb-1 text-sm text-gray-400">{tenant.name}</div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold">{T.disclaimers.title}</h1>
      </div>
      <p className="text-sm text-gray-500 mb-6">{T.disclaimers.description}</p>
      <DisclaimersClient tenantId={id} initialDisclaimers={disclaimers} />
    </div>
  );
}
