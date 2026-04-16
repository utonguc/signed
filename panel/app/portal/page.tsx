/**
 * User Self-Service Portal — public page, no auth cookie required.
 * Accessed via: /portal?token=<magic-link-token>
 */
import { cookies } from "next/headers";
import PortalForm from "./portal-form";
import Footer from "@/components/footer";
import { LangProvider } from "@/lib/i18n/context";
import { getT } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";

const API_URL = process.env.API_URL ?? "http://api:5000";

interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  job_title: string | null;
  mobile_phone: string | null;
  department: string | null;
}

async function fetchProfile(token: string): Promise<UserProfile | null> {
  try {
    const res = await fetch(`${API_URL}/v1/portal?token=${encodeURIComponent(token)}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function PortalPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const lang = ((await cookies()).get("lang")?.value ?? "tr") as Lang;
  const T = getT(lang);
  const { token } = await searchParams;

  if (!token) {
    return (
      <LangProvider lang={lang}>
        <div className="min-h-screen flex flex-col bg-gray-50">
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border p-8 text-center">
              <p className="text-4xl mb-4">🔗</p>
              <h1 className="text-xl font-bold mb-2">{T.portal.link_unavailable}</h1>
              <p className="text-sm text-gray-500">{T.portal.no_token}</p>
            </div>
          </div>
          <Footer />
        </div>
      </LangProvider>
    );
  }

  const profile = await fetchProfile(token);

  if (!profile) {
    return (
      <LangProvider lang={lang}>
        <div className="min-h-screen flex flex-col bg-gray-50">
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border p-8 text-center">
              <p className="text-4xl mb-4">🔗</p>
              <h1 className="text-xl font-bold mb-2">{T.portal.link_unavailable}</h1>
              <p className="text-sm text-gray-500">{T.portal.expired}</p>
            </div>
          </div>
          <Footer />
        </div>
      </LangProvider>
    );
  }

  return (
    <LangProvider lang={lang}>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border p-8">
            <div className="mb-6">
              <div className="flex items-center gap-1.5 mb-3">
                <span className="text-brand font-bold">✦</span>
                <span className="font-bold text-gray-900 text-sm tracking-tight">Signed</span>
                <span className="text-xs text-gray-400">{T.common.by_xshield}</span>
              </div>
              <h1 className="text-2xl font-bold">{T.portal.title}</h1>
              <p className="text-sm text-gray-500 mt-1">{profile.email}</p>
            </div>
            <PortalForm token={token} profile={profile} />
          </div>
        </div>
        <Footer />
      </div>
    </LangProvider>
  );
}
