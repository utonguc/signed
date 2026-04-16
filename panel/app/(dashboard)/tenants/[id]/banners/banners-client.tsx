"use client";

import { useState } from "react";
import { Plus, Trash2, Pencil, X, Check } from "lucide-react";
import { createBannerAction, updateBannerAction, deleteBannerAction } from "../actions";
import type { Banner } from "@/lib/types";
import { useLang } from "@/lib/i18n/context";

function PositionBadge({ value, label }: { value: Banner["position"]; label: string }) {
  const colours: Record<string, string> = {
    header: "bg-purple-100 text-purple-700",
    footer: "bg-indigo-100 text-indigo-700",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colours[value] ?? ""}`}>
      {label}
    </span>
  );
}

function AppliesBadge({ value, label }: { value: Banner["applies_to"]; label: string }) {
  const colours: Record<string, string> = {
    all: "bg-blue-100 text-blue-700",
    external: "bg-orange-100 text-orange-700",
    internal: "bg-green-100 text-green-700",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colours[value] ?? ""}`}>
      {label}
    </span>
  );
}

export default function BannersClient({
  tenantId,
  initialBanners,
}: {
  tenantId: string;
  initialBanners: Banner[];
}) {
  const { T } = useLang();

  const POSITION_OPTIONS: { value: Banner["position"]; label: string }[] = [
    { value: "header", label: T.banners.position_header },
    { value: "footer", label: T.banners.position_footer },
  ];

  const APPLIES_OPTIONS: { value: Banner["applies_to"]; label: string }[] = [
    { value: "all",      label: T.banners.applies_all },
    { value: "external", label: T.banners.applies_external },
    { value: "internal", label: T.banners.applies_internal },
  ];

  const positionLabel = (v: Banner["position"]) =>
    POSITION_OPTIONS.find((o) => o.value === v)?.label ?? v;
  const appliesLabel = (v: Banner["applies_to"]) =>
    APPLIES_OPTIONS.find((o) => o.value === v)?.label ?? v;

  const [banners, setBanners] = useState(initialBanners);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    html_content: "",
    position: "header" as Banner["position"],
    applies_to: "all" as Banner["applies_to"],
    enabled: true,
  });
  const [error, setError] = useState("");

  function resetForm() {
    setForm({ name: "", html_content: "", position: "header", applies_to: "all", enabled: true });
    setShowForm(false);
    setEditId(null);
    setError("");
  }

  function startEdit(b: Banner) {
    setForm({ name: b.name, html_content: b.html_content, position: b.position, applies_to: b.applies_to, enabled: b.enabled });
    setEditId(b.id);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      if (editId) {
        const updated = await updateBannerAction(tenantId, editId, form);
        setBanners((prev) => prev.map((b) => b.id === editId ? updated : b));
      } else {
        const created = await createBannerAction(tenantId, form);
        setBanners((prev) => [...prev, created]);
      }
      resetForm();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : T.common.error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(T.common.confirm_delete)) return;
    await deleteBannerAction(tenantId, id);
    setBanners((prev) => prev.filter((b) => b.id !== id));
  }

  async function toggleEnabled(b: Banner) {
    const updated = await updateBannerAction(tenantId, b.id, { enabled: !b.enabled });
    setBanners((prev) => prev.map((x) => x.id === b.id ? updated : x));
  }

  return (
    <div className="space-y-4">
      <div className="bg-white border rounded-xl divide-y overflow-hidden">
        {banners.map((b) => (
          <div key={b.id} className="px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="font-medium text-sm">{b.name}</span>
                  <PositionBadge value={b.position} label={positionLabel(b.position)} />
                  <AppliesBadge value={b.applies_to} label={appliesLabel(b.applies_to)} />
                  {!b.enabled && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">
                      {T.common.disabled}
                    </span>
                  )}
                </div>
                <p
                  className="text-xs text-gray-400 truncate"
                  dangerouslySetInnerHTML={{
                    __html: b.html_content.replace(/<[^>]+>/g, " ").slice(0, 120) + "…",
                  }}
                />
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => toggleEnabled(b)}
                  className={`text-xs px-2 py-1 rounded border transition-colors ${
                    b.enabled
                      ? "border-green-200 text-green-600 hover:bg-green-50"
                      : "border-gray-200 text-gray-400 hover:bg-gray-50"
                  }`}
                >
                  {b.enabled ? <Check size={13} /> : <X size={13} />}
                </button>
                <button
                  onClick={() => startEdit(b)}
                  className="text-gray-400 hover:text-brand transition-colors"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDelete(b.id)}
                  className="text-gray-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {banners.length === 0 && (
          <p className="px-4 py-6 text-center text-gray-400 text-sm">{T.banners.no_banners}</p>
        )}
      </div>

      {showForm ? (
        <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-5 space-y-3">
          <h2 className="font-semibold text-sm">
            {editId ? T.banners.edit_title : T.banners.new_title}
          </h2>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder={T.banners.field_name}
            required
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          />
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">{T.banners.field_position}</label>
              <select
                value={form.position}
                onChange={(e) => setForm((f) => ({ ...f, position: e.target.value as Banner["position"] }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              >
                {POSITION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">{T.banners.field_applies}</label>
              <select
                value={form.applies_to}
                onChange={(e) => setForm((f) => ({ ...f, applies_to: e.target.value as Banner["applies_to"] }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              >
                {APPLIES_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
          <textarea
            value={form.html_content}
            onChange={(e) => setForm((f) => ({ ...f, html_content: e.target.value }))}
            placeholder={T.banners.field_html}
            required
            rows={6}
            className="w-full border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand"
          />
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))}
            />
            {T.banners.field_enabled}
          </label>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-brand text-white px-4 py-2 rounded-lg text-sm hover:bg-brand-dark transition-colors"
            >
              {editId ? T.common.save : T.banners.create_btn}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 rounded-lg text-sm border hover:bg-gray-50 transition-colors"
            >
              {T.common.cancel}
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 bg-brand text-white px-4 py-2 rounded-lg text-sm hover:bg-brand-dark transition-colors"
        >
          <Plus size={14} /> {T.banners.new_title}
        </button>
      )}
    </div>
  );
}
