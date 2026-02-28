"use client";

import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown, Filter } from "lucide-react";
import { ClassificationResult } from "@/lib/types";

interface Props {
    results: ClassificationResult[];
}

type SortDir = "asc" | "desc" | null;

export default function ResultsTable({ results }: Props) {
    const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
    const [filterOutcome, setFilterOutcome] = useState<string>("all");
    const [sortDir, setSortDir] = useState<SortDir>(null);

    const uniqueOutcomes = useMemo(() => {
        const set = new Set(results.map((r) => r.outcome));
        return Array.from(set).sort();
    }, [results]);

    const filtered = useMemo(() => {
        let rows = results;
        if (filterOutcome !== "all") rows = rows.filter((r) => r.outcome === filterOutcome);
        if (sortDir === "asc") rows = [...rows].sort((a, b) => a.confidence - b.confidence);
        if (sortDir === "desc") rows = [...rows].sort((a, b) => b.confidence - a.confidence);
        return rows;
    }, [results, filterOutcome, sortDir]);

    const cycleSort = () => {
        setSortDir((d) => (d === null ? "desc" : d === "desc" ? "asc" : null));
    };

    const SortIcon = sortDir === "desc" ? ChevronDown : sortDir === "asc" ? ChevronUp : ChevronsUpDown;

    const confidenceColor = (c: number) => {
        if (c >= 80) return "text-emerald-600 bg-emerald-50";
        if (c >= 50) return "text-amber-600 bg-amber-50";
        return "text-red-500 bg-red-50";
    };

    return (
        <div className="space-y-4">
            {/* Controls */}
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                    <Filter className="w-3.5 h-3.5" />
                    <select
                        value={filterOutcome}
                        onChange={(e) => setFilterOutcome(e.target.value)}
                        className="bg-white border border-neutral-200 rounded-lg px-2 py-1.5 text-xs text-neutral-700 outline-none focus:border-neutral-400"
                    >
                        <option value="all">All outcomes</option>
                        {uniqueOutcomes.map((o) => (
                            <option key={o} value={o}>
                                {o}
                            </option>
                        ))}
                    </select>
                </div>
                <p className="text-xs text-neutral-400 ml-auto">
                    {filtered.length} of {results.length} rows
                </p>
            </div>

            {/* Table */}
            <div className="border border-neutral-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-neutral-50 border-b border-neutral-200">
                                <th className="text-left px-4 py-3 font-medium text-neutral-500 text-xs">#</th>
                                <th className="text-left px-4 py-3 font-medium text-neutral-500 text-xs">
                                    Transcript
                                </th>
                                <th className="text-left px-4 py-3 font-medium text-neutral-500 text-xs">
                                    Outcome
                                </th>
                                <th className="text-left px-4 py-3 font-medium text-neutral-500 text-xs">
                                    <button
                                        type="button"
                                        onClick={cycleSort}
                                        className="flex items-center gap-1 hover:text-neutral-800 transition-colors"
                                    >
                                        Confidence
                                        <SortIcon className="w-3.5 h-3.5" />
                                    </button>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((row, i) => (
                                <>
                                    <tr
                                        key={i}
                                        onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
                                        className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50 cursor-pointer group"
                                    >
                                        <td className="px-4 py-3 text-neutral-400 text-xs tabular-nums">{i + 1}</td>
                                        <td className="px-4 py-3 max-w-xs">
                                            <div className={`flex items-center gap-1.5 ${expandedIdx === i ? "" : ""}`}>
                                                {expandedIdx === i ? (
                                                    <ChevronUp className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                                                ) : (
                                                    <ChevronDown className="w-3.5 h-3.5 text-neutral-400 shrink-0 opacity-0 group-hover:opacity-100" />
                                                )}
                                                <span className={`text-neutral-700 ${expandedIdx !== i ? "truncate" : ""}`}>
                                                    {row.transcript}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {row.error ? (
                                                <span className="text-xs text-red-500 font-medium">Error</span>
                                            ) : (
                                                <span className="text-xs font-medium text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded-full">
                                                    {row.outcome}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {row.error ? (
                                                <span className="text-xs text-neutral-400">{row.error}</span>
                                            ) : (
                                                <span
                                                    className={`text-xs font-semibold tabular-nums px-2 py-0.5 rounded-full ${confidenceColor(row.confidence)}`}
                                                >
                                                    {row.confidence}%
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                    {expandedIdx === i && (
                                        <tr key={`${i}-expanded`} className="bg-neutral-50 border-b border-neutral-100">
                                            <td />
                                            <td colSpan={3} className="px-4 py-3">
                                                <p className="text-sm text-neutral-600 whitespace-pre-wrap leading-relaxed">
                                                    {row.transcript}
                                                </p>
                                            </td>
                                        </tr>
                                    )}
                                </>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
