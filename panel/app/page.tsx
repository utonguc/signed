import { cookies } from "next/headers";
import Link from "next/link";
import Footer from "@/components/footer";
import LanguageSwitcher from "@/components/language-switcher";
import { LangProvider } from "@/lib/i18n/context";
import { getT } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";

function FeatureCard({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{body}</p>
    </div>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center text-sm font-bold mt-0.5">
        {n}
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-500 leading-relaxed">{body}</p>
      </div>
    </div>
  );
}

export default async function LandingPage() {
  const lang = ((await cookies()).get("lang")?.value ?? "tr") as Lang;
  const T = getT(lang);

  return (
    <LangProvider lang={lang}>
      <div className="min-h-screen flex flex-col bg-white">

        {/* Nav */}
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-brand">✦</span>
              <span className="font-bold text-gray-900 text-lg tracking-tight">Signed</span>
              <span className="hidden sm:inline-flex items-center ml-2 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
                by xshield
              </span>
            </div>
            <nav className="flex items-center gap-6">
              <a href="#features" className="text-sm text-gray-500 hover:text-gray-900 transition-colors hidden md:block">
                {T.landing.nav_features}
              </a>
              <a href="#how-it-works" className="text-sm text-gray-500 hover:text-gray-900 transition-colors hidden md:block">
                {T.landing.nav_how_it_works}
              </a>
              <LanguageSwitcher />
              <Link
                href="/login"
                className="text-sm font-medium bg-brand text-white px-4 py-2 rounded-lg hover:bg-brand-dark transition-colors"
              >
                {T.landing.nav_sign_in}
              </Link>
            </nav>
          </div>
        </header>

        {/* Hero */}
        <section className="flex flex-col items-center justify-center text-center px-6 py-28 bg-gradient-to-b from-blue-50/70 via-white to-white">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-brand bg-brand/10 px-3 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 bg-brand rounded-full animate-pulse" />
            {T.landing.badge}
          </div>

          <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 tracking-tight leading-[1.1] max-w-3xl mb-6">
            {T.landing.hero_title_1}{" "}
            <span className="text-brand">{T.landing.hero_title_highlight}</span>{" "}
            {T.landing.hero_title_2}
          </h1>

          <p className="text-lg text-gray-500 max-w-xl mb-10 leading-relaxed">
            {T.landing.hero_subtitle}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mb-16">
            <Link
              href="/login"
              className="bg-brand text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-brand-dark transition-colors shadow-lg shadow-brand/20"
            >
              {T.landing.cta_primary}
            </Link>
            <a
              href="#how-it-works"
              className="border border-gray-200 text-gray-700 font-medium px-8 py-3.5 rounded-xl hover:bg-gray-50 transition-colors"
            >
              {T.landing.cta_secondary}
            </a>
          </div>

          {/* Mock email preview */}
          <div className="relative w-full max-w-lg bg-white rounded-2xl border shadow-2xl shadow-gray-200 p-6 text-left">
            <div className="absolute -top-3 -right-3 bg-green-500 text-white text-xs px-2.5 py-1 rounded-full font-semibold shadow">
              {T.landing.preview_badge}
            </div>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              Hi Sarah,<br /><br />
              Please find the proposal attached. Let me know if you have any questions.<br /><br />
              Best regards,
            </p>
            <div className="border-t-2 border-brand pt-3">
              <p className="font-bold text-gray-900 text-sm">Ahmet Yılmaz</p>
              <p className="text-xs text-gray-500">Sales Manager · Enterprise Division</p>
              <p className="text-xs text-gray-400 mt-0.5">+90 212 000 00 00 · ahmet@firma.com</p>
              <p className="text-xs text-brand mt-0.5">www.firma.com</p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-24 px-6 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">{T.landing.features_title}</h2>
              <p className="text-gray-500 max-w-lg mx-auto text-sm">{T.landing.features_subtitle}</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <FeatureCard icon="🎨" title={T.landing.feature_1_title} body={T.landing.feature_1_desc} />
              <FeatureCard icon="⚡" title={T.landing.feature_2_title} body={T.landing.feature_2_desc} />
              <FeatureCard icon="🎯" title={T.landing.feature_3_title} body={T.landing.feature_3_desc} />
              <FeatureCard icon="📊" title={T.landing.feature_4_title} body={T.landing.feature_4_desc} />
              <FeatureCard icon="🏢" title={T.landing.feature_5_title} body={T.landing.feature_5_desc} />
              <FeatureCard icon="⚖️" title={T.landing.feature_6_title} body={T.landing.feature_6_desc} />
              <FeatureCard icon="🔗" title={T.landing.feature_7_title} body={T.landing.feature_7_desc} />
              <FeatureCard icon="🔌" title={T.landing.feature_8_title} body={T.landing.feature_8_desc} />
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="py-24 px-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">{T.landing.how_title}</h2>
              <p className="text-gray-500 text-sm max-w-md mx-auto">{T.landing.how_subtitle}</p>
            </div>
            <div className="space-y-8">
              <Step n={1} title={T.landing.step_1_title} body={T.landing.step_1_desc} />
              <Step n={2} title={T.landing.step_2_title} body={T.landing.step_2_desc} />
              <Step n={3} title={T.landing.step_3_title} body={T.landing.step_3_desc} />
              <Step n={4} title={T.landing.step_4_title} body={T.landing.step_4_desc} />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-6 bg-brand">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-4">{T.landing.cta_section_title}</h2>
            <p className="text-blue-100 mb-8 text-sm">{T.landing.cta_section_subtitle}</p>
            <Link
              href="/login"
              className="inline-block bg-white text-brand font-bold px-10 py-3.5 rounded-xl hover:bg-gray-50 transition-colors shadow-lg"
            >
              {T.landing.cta_section_btn}
            </Link>
          </div>
        </section>

        <Footer />
      </div>
    </LangProvider>
  );
}
