import { cookies } from "next/headers";
import { getTemplate, getTenant } from "@/lib/api";
import TemplateEditor from "./template-editor";
import { getT } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";

export default async function TemplateEditorPage({
  params,
}: {
  params: Promise<{ id: string; tid: string }>;
}) {
  const { id, tid } = await params;
  const jar = await cookies();
  const token = jar.get("token")?.value ?? "";
  const lang = (jar.get("lang")?.value ?? "tr") as Lang;
  const T = getT(lang);

  const [tenant, template] = await Promise.all([
    getTenant(token, id),
    getTemplate(token, id, tid),
  ]);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <p className="text-xs text-gray-400">{tenant.name} / {T.templates.title}</p>
          <h1 className="text-xl font-bold">{template.name}</h1>
        </div>
      </div>
      <TemplateEditor tenantId={id} template={template} />
    </div>
  );
}
