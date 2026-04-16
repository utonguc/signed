import { cookies } from "next/headers";
import Sidebar from "@/components/layout/sidebar";
import Footer from "@/components/footer";
import { LangProvider } from "@/lib/i18n/context";
import type { Lang } from "@/lib/i18n";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const lang = ((await cookies()).get("lang")?.value ?? "tr") as Lang;
  return (
    <LangProvider lang={lang}>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-auto">
          <main className="flex-1 p-8">{children}</main>
          <Footer />
        </div>
      </div>
    </LangProvider>
  );
}
