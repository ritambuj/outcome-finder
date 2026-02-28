"use client";

import { useCallback, useRef, useState } from "react";
import { UploadCloud, Table, AlertCircle, CheckCircle } from "lucide-react";
import Papa from "papaparse";

export interface CsvRow {
    call_transcript: string;
    [key: string]: string;
}

interface Props {
    onUpload: (rows: CsvRow[]) => void;
}

export default function UploadCard({ onUpload }: Props) {
    const [dragging, setDragging] = useState(false);
    const [preview, setPreview] = useState<CsvRow[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [filename, setFilename] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const parseFile = useCallback(
        (file: File) => {
            setError(null);
            setFilename(file.name);
            Papa.parse<CsvRow>(file, {
                header: true,
                skipEmptyLines: true,
                complete: (result) => {
                    const rows = result.data;
                    if (!rows[0] || !("call_transcript" in rows[0])) {
                        setError("CSV must have a column named call_transcript");
                        setPreview(null);
                        return;
                    }
                    const cleaned = rows.filter((r) => r.call_transcript?.trim());
                    setPreview(cleaned.slice(0, 5));
                    onUpload(cleaned);
                },
                error: (err) => {
                    setError(`Parse error: ${err.message}`);
                },
            });
        },
        [onUpload]
    );

    const handleDrop = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files[0];
            if (file) parseFile(file);
        },
        [parseFile]
    );

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) parseFile(file);
        },
        [parseFile]
    );

    return (
        <div className="space-y-4">
            <div
                onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center gap-3 px-6 py-10 border-2 border-dashed rounded-xl cursor-pointer transition-all ${dragging
                        ? "border-neutral-500 bg-neutral-50"
                        : "border-neutral-200 hover:border-neutral-400 bg-white"
                    }`}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleChange}
                />
                <UploadCloud
                    className={`w-8 h-8 transition-colors ${dragging ? "text-neutral-600" : "text-neutral-300"}`}
                />
                <div className="text-center">
                    <p className="text-sm font-medium text-neutral-700">
                        {filename ? (
                            <span className="flex items-center gap-1.5 justify-center text-neutral-800">
                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                                {filename}
                            </span>
                        ) : (
                            "Drop your CSV here, or click to browse"
                        )}
                    </p>
                    <p className="text-xs text-neutral-400 mt-1">
                        Requires a <code className="font-mono bg-neutral-100 px-1 rounded">call_transcript</code> column
                    </p>
                </div>
            </div>

            {error && (
                <p className="flex items-center gap-1.5 text-sm text-red-500">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                </p>
            )}

            {preview && (
                <div className="space-y-2">
                    <p className="flex items-center gap-1.5 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        <Table className="w-3 h-3" />
                        Preview (first 5 rows)
                    </p>
                    <div className="border border-neutral-200 rounded-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-neutral-50 border-b border-neutral-200">
                                        <th className="text-left px-4 py-2.5 font-medium text-neutral-500 text-xs">#</th>
                                        <th className="text-left px-4 py-2.5 font-medium text-neutral-500 text-xs">
                                            call_transcript
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {preview.map((row, i) => (
                                        <tr
                                            key={i}
                                            className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50"
                                        >
                                            <td className="px-4 py-2.5 text-neutral-400 text-xs tabular-nums">{i + 1}</td>
                                            <td className="px-4 py-2.5 text-neutral-700 max-w-xs truncate">
                                                {row.call_transcript}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
