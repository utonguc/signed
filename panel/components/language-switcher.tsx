"use client";

import { useRouter } from "next/navigation";
import { setLangAction } from "@/lib/i18n/actions";
import { useLang } from "@/lib/i18n/context";
import type { Lang } from "@/lib/i18n";

export default function LanguageSwitcher({ className }: { className?: string }) {
  const { lang } = useLang();
  const router = useRouter();

  async function toggle() {
    const next: Lang = lang === "tr" ? "en" : "tr";
    await setLangAction(next);
    router.refresh();
  }

  return (
    <button
      onClick={toggle}
      className={`flex items-center gap-1 text-xs font-medium transition-colors hover:text-brand ${className ?? "text-gray-500"}`}
      title={lang === "tr" ? "Switch to English" : "Türkçe'ye geç"}
    >
      <span className={lang === "tr" ? "opacity-100" : "opacity-40"}>TR</span>
      <span className="text-gray-300">/</span>
      <span className={lang === "en" ? "opacity-100" : "opacity-40"}>EN</span>
    </button>
  );
}
