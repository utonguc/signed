"use client";

import { createContext, useContext } from "react";
import { en, tr, type Lang, type Translations } from "./translations";

const LangContext = createContext<{ lang: Lang; T: Translations }>({
  lang: "tr",
  T: tr,
});

export function LangProvider({
  lang,
  children,
}: {
  lang: Lang;
  children: React.ReactNode;
}) {
  const T = lang === "tr" ? tr : en;
  return (
    <LangContext.Provider value={{ lang, T }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
