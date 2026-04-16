"use client";

import { useState } from "react";
import { useLang } from "@/lib/i18n/context";
import LanguageSwitcher from "@/components/language-switcher";

interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  job_title: string | null;
  mobile_phone: string | null;
  department: string | null;
}

const FIELD_KEYS = ["display_name", "job_title", "mobile_phone", "department"] as const;
type FieldKey = (typeof FIELD_KEYS)[number];

function completeness(form: Record<string, string>): number {
  const filled = FIELD_KEYS.filter((k) => form[k]?.trim()).length;
  return Math.round((filled / FIELD_KEYS.length) * 100);
}

export default function PortalForm({
  token,
  profile,
}: {
  token: string;
  profile: UserProfile;
}) {
  const { T } = useLang();

  const fields: { key: FieldKey; label: string; type: string; placeholder: string }[] = [
    { key: "display_name", label: T.portal.field_display_name, type: "text", placeholder: T.portal.ph_display_name },
    { key: "job_title",    label: T.portal.field_job_title,    type: "text", placeholder: T.portal.ph_job_title },
    { key: "mobile_phone", label: T.portal.field_mobile_phone, type: "tel",  placeholder: T.portal.ph_mobile_phone },
    { key: "department",   label: T.portal.field_department,   type: "text", placeholder: T.portal.ph_department },
  ];

  const [form, setForm] = useState({
    display_name: profile.display_name ?? "",
    job_title:    profile.job_title    ?? "",
    mobile_phone: profile.mobile_phone ?? "",
    department:   profile.department   ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"form" | "preview">("form");
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const pct = completeness(form);

  async function fetchPreview() {
    setPreviewLoading(true);
    try {
      const res = await fetch(`/api/portal/preview?token=${encodeURIComponent(token)}`);
      if (res.ok) {
        const data = await res.json();
        setPreviewHtml(data.html ?? null);
      }
    } finally {
      setPreviewLoading(false);
    }
  }

  function switchTab(t: "form" | "preview") {
    setTab(t);
    if (t === "preview" && previewHtml === null) fetchPreview();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/portal?token=${encodeURIComponent(token)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "Error");
        throw new Error(text);
      }
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-xl font-bold mb-2">{T.portal.success_title}</h2>
        <p className="text-sm text-gray-500 mb-6">{T.portal.success_desc}</p>
        <button
          onClick={() => { setSuccess(false); setPreviewHtml(null); switchTab("preview"); }}
          className="text-sm text-brand hover:underline"
        >
          {T.portal.view_signature}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Completeness bar */}
      <div>
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>{T.portal.completeness}</span>
          <span className="font-medium">{pct}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              pct === 100 ? "bg-green-500" : pct >= 50 ? "bg-brand" : "bg-amber-400"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {(["form", "preview"] as const).map((t) => (
          <button
            key={t}
            onClick={() => switchTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t
                ? "border-brand text-brand"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "form" ? T.portal.tab_details : T.portal.tab_preview}
          </button>
        ))}
      </div>

      {tab === "form" ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map(({ key, label, type, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {label}
                {!form[key]?.trim() && (
                  <span className="ml-1.5 text-amber-500 text-xs">{T.portal.incomplete}</span>
                )}
              </label>
              <input
                type={type}
                value={form[key]}
                placeholder={placeholder}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand transition"
              />
            </div>
          ))}

          {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-dark transition-colors disabled:opacity-60"
          >
            {saving ? T.portal.saving : T.portal.save}
          </button>
        </form>
      ) : (
        <div className="min-h-40">
          {previewLoading ? (
            <div className="flex items-center justify-center py-12 text-gray-400 text-sm">
              {T.portal.preview_loading}
            </div>
          ) : previewHtml ? (
            <div className="bg-gray-50 rounded-xl p-5 border">
              <p className="text-xs text-gray-400 mb-3 border-b pb-2">{T.portal.preview_note}</p>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed whitespace-pre-line">
                {T.portal.sample_body}
              </p>
              <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
            </div>
          ) : (
            <div className="text-center py-10 text-gray-400 text-sm">
              <p>{T.portal.preview_empty}</p>
              <p className="text-xs mt-1">{T.portal.preview_empty_sub}</p>
            </div>
          )}
          <button
            onClick={() => { setPreviewHtml(null); fetchPreview(); }}
            className="mt-3 text-xs text-brand hover:underline"
          >
            {T.portal.preview_refresh}
          </button>
        </div>
      )}

      <div className="pt-2 flex justify-end">
        <LanguageSwitcher />
      </div>
    </div>
  );
}
