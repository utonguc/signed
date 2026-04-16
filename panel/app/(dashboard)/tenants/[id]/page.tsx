import { cookies } from "next/headers";
import Link from "next/link";
import {
  getTenant, getTemplates, getUsers, getRules,
  getAnalytics, getDomains, getSubscription,
} from "@/lib/api";
import { getT, t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";

export default async function TenantOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const jar = await cookies();
  const token = jar.get("token")?.value ?? "";
  const lang = (jar.get("lang")?.value ?? "tr") as Lang;
  const T = getT(lang);

  const SECTIONS = [
    { href: "templates",    label: T.overview.section_templates,    icon: "🎨", desc: T.overview.section_templates_desc },
    { href: "rules",        label: T.overview.section_rules,        icon: "🎯", desc: T.overview.section_rules_desc },
    { href: "users",        label: T.overview.section_users,        icon: "👥", desc: T.overview.section_users_desc },
    { href: "domains",      label: T.overview.section_domains,      icon: "🌐", desc: T.overview.section_domains_desc },
    { href: "disclaimers",  label: T.overview.section_disclaimers,  icon: "⚖️",  desc: T.overview.section_disclaimers_desc },
    { href: "banners",      label: T.overview.section_banners,      icon: "📢", desc: T.overview.section_banners_desc },
    { href: "analytics",    label: T.overview.section_analytics,    icon: "📊", desc: T.overview.section_analytics_desc },
    { href: "subscription", label: T.overview.section_subscription, icon: "💳", desc: T.overview.section_subscription_desc },
    { href: "setup",        label: T.overview.section_setup,        icon: "🔌", desc: T.overview.section_setup_desc },
  ];

  const [tenant, templates, users, rules, analytics, domains, subscription] = await Promise.all([
    getTenant(token, id),
    getTemplates(token, id).catch(() => []),
    getUsers(token, id).catch(() => []),
    getRules(token, id).catch(() => []),
    getAnalytics(token, id, 30).catch(() => null),
    getDomains(token, id).catch(() => []),
    getSubscription(token, id).catch(() => null),
  ]);

  return (
    <div className="max-w-5xl space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400 mb-1">
            <Link href="/tenants" className="hover:underline">{T.overview.breadcrumb}</Link> /
          </p>
          <h1 className="text-2xl font-bold">{tenant.name}</h1>
          <p className="text-sm text-gray-500 mt-1 font-mono">{tenant.slug}</p>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
          tenant.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
        }`}>
          {tenant.status}
        </span>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{users.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">{T.overview.stat_users}</p>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{templates.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">{T.overview.stat_templates}</p>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{domains.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">{T.overview.stat_domains}</p>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{analytics?.total_sent ?? 0}</p>
          <p className="text-xs text-gray-400 mt-0.5">{T.overview.stat_emails}</p>
        </div>
      </div>

      {/* Alerts */}
      <div className="space-y-2">
        {templates.length === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center justify-between text-sm">
            <span className="text-amber-800">{T.overview.alert_no_template}</span>
            <Link href={`/tenants/${id}/templates`} className="text-amber-700 font-medium hover:underline shrink-0 ml-4">
              {T.overview.alert_no_template_cta}
            </Link>
          </div>
        )}
        {domains.length === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center justify-between text-sm">
            <span className="text-amber-800">{T.overview.alert_no_domain}</span>
            <Link href={`/tenants/${id}/domains`} className="text-amber-700 font-medium hover:underline shrink-0 ml-4">
              {T.overview.alert_no_domain_cta}
            </Link>
          </div>
        )}
        {rules.length === 0 && templates.length > 0 && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-center justify-between text-sm">
            <span className="text-blue-800">{T.overview.alert_no_rules}</span>
            <Link href={`/tenants/${id}/rules`} className="text-blue-700 font-medium hover:underline shrink-0 ml-4">
              {T.overview.alert_no_rules_cta}
            </Link>
          </div>
        )}
        {subscription && subscription.status === "trial" && (
          <div className="bg-purple-50 border border-purple-100 rounded-xl px-4 py-3 flex items-center justify-between text-sm">
            <span className="text-purple-800">
              {T.overview.alert_trial}
              {subscription.trial_ends_at
                ? t(T.overview.alert_trial_expires, { date: new Date(subscription.trial_ends_at).toLocaleDateString() })
                : ""}
            </span>
            <Link href={`/tenants/${id}/subscription`} className="text-purple-700 font-medium hover:underline shrink-0 ml-4">
              {T.overview.alert_trial_cta}
            </Link>
          </div>
        )}
      </div>

      {/* Analytics snapshot */}
      {analytics && analytics.total_sent > 0 && (
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm">{T.overview.analytics_title}</h2>
            <Link href={`/tenants/${id}/analytics`} className="text-xs text-brand hover:underline">
              {T.overview.analytics_full}
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xl font-bold">{analytics.total_sent}</p>
              <p className="text-xs text-gray-400">{T.overview.analytics_sent}</p>
            </div>
            <div>
              <p className="text-xl font-bold">{analytics.total_opened}</p>
              <p className="text-xs text-gray-400">{T.overview.analytics_opened}</p>
            </div>
            <div>
              <p className="text-xl font-bold">{analytics.open_rate}%</p>
              <p className="text-xs text-gray-400">{T.overview.analytics_rate}</p>
            </div>
          </div>
        </div>
      )}

      {/* Section grid */}
      <div>
        <h2 className="text-lg font-semibold mb-4">{T.overview.manage_title}</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {SECTIONS.map((s) => (
            <Link
              key={s.href}
              href={`/tenants/${id}/${s.href}`}
              className="bg-white border rounded-xl p-4 hover:border-brand hover:shadow-sm transition-all group"
            >
              <span className="text-2xl">{s.icon}</span>
              <p className="font-medium text-sm mt-2 group-hover:text-brand transition-colors">{s.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
