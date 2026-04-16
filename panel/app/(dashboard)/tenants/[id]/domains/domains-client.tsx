"use client";

import { useState } from "react";
import { Plus, Trash2, CheckCircle, Clock } from "lucide-react";
import { addDomainAction, deleteDomainAction } from "../actions";
import { Domain } from "@/lib/types";
import { useLang } from "@/lib/i18n/context";

export default function DomainsClient({
  tenantId, initialDomains,
}: {
  tenantId: string;
  initialDomains: Domain[];
}) {
  const { T } = useLang();
  const [domains, setDomains] = useState(initialDomains);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const d = await addDomainAction(tenantId, input.trim().toLowerCase());
      setDomains((prev) => [...prev, d]);
      setInput("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : T.common.error);
    }
  }

  async function handleDelete(id: string) {
    await deleteDomainAction(tenantId, id);
    setDomains((prev) => prev.filter((d) => d.id !== id));
  }

  return (
    <div className="space-y-3">
      <div className="bg-white border rounded-xl divide-y overflow-hidden">
        {domains.map((d) => (
          <div key={d.id} className="flex items-center gap-3 px-4 py-3">
            {d.verified
              ? <CheckCircle size={16} className="text-green-500 shrink-0" />
              : <Clock size={16} className="text-gray-300 shrink-0" />}
            <span className="flex-1 font-mono text-sm">{d.domain}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${d.verified ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
              {d.verified ? T.domains.verified : T.domains.pending}
            </span>
            <button onClick={() => handleDelete(d.id)} className="text-gray-300 hover:text-red-500 transition-colors ml-2">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {domains.length === 0 && (
          <p className="px-4 py-6 text-center text-gray-400 text-sm">{T.domains.no_domains}</p>
        )}
      </div>

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={T.domains.add_ph}
          className="flex-1 border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand"
        />
        <button type="submit" className="flex items-center gap-1.5 bg-brand text-white px-4 py-2 rounded-lg text-sm hover:bg-brand-dark transition-colors">
          <Plus size={14} /> {T.domains.add_btn}
        </button>
      </form>
      {error && <p className="text-red-600 text-sm">{error}</p>}
    </div>
  );
}
