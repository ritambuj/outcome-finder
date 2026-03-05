"use client";

import { ClassificationResult } from "@/lib/types";
import { FilteredModel } from "@/lib/openrouter";
import { formatCost, formatNumber, estimateTotalCost } from "@/lib/cost";
import { Phone, PieChart, TrendingUp, Coins, Hash } from "lucide-react";

interface Props {
    rows: string[];
    results: ClassificationResult[];
    models: FilteredModel[];
}

interface MetricCard {
    label: string;
    value: string;
    sub?: string;
    icon: React.ReactNode;
}

export default function MetricsBar({ rows, results, models }: Props) {
    const totalCalls = rows.length;

    // Outcome distribution
    const distribution: Record<string, number> = {};
    let totalConf = 0;
    let confCount = 0;

    for (const r of results) {
        for (const m of Object.values(r.models)) {
            distribution[m.outcome] = (distribution[m.outcome] || 0) + 1;
            totalConf += m.confidence;
            confCount++;
        }
    }
    const topOutcome =
        Object.entries(distribution).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

    // Avg confidence
    const avgConf = confCount > 0 ? Math.round(totalConf / confCount) : 0;

    // Cost estimate
    const costEst = models.reduce(
        (acc, m) => {
            const est = estimateTotalCost(rows, m);
            return {
                totalInputTokens: acc.totalInputTokens + est.totalInputTokens,
                totalOutputTokens: acc.totalOutputTokens + est.totalOutputTokens,
                totalCostUSD: acc.totalCostUSD + est.totalCostUSD,
            };
        },
        { totalInputTokens: 0, totalOutputTokens: 0, totalCostUSD: 0 }
    );

    const cards: MetricCard[] = [
        {
            label: "Total Calls",
            value: totalCalls.toString(),
            icon: <Phone className="w-4 h-4" />,
        },
        {
            label: "Top Outcome",
            value: topOutcome,
            sub: topOutcome !== "—" ? `${distribution[topOutcome]} calls` : undefined,
            icon: <PieChart className="w-4 h-4" />,
        },
        {
            label: "Avg Confidence",
            value: results.length > 0 ? `${avgConf}%` : "—",
            icon: <TrendingUp className="w-4 h-4" />,
        },
        {
            label: "Est. Tokens",
            value: formatNumber(costEst.totalInputTokens + costEst.totalOutputTokens),
            sub: `${formatNumber(costEst.totalInputTokens)} in · ${formatNumber(costEst.totalOutputTokens)} out`,
            icon: <Hash className="w-4 h-4" />,
        },
        {
            label: "Est. Cost",
            value: formatCost(costEst.totalCostUSD),
            icon: <Coins className="w-4 h-4" />,
        },
    ];

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {cards.map((card) => (
                <div
                    key={card.label}
                    className="flex flex-col gap-1 p-4 bg-white border border-neutral-200 rounded-xl"
                >
                    <div className="flex items-center gap-1.5 text-neutral-400 text-xs font-medium uppercase tracking-wider">
                        {card.icon}
                        {card.label}
                    </div>
                    <p className="text-xl font-semibold text-neutral-900 truncate">{card.value}</p>
                    {card.sub && <p className="text-xs text-neutral-400 truncate">{card.sub}</p>}
                </div>
            ))}
        </div>
    );
}
