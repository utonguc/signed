import { cookies } from "next/headers";
import { getSubscription, getTenant } from "@/lib/api";
import SubscriptionClient from "./subscription-client";
import { getT } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";

export default async function SubscriptionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const jar = await cookies();
  const token = jar.get("token")?.value ?? "";
  const lang = (jar.get("lang")?.value ?? "tr") as Lang;
  const T = getT(lang);

  const [tenant, subscription] = await Promise.all([
    getTenant(token, id),
    getSubscription(token, id),
  ]);

  return (
    <div className="max-w-2xl">
      <div className="mb-1 text-sm text-gray-400">{tenant.name}</div>
      <h1 className="text-2xl font-bold mb-6">{T.subscription.title}</h1>
      <SubscriptionClient tenantId={id} initialSubscription={subscription} />
    </div>
  );
}
