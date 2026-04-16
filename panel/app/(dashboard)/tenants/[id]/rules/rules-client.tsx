"use client";

import { useState } from "react";
import { Plus, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { createRuleAction, updateRuleAction, deleteRuleAction } from "../actions";
import { Rule, Template } from "@/lib/types";
import { useLang } from "@/lib/i18n/context";

export default function RulesClient({
  tenantId, initialRules, templates,
}: {
  tenantId: string;
  initialRules: Rule[];
  templates: Template[];
}) {
  const { T } = useLang();
  const [rules, setRules] = useState(initialRules);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  const CONDITION_TYPES = [
    { value: "",            label: T.rules.cond_catchall },
    { value: "department",  label: T.rules.cond_department },
    { value: "job_title",   label: T.rules.cond_job_title },
    { value: "email",       label: T.rules.cond_email },
  ];

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    const condType = form.get("condition_type") as string;
    try {
      const r = await createRuleAction(tenantId, {
        priority:        parseInt(form.get("priority") as string),
        condition_type:  condType || null,
        condition_value: condType ? (form.get("condition_value") as string) : null,
        template_id:     form.get("template_id") as string,
        enabled:         true,
      });
      setRules((prev) => [...prev, r].sort((a, b) => a.priority - b.priority));
      setShowForm(false);
      (e.target as HTMLFormElement).reset();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : T.common.error);
    }
  }

  async function toggleEnabled(rule: Rule) {
    const updated = await updateRuleAction(tenantId, rule.id, { enabled: !rule.enabled });
    setRules((prev) => prev.map((r) => (r.id === rule.id ? updated : r)));
  }

  async function handleDelete(ruleId: string) {
    await deleteRuleAction(tenantId, ruleId);
    setRules((prev) => prev.filter((r) => r.id !== ruleId));
  }

  return (
    <div className="space-y-4">
      {rules.length === 0 && !showForm && (
        <p className="text-gray-400 text-sm">{T.rules.no_rules}</p>
      )}

      {rules.map((r) => (
        <div key={r.id} className={`bg-white border rounded-xl p-4 flex items-center gap-4 ${!r.enabled ? "opacity-50" : ""}`}>
          <span className="text-2xl font-bold text-gray-200 w-10 text-center">{r.priority}</span>
          <div className="flex-1">
            <p className="text-sm font-medium">
              {r.condition_type
                ? `${r.condition_type} = "${r.condition_value}"`
                : <span className="italic text-gray-400">{T.rules.catchall_label}</span>}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{T.rules.template_arrow} {r.template_name ?? r.template_id}</p>
          </div>
          <button onClick={() => toggleEnabled(r)} className="text-gray-400 hover:text-brand transition-colors">
            {r.enabled ? <ToggleRight size={20} className="text-brand" /> : <ToggleLeft size={20} />}
          </button>
          <button onClick={() => handleDelete(r.id)} className="text-gray-300 hover:text-red-500 transition-colors">
            <Trash2 size={15} />
          </button>
        </div>
      ))}

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white border rounded-xl p-4 space-y-3">
          <h3 className="font-medium text-sm">{T.rules.new_rule_title}</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">{T.rules.col_priority}</label>
              <input name="priority" type="number" defaultValue={50} className="w-full border rounded px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{T.rules.col_template}</label>
              <select name="template_id" required className="w-full border rounded px-2 py-1.5 text-sm">
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{T.rules.col_condition}</label>
              <select name="condition_type" className="w-full border rounded px-2 py-1.5 text-sm">
                {CONDITION_TYPES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{T.rules.col_value}</label>
              <input name="condition_value" placeholder={T.rules.cond_value_ph} className="w-full border rounded px-2 py-1.5 text-sm" />
            </div>
          </div>
          {error && <p className="text-red-600 text-xs">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50">
              {T.common.cancel}
            </button>
            <button type="submit" className="px-3 py-1.5 text-sm bg-brand text-white rounded-lg hover:bg-brand-dark">
              {T.rules.add_btn}
            </button>
          </div>
        </form>
      )}

      {!showForm && (
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 text-sm text-brand hover:underline">
          <Plus size={15} /> {T.rules.add_rule}
        </button>
      )}
    </div>
  );
}
