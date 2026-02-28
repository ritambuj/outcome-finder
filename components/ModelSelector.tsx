"use client";

import { useState, useMemo } from "react";
import { FilteredModel } from "@/lib/openrouter";
import { ChevronDown, Cpu, AlertCircle } from "lucide-react";

interface Props {
    models: FilteredModel[];
    selected: FilteredModel | null;
    onSelect: (model: FilteredModel) => void;
    loading: boolean;
    error: string | null;
}

export default function ModelSelector({ models, selected, onSelect, loading, error }: Props) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");

    const filtered = useMemo(() => {
        if (!search.trim()) return models;
        const q = search.toLowerCase();
        return models.filter(
            (m) =>
                m.name.toLowerCase().includes(q) ||
                m.provider.toLowerCase().includes(q) ||
                m.id.toLowerCase().includes(q)
        );
    }, [models, search]);

    const formatPrice = (v: number | null) =>
        v === null ? "?" : v < 0.01 ? `$${v.toFixed(4)}/1M` : `$${v.toFixed(2)}/1M`;

    return (
        <div className="relative">
            <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">
                Model
            </label>
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                disabled={loading}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-white border border-neutral-200 rounded-xl text-sm text-neutral-800 hover:border-neutral-400 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
                <div className="flex items-center gap-2 min-w-0">
                    <Cpu className="w-4 h-4 text-neutral-400 shrink-0" />
                    {loading ? (
                        <span className="text-neutral-400 animate-pulse">Loading models…</span>
                    ) : selected ? (
                        <span className="truncate font-medium">{selected.name}</span>
                    ) : (
                        <span className="text-neutral-400">Select a model</span>
                    )}
                </div>
                <ChevronDown
                    className={`w-4 h-4 text-neutral-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
                />
            </button>

            {error && (
                <p className="flex items-center gap-1 text-xs text-red-500 mt-1">
                    <AlertCircle className="w-3 h-3" />
                    {error}
                </p>
            )}

            {open && !loading && (
                <div className="absolute z-50 top-full mt-2 w-full bg-white border border-neutral-200 rounded-xl shadow-xl overflow-hidden">
                    <div className="p-2 border-b border-neutral-100">
                        <input
                            type="text"
                            placeholder="Search models…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            autoFocus
                            className="w-full px-3 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-lg outline-none focus:border-neutral-400 placeholder-neutral-400"
                        />
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                        {filtered.length === 0 ? (
                            <div className="px-4 py-6 text-center text-sm text-neutral-400">
                                No models found
                            </div>
                        ) : (
                            filtered.map((model) => (
                                <button
                                    key={model.id}
                                    type="button"
                                    onClick={() => {
                                        onSelect(model);
                                        setOpen(false);
                                        setSearch("");
                                    }}
                                    className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-neutral-50 transition-colors ${selected?.id === model.id ? "bg-neutral-50" : ""
                                        }`}
                                >
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-neutral-800 truncate">{model.name}</p>
                                        <p className="text-xs text-neutral-400 capitalize">{model.provider}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-xs font-mono text-neutral-500">
                                            {formatPrice(model.inputPricePerMillion)} in
                                        </p>
                                        <p className="text-xs font-mono text-neutral-400">
                                            {formatPrice(model.outputPricePerMillion)} out
                                        </p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
