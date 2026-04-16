import { cookies } from "next/headers";
import { getTenant, getAzureConfig } from "@/lib/api";
import SetupClient from "./setup-client";
import { getT } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";

export default async function SetupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const jar = await cookies();
  const token = jar.get("token")?.value ?? "";
  const lang = (jar.get("lang")?.value ?? "tr") as Lang;
  const T = getT(lang);

  const [tenant, azureConfig] = await Promise.all([
    getTenant(token, id),
    getAzureConfig(token, id).catch(() => null),
  ]);

  const gatewayHost = process.env.GATEWAY_HOST ?? "localhost";
  const gatewayPort = process.env.GATEWAY_PORT ?? "2525";
  const apiKey = process.env.SIGNATURE_API_KEY ?? "";

  return (
    <div className="max-w-3xl">
      <div className="mb-1 text-sm text-gray-400">{tenant.name}</div>
      <h1 className="text-2xl font-bold mb-2">{T.setup.title}</h1>
      <p className="text-sm text-gray-500 mb-8">{T.setup.description}</p>
      <SetupClient
        tenantId={id}
        tenantSlug={tenant.slug}
        gatewayHost={gatewayHost}
        gatewayPort={gatewayPort}
        apiKey={apiKey}
        azureConfig={azureConfig}
      />
    </div>
  );
}
