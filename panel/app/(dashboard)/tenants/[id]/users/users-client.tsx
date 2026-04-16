"use client";

import { useState, useRef } from "react";
import { Plus, Pencil, Trash2, X, Check, Link2, Upload } from "lucide-react";
import { createUserAction, updateUserAction, deleteUserAction, sendMagicLinkAction, importUsersCSVAction } from "../actions";
import { User } from "@/lib/types";
import { useLang } from "@/lib/i18n/context";
import { t } from "@/lib/i18n";

type EditState = Partial<User> & { id?: string };

export default function UsersClient({
  tenantId, initialUsers,
}: {
  tenantId: string;
  initialUsers: User[];
}) {
  const { T } = useLang();
  const [users, setUsers] = useState(initialUsers);
  const [editing, setEditing] = useState<EditState | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState("");
  const [magicLink, setMagicLink] = useState<{ userId: string; link: string } | null>(null);
  const [csvResult, setCsvResult] = useState<{ created: number; updated: number; errors: string[] } | null>(null);
  const [csvLoading, setCsvLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    const body = {
      display_name: form.get("display_name") as string,
      job_title:    form.get("job_title") as string,
      mobile_phone: form.get("mobile_phone") as string,
      department:   form.get("department") as string,
    };

    try {
      if (editing?.id) {
        const u = await updateUserAction(tenantId, editing.id, body);
        setUsers((prev) => prev.map((x) => (x.id === u.id ? u : x)));
      } else {
        const email = form.get("email") as string;
        const u = await createUserAction(tenantId, { ...body, email });
        setUsers((prev) => [...prev, u]);
      }
      setEditing(null);
      setShowNew(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : T.common.error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(T.users.confirm_delete)) return;
    await deleteUserAction(tenantId, id);
    setUsers((prev) => prev.filter((u) => u.id !== id));
  }

  async function handleCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvLoading(true);
    setCsvResult(null);
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(Boolean);
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
      const rows = lines.slice(1).map((line) => {
        const vals = line.split(",");
        return Object.fromEntries(headers.map((h, i) => [h, vals[i]?.trim() ?? ""]));
      });
      const result = await importUsersCSVAction(tenantId, rows);
      setCsvResult(result);
      window.location.reload();
    } catch (err: unknown) {
      setCsvResult({ created: 0, updated: 0, errors: [err instanceof Error ? err.message : "Import failed"] });
    } finally {
      setCsvLoading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleMagicLink(userId: string) {
    try {
      const { magic_link } = await sendMagicLinkAction(tenantId, userId);
      setMagicLink({ userId, link: magic_link });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to generate link");
    }
  }

  const Form = ({ user }: { user?: User }) => (
    <form onSubmit={handleSave} className="bg-blue-50 border border-brand/20 rounded-xl p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {!user && (
          <div className="col-span-2">
            <label className="block text-xs text-gray-500 mb-1">{T.users.field_email}</label>
            <input name="email" type="email" required className="w-full border rounded px-2 py-1.5 text-sm" />
          </div>
        )}
        <div>
          <label className="block text-xs text-gray-500 mb-1">{T.users.field_display_name}</label>
          <input name="display_name" defaultValue={user?.display_name ?? ""} className="w-full border rounded px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">{T.users.field_job_title}</label>
          <input name="job_title" defaultValue={user?.job_title ?? ""} className="w-full border rounded px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">{T.users.field_mobile_phone}</label>
          <input name="mobile_phone" defaultValue={user?.mobile_phone ?? ""} className="w-full border rounded px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">{T.users.field_department}</label>
          <input name="department" defaultValue={user?.department ?? ""} className="w-full border rounded px-2 py-1.5 text-sm" />
        </div>
      </div>
      {error && <p className="text-red-600 text-xs">{error}</p>}
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={() => { setEditing(null); setShowNew(false); setError(""); }}
          className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 flex items-center gap-1">
          <X size={13} /> {T.common.cancel}
        </button>
        <button type="submit" className="px-3 py-1.5 text-sm bg-brand text-white rounded-lg hover:bg-brand-dark flex items-center gap-1">
          <Check size={13} /> {T.common.save}
        </button>
      </div>
    </form>
  );

  return (
    <div className="space-y-3">
      {/* CSV import result */}
      {csvResult && (
        <div className={`rounded-xl border px-4 py-3 text-sm flex items-start justify-between gap-3 ${
          csvResult.errors.length > 0 ? "bg-amber-50 border-amber-200" : "bg-green-50 border-green-200"
        }`}>
          <div>
            <p className="font-medium">
              {t(T.users.import_result, { created: csvResult.created, updated: csvResult.updated })}
            </p>
            {csvResult.errors.length > 0 && (
              <ul className="mt-1 text-xs text-red-600 space-y-0.5">
                {csvResult.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            )}
          </div>
          <button onClick={() => setCsvResult(null)}><X size={14} /></button>
        </div>
      )}

      {magicLink && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-green-800 mb-1">{T.users.magic_link_title}</p>
              <p className="text-xs text-gray-500 mb-2">{T.users.magic_link_desc}</p>
              <input
                readOnly
                value={magicLink.link}
                className="w-full font-mono text-xs border rounded px-2 py-1.5 bg-white text-gray-700"
                onFocus={(e) => e.currentTarget.select()}
              />
            </div>
            <button onClick={() => setMagicLink(null)} className="text-gray-400 hover:text-gray-600 shrink-0">
              <X size={16} />
            </button>
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(magicLink.link)}
            className="mt-2 text-xs text-green-700 hover:underline"
          >
            {T.users.copy_clipboard}
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">{T.users.col_email}</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">{T.users.col_name}</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">{T.users.col_title}</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">{T.users.col_department}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((u) => (
              <>
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{u.email}</td>
                  <td className="px-4 py-3">{u.display_name ?? <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-3 text-gray-500">{u.job_title ?? <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-3 text-gray-500">{u.department ?? <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => handleMagicLink(u.id)} title={T.users.magic_link_title} className="text-gray-400 hover:text-brand transition-colors">
                        <Link2 size={14} />
                      </button>
                      <button onClick={() => setEditing(u)} className="text-gray-400 hover:text-brand transition-colors">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(u.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
                {editing?.id === u.id && (
                  <tr key={`edit-${u.id}`}>
                    <td colSpan={5} className="px-4 py-3"><Form user={u} /></td>
                  </tr>
                )}
              </>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400 text-sm">{T.users.no_users}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showNew && <Form />}

      {!showNew && !editing && (
        <div className="flex items-center gap-4">
          <button onClick={() => setShowNew(true)} className="flex items-center gap-1.5 text-sm text-brand hover:underline">
            <Plus size={15} /> {T.users.add_user}
          </button>
          <span className="text-gray-300">|</span>
          <label className={`flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand cursor-pointer transition-colors ${csvLoading ? "opacity-50 pointer-events-none" : ""}`}>
            <Upload size={14} />
            {csvLoading ? T.common.loading : T.users.import_csv}
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleCSV}
            />
          </label>
          <a
            href="data:text/csv;charset=utf-8,email%2Cdisplay_name%2Cjob_title%2Cmobile_phone%2Cdepartment%0Aahmet%40firma.com%2CAhmet+Y%C4%B1lmaz%2CSales+Manager%2C%2B90+555+000+00+00%2CSales"
            download="users_template.csv"
            className="text-xs text-gray-400 hover:text-brand transition-colors"
          >
            {T.users.download_template}
          </a>
        </div>
      )}
    </div>
  );
}
