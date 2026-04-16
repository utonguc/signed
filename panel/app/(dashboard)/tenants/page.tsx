import { cookies } from "next/headers";
import Link from "next/link";
import { getTenants, getDashboardStats } from "@/lib/api";
import { Tenant, DashboardStats } from "@/lib/types";
import NewTenantForm from "./new-tenant-form";
import { getT, t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border p-4">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default async function TenantsPage() {
  const jar = await cookies();
  const token = jar.get("token")?.value ?? "";
  const lang = (jar.get("lang")?.value ?? "tr") as Lang;
  const T = getT(lang);

  let tenants: Tenant[] = [];
  let stats: DashboardStats | null = null;

  try {
    [tenants, stats] = await Promise.all([
      getTenants(token),
      getDashboardStats(token),
    ]);
  } catch {
    try { tenants = await getTenants(token); } catch {}
  }

  return (
    <div className="max-w-5xl space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{T.dashboard.title}</h1>
        <NewTenantForm />
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            label={T.dashboard.stat_tenants}
            value={stats.total_tenants}
            sub={t(T.dashboard.stat_tenants_sub, { n: stats.active_tenants })}
          />
          <StatCard label={T.dashboard.stat_users} value={stats.total_users} />
          <StatCard
            label={T.dashboard.stat_emails}
            value={stats.emails_sent_30d}
            sub={t(T.dashboard.stat_emails_sub, { n: stats.open_rate_30d })}
          />
          <StatCard
            label={T.dashboard.stat_subscriptions}
            value={stats.active_subscriptions}
            sub={t(T.dashboard.stat_subscriptions_sub, { n: stats.trial_tenants })}
          />
        </div>
      )}

      {/* Tenant list */}
      <div>
        <h2 className="text-lg font-semibold mb-4">{T.dashboard.tenants_title}</h2>
        {tenants.length === 0 ? (
          <div className="bg-white rounded-xl border p-12 text-center">
            <p className="text-gray-400 text-sm mb-4">{T.dashboard.no_tenants}</p>
            <NewTenantForm />
          </div>
        ) : (
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">{T.dashboard.col_name}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">{T.dashboard.col_slug}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">{T.dashboard.col_status}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">{T.dashboard.col_created}</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {tenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium">{tenant.name}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{tenant.slug}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        tenant.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}>
                        {tenant.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {new Date(tenant.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/tenants/${tenant.id}`}
                        className="text-brand hover:underline text-xs font-medium"
                      >
                        {T.common.manage}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
