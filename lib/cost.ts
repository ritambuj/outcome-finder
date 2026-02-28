import { FilteredModel } from "./openrouter";

export function estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
}

export interface CostEstimate {
    inputTokens: number;
    outputTokens: number;
    totalCostUSD: number;
}

// Estimate cost for a single classification call
export function estimateCallCost(
    transcript: string,
    model: FilteredModel | null
): CostEstimate {
    // Rough: prompt overhead ~200 tokens + transcript tokens
    const inputTokens = 200 + estimateTokens(transcript);
    // Classification output is always small JSON
    const outputTokens = 30;

    let totalCostUSD = 0;
    if (model) {
        const inputCost = model.inputPricePerMillion
            ? (inputTokens / 1_000_000) * model.inputPricePerMillion
            : 0;
        const outputCost = model.outputPricePerMillion
            ? (outputTokens / 1_000_000) * model.outputPricePerMillion
            : 0;
        totalCostUSD = inputCost + outputCost;
    }

    return { inputTokens, outputTokens, totalCostUSD };
}

export interface TotalCostEstimate {
    totalInputTokens: number;
    totalOutputTokens: number;
    totalCostUSD: number;
}

export function estimateTotalCost(
    transcripts: string[],
    model: FilteredModel | null
): TotalCostEstimate {
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalCostUSD = 0;

    for (const transcript of transcripts) {
        const est = estimateCallCost(transcript, model);
        totalInputTokens += est.inputTokens;
        totalOutputTokens += est.outputTokens;
        totalCostUSD += est.totalCostUSD;
    }

    return { totalInputTokens, totalOutputTokens, totalCostUSD };
}

export function formatCost(usd: number): string {
    if (usd === 0) return "N/A";
    if (usd < 0.001) return `<$0.001`;
    return `$${usd.toFixed(4)}`;
}

export function formatNumber(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toString();
}
