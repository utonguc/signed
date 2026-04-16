import { cookies } from "next/headers";
import { getRules, getTemplates, getTenant } from "@/lib/api";
import RulesClient from "./rules-client";
import { getT } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";

export default async function RulesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const jar = await cookies();
  const token = jar.get("token")?.value ?? "";
  const lang = (jar.get("lang")?.value ?? "tr") as Lang;
  const T = getT(lang);

  const [tenant, rules, templates] = await Promise.all([
    getTenant(token, id),
    getRules(token, id),
    getTemplates(token, id),
  ]);

  return (
    <div className="max-w-4xl">
      <div className="mb-1 text-sm text-gray-400">{tenant.name}</div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{T.rules.title}</h1>
      </div>
      <p className="text-sm text-gray-500 mb-4">{T.rules.description}</p>
      <RulesClient tenantId={id} initialRules={rules} templates={templates} />
    </div>
  );
}
