"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Building2, LogOut } from "lucide-react";
import clsx from "clsx";
import { useLang } from "@/lib/i18n/context";
import LanguageSwitcher from "@/components/language-switcher";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { T } = useLang();

  const tenantMatch = pathname.match(/\/tenants\/([^/]+)/);
  const tenantId = tenantMatch?.[1];

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const navLink = (href: string, label: string) => (
    <Link
      key={href}
      href={href}
      className={clsx(
        "block px-3 py-2 rounded-lg text-sm transition-colors",
        pathname.startsWith(href) && pathname === href
          ? "bg-brand text-white font-medium"
          : pathname.startsWith(href)
          ? "bg-brand/10 text-brand font-medium"
          : "text-gray-600 hover:bg-gray-100"
      )}
    >
      {label}
    </Link>
  );

  return (
    <aside className="w-56 shrink-0 flex flex-col bg-white border-r min-h-screen">
      {/* Logo */}
      <div className="px-4 py-5 border-b">
        <div className="flex items-center gap-1.5">
          <span className="text-brand font-bold text-lg">✦</span>
          <span className="font-bold text-gray-900 text-lg tracking-tight">Signed</span>
        </div>
        <p className="text-xs text-gray-400 mt-0.5">{T.common.by_xshield} · {T.nav.admin}</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <Link
          href="/tenants"
          className={clsx(
            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
            pathname === "/tenants"
              ? "bg-brand text-white font-medium"
              : "text-gray-600 hover:bg-gray-100"
          )}
        >
          <Building2 size={15} /> {T.nav.tenants}
        </Link>

        {tenantId && (
          <div className="pt-3">
            <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              {T.nav.tenant_section}
            </p>
            {navLink(`/tenants/${tenantId}/templates`,    T.nav.templates)}
            {navLink(`/tenants/${tenantId}/rules`,        T.nav.rules)}
            {navLink(`/tenants/${tenantId}/users`,        T.nav.users)}
            {navLink(`/tenants/${tenantId}/domains`,      T.nav.domains)}
            {navLink(`/tenants/${tenantId}/disclaimers`,  T.nav.disclaimers)}
            {navLink(`/tenants/${tenantId}/banners`,      T.nav.banners)}
            {navLink(`/tenants/${tenantId}/analytics`,    T.nav.analytics)}
            {navLink(`/tenants/${tenantId}/subscription`, T.nav.subscription)}
            {navLink(`/tenants/${tenantId}/setup`,        T.nav.setup)}
          </div>
        )}
      </nav>

      {/* Bottom: language + logout */}
      <div className="px-3 py-4 border-t space-y-1">
        <div className="px-3 py-2">
          <LanguageSwitcher />
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <LogOut size={15} /> {T.common.sign_out}
        </button>
      </div>
    </aside>
  );
}
