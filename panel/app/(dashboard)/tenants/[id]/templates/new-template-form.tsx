"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { createTemplateAction } from "../actions";
import { useLang } from "@/lib/i18n/context";

const DEFAULT_HTML = `<br/>
<table cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif;font-size:13px;color:#333;border-top:2px solid #0066cc;padding-top:8px;">
<tr><td><b>{{ display_name }}</b></td></tr>
<tr><td style="color:#555;">{{ job_title }}{% if department %} &bull; {{ department }}{% endif %}</td></tr>
<tr><td style="color:#777;">{{ mobile_phone }}</td></tr>
<tr><td><a href="#" style="color:#0066cc;">www.yourcompany.com</a></td></tr>
</table>`;

export default function NewTemplateForm({ tenantId }: { tenantId: string }) {
  const router = useRouter();
  const { T } = useLang();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      const t = await createTemplateAction(tenantId, {
        name: form.get("name") as string,
        html_content: DEFAULT_HTML,
        is_default: form.get("is_default") === "on",
      });
      setOpen(false);
      router.push(`/tenants/${tenantId}/templates/${t.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : T.common.error);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 bg-brand text-white text-sm px-4 py-2 rounded-lg hover:bg-brand-dark transition-colors"
      >
        <Plus size={15} /> {T.templates.new_btn}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm space-y-4">
        <h2 className="font-semibold text-lg">{T.templates.new_title}</h2>
        <div>
          <label className="block text-sm font-medium mb-1">{T.templates.new_name_label}</label>
          <input
            name="name"
            required
            placeholder={T.templates.new_name_ph}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_default" />
          {T.templates.new_set_default}
        </label>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-50"
          >
            {T.common.cancel}
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm rounded-lg bg-brand text-white hover:bg-brand-dark"
          >
            {T.templates.new_create_btn}
          </button>
        </div>
      </form>
    </div>
  );
}
