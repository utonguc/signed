import { cookies } from "next/headers";
import { getTenant, getBanners } from "@/lib/api";
import BannersClient from "./banners-client";
import { getT } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";

export default async function BannersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const jar = await cookies();
  const token = jar.get("token")?.value ?? "";
  const lang = (jar.get("lang")?.value ?? "tr") as Lang;
  const T = getT(lang);

  const [tenant, banners] = await Promise.all([
    getTenant(token, id),
    getBanners(token, id),
  ]);

  return (
    <div className="max-w-3xl">
      <div className="mb-1 text-sm text-gray-400">{tenant.name}</div>
      <h1 className="text-2xl font-bold mb-2">{T.banners.title}</h1>
      <p className="text-sm text-gray-500 mb-8">{T.banners.description}</p>
      <BannersClient tenantId={id} initialBanners={banners} />
    </div>
  );
}
