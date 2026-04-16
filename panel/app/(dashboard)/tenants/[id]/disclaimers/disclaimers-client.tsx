"use client";

import { useState } from "react";
import { Plus, Trash2, Pencil, X, Check } from "lucide-react";
import { createDisclaimerAction, updateDisclaimerAction, deleteDisclaimerAction } from "../actions";
import { Disclaimer } from "@/lib/types";
import { useLang } from "@/lib/i18n/context";

function AppliesBadge({ value, label }: { value: Disclaimer["applies_to"]; label: string }) {
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

export default function DisclaimersClient({
  tenantId, initialDisclaimers,
}: {
  tenantId: string;
  initialDisclaimers: Disclaimer[];
}) {
  const { T } = useLang();

  const APPLIES_OPTIONS: { value: Disclaimer["applies_to"]; label: string }[] = [
    { value: "all",      label: T.disclaimers.applies_all },
    { value: "external", label: T.disclaimers.applies_external },
    { value: "internal", label: T.disclaimers.applies_internal },
  ];

  const appliesLabel = (v: Disclaimer["applies_to"]) =>
    APPLIES_OPTIONS.find((o) => o.value === v)?.label ?? v;

  const [disclaimers, setDisclaimers] = useState(initialDisclaimers);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", html_content: "", applies_to: "all" as Disclaimer["applies_to"], enabled: true });
  const [error, setError] = useState("");

  function resetForm() {
    setForm({ name: "", html_content: "", applies_to: "all", enabled: true });
    setShowForm(false);
    setEditId(null);
    setError("");
  }

  function startEdit(d: Disclaimer) {
    setForm({ name: d.name, html_content: d.html_content, applies_to: d.applies_to, enabled: d.enabled });
    setEditId(d.id);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      if (editId) {
        const updated = await updateDisclaimerAction(tenantId, editId, form);
        setDisclaimers((prev) => prev.map((d) => d.id === editId ? updated : d));
      } else {
        const created = await createDisclaimerAction(tenantId, form);
        setDisclaimers((prev) => [...prev, created]);
      }
      resetForm();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : T.common.error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(T.common.confirm_delete)) return;
    await deleteDisclaimerAction(tenantId, id);
    setDisclaimers((prev) => prev.filter((d) => d.id !== id));
  }

  async function toggleEnabled(d: Disclaimer) {
    const updated = await updateDisclaimerAction(tenantId, d.id, { enabled: !d.enabled });
    setDisclaimers((prev) => prev.map((x) => x.id === d.id ? updated : x));
  }

  return (
    <div className="space-y-4">
      <div className="bg-white border rounded-xl divide-y overflow-hidden">
        {disclaimers.map((d) => (
          <div key={d.id} className="px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-medium text-sm">{d.name}</span>
                  <AppliesBadge value={d.applies_to} label={appliesLabel(d.applies_to)} />
                  {!d.enabled && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">{T.common.disabled}</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 truncate"
                   dangerouslySetInnerHTML={{ __html: d.html_content.replace(/<[^>]+>/g, " ").slice(0, 120) + "…" }} />
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => toggleEnabled(d)}
                  className={`text-xs px-2 py-1 rounded border transition-colors ${d.enabled ? "border-green-200 text-green-600 hover:bg-green-50" : "border-gray-200 text-gray-400 hover:bg-gray-50"}`}
                >
                  {d.enabled ? <Check size={13} /> : <X size={13} />}
                </button>
                <button onClick={() => startEdit(d)} className="text-gray-400 hover:text-brand transition-colors">
                  <Pencil size={14} />
                </button>
                <button onClick={() => handleDelete(d.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {disclaimers.length === 0 && (
          <p className="px-4 py-6 text-center text-gray-400 text-sm">{T.disclaimers.no_disclaimers}</p>
        )}
      </div>

      {showForm ? (
        <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-5 space-y-3">
          <h2 className="font-semibold text-sm">{editId ? T.disclaimers.edit_title : T.disclaimers.new_title}</h2>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder={T.disclaimers.field_name}
            required
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          />
          <select
            value={form.applies_to}
            onChange={(e) => setForm((f) => ({ ...f, applies_to: e.target.value as Disclaimer["applies_to"] }))}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          >
            {APPLIES_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <textarea
            value={form.html_content}
            onChange={(e) => setForm((f) => ({ ...f, html_content: e.target.value }))}
            placeholder={T.disclaimers.field_html}
            required
            rows={5}
            className="w-full border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand"
          />
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))}
            />
            {T.disclaimers.field_enabled}
          </label>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" className="bg-brand text-white px-4 py-2 rounded-lg text-sm hover:bg-brand-dark transition-colors">
              {editId ? T.common.save : T.disclaimers.create_btn}
            </button>
            <button type="button" onClick={resetForm} className="px-4 py-2 rounded-lg text-sm border hover:bg-gray-50 transition-colors">
              {T.common.cancel}
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 bg-brand text-white px-4 py-2 rounded-lg text-sm hover:bg-brand-dark transition-colors"
        >
          <Plus size={14} /> {T.disclaimers.new_title}
        </button>
      )}
    </div>
  );
}
