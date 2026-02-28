"use client";

import { useState } from "react";
import { Plus, Trash2, Wand2, Loader2, AlertCircle } from "lucide-react";

export interface Outcome {
    name: string;
    definition: string;
}

interface Props {
    outcomes: Outcome[];
    onChange: (outcomes: Outcome[]) => void;
    onAutoGenerate: () => Promise<void>;
    generating: boolean;
    generateError: string | null;
    disabled?: boolean;
}

export default function OutcomeEditor({
    outcomes,
    onChange,
    onAutoGenerate,
    generating,
    generateError,
    disabled,
}: Props) {
    const [newName, setNewName] = useState("");
    const [newDef, setNewDef] = useState("");

    const update = (index: number, field: keyof Outcome, value: string) => {
        const updated = outcomes.map((o, i) =>
            i === index ? { ...o, [field]: value } : o
        );
        onChange(updated);
    };

    const remove = (index: number) => {
        onChange(outcomes.filter((_, i) => i !== index));
    };

    const addOutcome = () => {
        if (!newName.trim()) return;
        onChange([...outcomes, { name: newName.trim(), definition: newDef.trim() }]);
        setNewName("");
        setNewDef("");
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-neutral-700">
                        Outcomes{" "}
                        <span className="text-neutral-400 font-normal">({outcomes.length})</span>
                    </p>
                    <p className="text-xs text-neutral-400 mt-0.5">
                        Define manually or auto-generate from your transcripts
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onAutoGenerate}
                    disabled={generating || disabled}
                    className="flex items-center gap-1.5 px-3 py-2 bg-neutral-900 text-white text-xs font-medium rounded-lg hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {generating ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                        <Wand2 className="w-3.5 h-3.5" />
                    )}
                    {generating ? "Generating…" : "Auto-generate"}
                </button>
            </div>

            {generateError && (
                <p className="flex items-center gap-1.5 text-sm text-red-500">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {generateError}
                </p>
            )}

            {outcomes.length > 0 && (
                <div className="space-y-2">
                    {outcomes.map((outcome, i) => (
                        <div
                            key={i}
                            className="flex items-start gap-2 p-3 bg-neutral-50 border border-neutral-200 rounded-xl group"
                        >
                            <div className="flex-1 space-y-1.5 min-w-0">
                                <input
                                    value={outcome.name}
                                    onChange={(e) => update(i, "name", e.target.value)}
                                    placeholder="Outcome name"
                                    className="w-full text-sm font-medium bg-transparent border-0 outline-none text-neutral-800 placeholder-neutral-300"
                                />
                                <input
                                    value={outcome.definition}
                                    onChange={(e) => update(i, "definition", e.target.value)}
                                    placeholder="Definition (optional)"
                                    className="w-full text-xs bg-transparent border-0 outline-none text-neutral-500 placeholder-neutral-300"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => remove(i)}
                                className="p-1 opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-red-500 transition-all rounded"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Add manually */}
            <div className="flex items-center gap-2">
                <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addOutcome()}
                    placeholder="New outcome name…"
                    className="flex-1 px-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg outline-none focus:border-neutral-400 placeholder-neutral-300"
                />
                <input
                    type="text"
                    value={newDef}
                    onChange={(e) => setNewDef(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addOutcome()}
                    placeholder="Definition…"
                    className="flex-1 px-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg outline-none focus:border-neutral-400 placeholder-neutral-300"
                />
                <button
                    type="button"
                    onClick={addOutcome}
                    disabled={!newName.trim()}
                    className="flex items-center gap-1 px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-700 hover:border-neutral-400 transition-colors disabled:opacity-40"
                >
                    <Plus className="w-4 h-4" />
                    Add
                </button>
            </div>
        </div>
    );
}
