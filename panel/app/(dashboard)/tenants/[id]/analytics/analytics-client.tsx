"use client";

import { useState } from "react";
import { getAnalyticsAction } from "../actions";
import { Analytics } from "@/lib/types";
import { useLang } from "@/lib/i18n/context";
import { t } from "@/lib/i18n";

const PERIOD_OPTIONS = [7, 14, 30, 90];

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white border rounded-xl p-4">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function AnalyticsClient({
  tenantId, initialData,
}: {
  tenantId: string;
  initialData: Analytics;
}) {
  const { T } = useLang();
  const [data, setData] = useState(initialData);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);

  async function changePeriod(d: number) {
    setDays(d);
    setLoading(true);
    try {
      const fresh = await getAnalyticsAction(tenantId, d);
      setData(fresh);
    } finally {
      setLoading(false);
    }
  }

  const stars = (n: number) => "★".repeat(n) + "☆".repeat(5 - n);

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {PERIOD_OPTIONS.map((d) => (
          <button
            key={d}
            onClick={() => changePeriod(d)}
            className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${days === d ? "bg-brand text-white border-brand" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
          >
            {d}d
          </button>
        ))}
      </div>

      <div className={`grid grid-cols-2 gap-3 transition-opacity ${loading ? "opacity-50" : ""}`}>
        <StatCard label={T.analytics.stat_sent} value={data.total_sent} />
        <StatCard
          label={T.analytics.stat_opened}
          value={data.total_opened}
          sub={t(T.analytics.open_rate_sub, { n: data.open_rate })}
        />
        <StatCard label={T.analytics.stat_csat} value={data.total_csat_responses} />
        <StatCard
          label={T.analytics.stat_avg_csat}
          value={data.avg_csat_score != null ? `${data.avg_csat_score} / 5` : "—"}
        />
      </div>

      {data.total_csat_responses > 0 && (
        <div className="bg-white border rounded-xl p-5">
          <h2 className="font-semibold text-sm mb-4">{T.analytics.csat_distribution}</h2>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((score) => {
              const count = data.csat_distribution[String(score)] ?? 0;
              const pct = data.total_csat_responses
                ? Math.round((count / data.total_csat_responses) * 100)
                : 0;
              return (
                <div key={score} className="flex items-center gap-3">
                  <span className="w-20 text-sm text-gray-500 shrink-0">{stars(score)}</span>
                  <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-brand rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-10 text-right text-xs text-gray-400">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
