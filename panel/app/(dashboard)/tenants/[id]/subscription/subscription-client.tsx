"use client";

import { useState } from "react";
import { updateSubscriptionAction } from "../actions";
import { Subscription } from "@/lib/types";
import { useLang } from "@/lib/i18n/context";

const STATUS_COLOURS: Record<string, string> = {
  trial:     "bg-blue-100 text-blue-700",
  active:    "bg-green-100 text-green-700",
  suspended: "bg-yellow-100 text-yellow-700",
  cancelled: "bg-red-100 text-red-700",
};

function fmt(dt: string | null) {
  if (!dt) return "—";
  return new Date(dt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function SubscriptionClient({
  tenantId, initialSubscription,
}: {
  tenantId: string;
  initialSubscription: Subscription;
}) {
  const { T } = useLang();
  const STATUS_OPTIONS = [
    { value: "trial",     label: T.subscription.status_trial },
    { value: "active",    label: T.subscription.status_active },
    { value: "suspended", label: T.subscription.status_suspended },
    { value: "cancelled", label: T.subscription.status_cancelled },
  ];

  const [sub, setSub] = useState(initialSubscription);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    status: sub.status,
    seats: String(sub.seats),
    trial_ends_at: sub.trial_ends_at ? sub.trial_ends_at.slice(0, 10) : "",
    period_end:    sub.period_end    ? sub.period_end.slice(0, 10)    : "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const body: Record<string, unknown> = {
        status: form.status,
        seats: parseInt(form.seats, 10),
      };
      if (form.trial_ends_at) body.trial_ends_at = new Date(form.trial_ends_at).toISOString();
      if (form.period_end)    body.period_end    = new Date(form.period_end).toISOString();
      const updated = await updateSubscriptionAction(tenantId, body);
      setSub(updated);
      setEditing(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : T.common.error);
    } finally {
      setSaving(false);
    }
  }

  const usagePct = sub.seats > 0 ? Math.min(100, Math.round((sub.used_seats / sub.seats) * 100)) : 0;

  return (
    <div className="space-y-4">
      <div className="bg-white border rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLOURS[sub.status] ?? ""}`}>
            {sub.status.toUpperCase()}
          </span>
          {!editing && (
            <button onClick={() => setEditing(true)} className="text-sm text-brand hover:underline">
              {T.common.edit}
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">{T.subscription.trial_ends}</p>
            <p className="font-medium">{fmt(sub.trial_ends_at)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">{T.subscription.period_end}</p>
            <p className="font-medium">{fmt(sub.period_end)}</p>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-600">{T.subscription.seats_used}</span>
            <span className="font-medium">
              {sub.used_seats} / {sub.seats === 999 ? "∞" : sub.seats}
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${usagePct >= 90 ? "bg-red-500" : usagePct >= 70 ? "bg-yellow-400" : "bg-brand"}`}
              style={{ width: `${usagePct}%` }}
            />
          </div>
        </div>
      </div>

      {editing && (
        <form onSubmit={handleSave} className="bg-white border rounded-xl p-5 space-y-3">
          <h2 className="font-semibold text-sm">{T.subscription.edit_title}</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">{T.subscription.field_status}</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as typeof sub.status }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{T.subscription.field_seats}</label>
              <input
                type="number"
                min={1}
                value={form.seats}
                onChange={(e) => setForm((f) => ({ ...f, seats: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{T.subscription.field_trial_ends}</label>
              <input
                type="date"
                value={form.trial_ends_at}
                onChange={(e) => setForm((f) => ({ ...f, trial_ends_at: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{T.subscription.field_period_end}</label>
              <input
                type="date"
                value={form.period_end}
                onChange={(e) => setForm((f) => ({ ...f, period_end: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-brand text-white px-4 py-2 rounded-lg text-sm hover:bg-brand-dark transition-colors disabled:opacity-60"
            >
              {saving ? T.common.saving : T.common.save}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="px-4 py-2 rounded-lg text-sm border hover:bg-gray-50 transition-colors"
            >
              {T.common.cancel}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
