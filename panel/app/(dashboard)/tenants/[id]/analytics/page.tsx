import { cookies } from "next/headers";
import { getAnalytics, getTenant } from "@/lib/api";
import AnalyticsClient from "./analytics-client";
import { getT } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";

export default async function AnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const jar = await cookies();
  const token = jar.get("token")?.value ?? "";
  const lang = (jar.get("lang")?.value ?? "tr") as Lang;
  const T = getT(lang);

  const [tenant, analytics] = await Promise.all([
    getTenant(token, id),
    getAnalytics(token, id, 30),
  ]);

  return (
    <div className="max-w-3xl">
      <div className="mb-1 text-sm text-gray-400">{tenant.name}</div>
      <h1 className="text-2xl font-bold mb-6">{T.analytics.title}</h1>
      <AnalyticsClient tenantId={id} initialData={analytics} />
    </div>
  );
}
