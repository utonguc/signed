"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Footer from "@/components/footer";
import LanguageSwitcher from "@/components/language-switcher";
import { useLang } from "@/lib/i18n/context";

export default function LoginForm() {
  const router = useRouter();
  const { T } = useLang();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email:    form.get("email"),
        password: form.get("password"),
      }),
    });

    setLoading(false);
    if (res.ok) {
      router.push("/tenants");
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? T.login.invalid);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">

          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="text-2xl font-bold text-brand">✦</span>
              <span className="text-2xl font-bold text-gray-900 tracking-tight">Signed</span>
            </Link>
            <p className="text-xs text-gray-400 mt-1">{T.common.by_xshield}</p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{T.login.title}</h1>
              <p className="text-sm text-gray-500 mt-1">{T.login.subtitle}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{T.login.email}</label>
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{T.login.password}</label>
                <input
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand transition"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-brand-dark disabled:opacity-50 transition-colors"
              >
                {loading ? T.login.submitting : T.login.submit}
              </button>
            </form>
          </div>

          <div className="flex items-center justify-between mt-4 px-1">
            <p className="text-xs text-gray-400">
              <Link href="/" className="hover:text-gray-600 transition-colors">{T.login.back_home}</Link>
            </p>
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
