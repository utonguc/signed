"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { createTenantAction } from "./actions";
import { useLang } from "@/lib/i18n/context";

export default function NewTenantForm() {
  const router = useRouter();
  const { T } = useLang();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      await createTenantAction(
        form.get("name") as string,
        form.get("slug") as string,
      );
      setOpen(false);
      router.refresh();
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
        <Plus size={15} /> {T.dashboard.new_tenant}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm space-y-4"
      >
        <h2 className="font-semibold text-lg">{T.dashboard.new_tenant_title}</h2>
        <div>
          <label className="block text-sm font-medium mb-1">{T.dashboard.new_tenant_name}</label>
          <input name="name" required className="w-full border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{T.dashboard.new_tenant_slug}</label>
          <input
            name="slug"
            required
            className="w-full border rounded-lg px-3 py-2 text-sm font-mono"
            placeholder={T.dashboard.new_tenant_slug_ph}
          />
        </div>
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
            {T.dashboard.new_tenant_create}
          </button>
        </div>
      </form>
    </div>
  );
}
