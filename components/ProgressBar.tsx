"use client";

interface Props {
    current: number;
    total: number;
}

export default function ProgressBar({ current, total }: Props) {
    const pct = total > 0 ? Math.round((current / total) * 100) : 0;

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-neutral-500">
                <span>
                    Processing{" "}
                    <span className="font-medium tabular-nums text-neutral-700">
                        {current} / {total}
                    </span>
                </span>
                <span className="font-medium tabular-nums text-neutral-700">{pct}%</span>
            </div>
            <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                <div
                    className="h-full bg-neutral-900 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}
