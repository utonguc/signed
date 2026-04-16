import { cookies } from "next/headers";
import Link from "next/link";
import { getTemplates, getTenant } from "@/lib/api";
import NewTemplateForm from "./new-template-form";
import { getT } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";

export default async function TemplatesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const jar = await cookies();
  const token = jar.get("token")?.value ?? "";
  const lang = (jar.get("lang")?.value ?? "tr") as Lang;
  const T = getT(lang);

  const [tenant, templates] = await Promise.all([
    getTenant(token, id),
    getTemplates(token, id),
  ]);

  return (
    <div className="max-w-4xl">
      <div className="mb-1 text-sm text-gray-400">{tenant.name}</div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{T.templates.title}</h1>
        <NewTemplateForm tenantId={id} />
      </div>

      {templates.length === 0 ? (
        <p className="text-gray-500 text-sm">{T.templates.no_templates}</p>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">{T.templates.col_name}</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">{T.templates.col_default}</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">{T.templates.col_created}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {templates.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium">{t.name}</td>
                  <td className="px-4 py-3">
                    {t.is_default && (
                      <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">
                        {T.common.default}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(t.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/tenants/${id}/templates/${t.id}`}
                      className="text-brand hover:underline text-xs font-medium"
                    >
                      {T.templates.edit_link}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
