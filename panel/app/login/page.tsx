import { Suspense } from "react";
import { cookies } from "next/headers";
import { LangProvider } from "@/lib/i18n/context";
import type { Lang } from "@/lib/i18n";
import LoginForm from "./login-form";

export default async function LoginPage() {
  const lang = ((await cookies()).get("lang")?.value ?? "tr") as Lang;
  return (
    <LangProvider lang={lang}>
      <Suspense>
        <LoginForm />
      </Suspense>
    </LangProvider>
  );
}
