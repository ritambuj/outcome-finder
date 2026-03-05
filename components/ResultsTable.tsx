"use client";

import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown, Filter, Download } from "lucide-react";
import { ClassificationResult } from "@/lib/types";
import { CsvRow } from "./UploadCard";
import Papa from "papaparse";

import { FilteredModel } from "@/lib/openrouter";

interface Props {
    results: ClassificationResult[];
    csvRows: CsvRow[];
    selectedModels: FilteredModel[];
}

type SortDir = "asc" | "desc" | null;

export default function ResultsTable({ results, csvRows, selectedModels }: Props) {
    const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
    const [filterOutcome, setFilterOutcome] = useState<string>("all");
    const [sortDir, setSortDir] = useState<SortDir>(null);

    const uniqueOutcomes = useMemo(() => {
        const set = new Set<string>();
        for (const r of results) {
            for (const m of Object.values(r.models)) {
                set.add(m.outcome);
            }
        }
        return Array.from(set).sort();
    }, [results]);

    const filtered = useMemo(() => {
        let rows = results.map((r, i) => {
            const keys = Object.keys(r.models);
            const avgConfidence = keys.length ? Object.values(r.models).reduce((s, m) => s + m.confidence, 0) / keys.length : 0;
            return { ...r, originalIndex: i, avgConfidence };
        });

        if (filterOutcome !== "all") {
            rows = rows.filter((r) => Object.values(r.models).some(m => m.outcome === filterOutcome));
        }

        if (sortDir === "asc") rows = [...rows].sort((a, b) => a.avgConfidence - b.avgConfidence);
        if (sortDir === "desc") rows = [...rows].sort((a, b) => b.avgConfidence - a.avgConfidence);
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

    const handleExport = () => {
        const dataToExport = filtered.map((row) => {
            const originalRow = csvRows[row.originalIndex];
            const resultObj: Record<string, string | number> = { ...originalRow };
            for (const m of selectedModels) {
                const res = row.models[m.id];
                const prefix = selectedModels.length === 1 ? "" : `${m.name} `;
                if (res) {
                    resultObj[`${prefix}Outcome`] = res.outcome;
                    resultObj[`${prefix}Confidence`] = res.confidence;
                    if (res.error) resultObj[`${prefix}Error`] = res.error;
                }
            }
            return resultObj;
        });

        const csv = Papa.unparse(dataToExport);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "classified_outcomes.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
                <div className="flex items-center gap-3 ml-auto">
                    <p className="text-xs text-neutral-400">
                        {filtered.length} of {results.length} rows
                    </p>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:border-neutral-300 transition-colors shadow-sm"
                    >
                        <Download className="w-3.5 h-3.5" />
                        Export CSV
                    </button>
                </div>
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
                                {selectedModels.map(m => (
                                    <th key={m.id} className="text-left px-4 py-3 font-medium text-neutral-500 text-xs border-l border-neutral-200 bg-neutral-100/50">
                                        <div className="truncate max-w-[150px]" title={m.name}>{m.name}</div>
                                    </th>
                                ))}
                                <th className="text-left px-4 py-3 font-medium text-neutral-500 text-xs border-l border-neutral-200">
                                    <button
                                        type="button"
                                        onClick={cycleSort}
                                        className="flex items-center gap-1 hover:text-neutral-800 transition-colors whitespace-nowrap"
                                    >
                                        Avg Confidence
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
                                            <div className="flex items-center gap-1.5">
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
                                        {selectedModels.map(m => {
                                            const modRes = row.models[m.id];
                                            if (!modRes) return <td key={m.id} className="px-4 py-3 border-l text-xs text-neutral-400 border-neutral-100">Pending</td>;
                                            return (
                                                <td key={m.id} className="px-4 py-3 border-l border-neutral-100">
                                                    <div className="flex flex-col items-start gap-1.5">
                                                        {modRes.error ? (
                                                            <span className="text-xs text-red-500 font-medium" title={modRes.error}>Error</span>
                                                        ) : (
                                                            <>
                                                                <span className="text-xs font-medium text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded-full whitespace-nowrap truncate max-w-[150px]" title={modRes.outcome}>{modRes.outcome}</span>
                                                                <span className={`text-xs font-semibold tabular-nums px-2 py-0.5 rounded-full ${confidenceColor(modRes.confidence)}`}>{modRes.confidence}%</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                        <td className="px-4 py-3 border-l border-neutral-100">
                                            <span
                                                className={`text-xs font-semibold tabular-nums px-2 py-0.5 rounded-full ${confidenceColor(row.avgConfidence)}`}
                                            >
                                                {row.avgConfidence.toFixed(0)}%
                                            </span>
                                        </td>
                                    </tr>
                                    {expandedIdx === i && (
                                        <tr key={`${i}-expanded`} className="bg-neutral-50 border-b border-neutral-100">
                                            <td />
                                            <td colSpan={2 + selectedModels.length + 1} className="px-4 py-3">
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
