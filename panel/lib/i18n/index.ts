import { en, tr } from "./translations";
export type { Lang, Translations } from "./translations";
export { en, tr };

export const dict = { en, tr } as const;

/** Server components: call with the lang from cookies */
export function getT(lang: string) {
  return lang === "tr" ? tr : en;
}

/** Interpolate {key} placeholders */
export function t(str: string, vars?: Record<string, string | number>): string {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}
