"use client";

import { useEffect, useState, useCallback } from "react";
import { FilteredModel } from "@/lib/openrouter";
import { ClassificationResult, Outcome } from "@/lib/types";
import { CsvRow } from "@/components/UploadCard";

import UploadCard from "@/components/UploadCard";
import OutcomeEditor from "@/components/OutcomeEditor";
import ModelSelector from "@/components/ModelSelector";
import ProgressBar from "@/components/ProgressBar";
import MetricsBar from "@/components/MetricsBar";
import ResultsTable from "@/components/ResultsTable";
import { Loader2, Play, RotateCcw, ChevronRight } from "lucide-react";

type Step = "upload" | "configure" | "results";

export default function Home() {
  // Models
  const [models, setModels] = useState<FilteredModel[]>([]);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [selectedModels, setSelectedModels] = useState<FilteredModel[]>([]);

  // CSV
  const [csvRows, setCsvRows] = useState<CsvRow[]>([]);

  // Outcomes
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Classification
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ClassificationResult[]>([]);
  const [runError, setRunError] = useState<string | null>(null);

  // UI
  const [step, setStep] = useState<Step>("upload");

  // Load models on mount
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/models");
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setModels(data.models || []);
        // Pre-select a good default (first model)
        if (data.models?.length > 0) {
          setSelectedModels([data.models[0]]);
        }
      } catch (e: unknown) {
        setModelsError(e instanceof Error ? e.message : "Failed to load models");
      } finally {
        setModelsLoading(false);
      }
    }
    load();
  }, []);

  const handleUpload = useCallback((rows: CsvRow[]) => {
    setCsvRows(rows);
    setResults([]);
    setProgress(0);
  }, []);

  const handleAutoGenerate = useCallback(async () => {
    if (selectedModels.length === 0) {
      setGenerateError("Please select at least one model first");
      return;
    }
    setGenerating(true);
    setGenerateError(null);
    try {
      const transcripts = csvRows.slice(0, 20).map((r) => r.call_transcript);
      const res = await fetch("/api/generate-outcomes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcripts, model: selectedModels[0].id }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setOutcomes(data.outcomes || []);
    } catch (e: unknown) {
      setGenerateError(e instanceof Error ? e.message : "Failed to generate outcomes");
    } finally {
      setGenerating(false);
    }
  }, [csvRows, selectedModels]);

  const handleRun = useCallback(async () => {
    if (selectedModels.length === 0 || csvRows.length === 0 || outcomes.length === 0) return;

    setRunning(true);
    setRunError(null);
    setResults([]);
    setProgress(0);
    setStep("results");

    const newResults: ClassificationResult[] = [];

    for (let i = 0; i < csvRows.length; i++) {
      const transcript = csvRows[i].call_transcript;
      const rowResult: ClassificationResult = { transcript, models: {} };

      await Promise.all(
        selectedModels.map(async (model) => {
          try {
            const res = await fetch("/api/classify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ transcript, outcomes, model: model.id }),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            rowResult.models[model.id] = { outcome: data.outcome, confidence: data.confidence };
          } catch (e: unknown) {
            rowResult.models[model.id] = {
              outcome: "Error",
              confidence: 0,
              error: e instanceof Error ? e.message : "Failed",
            };
          }
        })
      );
      newResults.push(rowResult);
      setResults([...newResults]);
      setProgress(i + 1);
    }

    setRunning(false);
  }, [csvRows, outcomes, selectedModels]);

  const handleReset = () => {
    setCsvRows([]);
    setOutcomes([]);
    setResults([]);
    setProgress(0);
    setRunning(false);
    setGenerateError(null);
    setRunError(null);
    setStep("upload");
  };

  const canConfigure = csvRows.length > 0;
  const canRun = csvRows.length > 0 && outcomes.length > 0 && selectedModels.length > 0 && !running;

  return (
    <div className="min-h-screen bg-[#f9f9f8]">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-neutral-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-neutral-900 flex items-center justify-center">
              <span className="text-white text-xs font-bold">OC</span>
            </div>
            <div>
              <h1 className="text-sm font-semibold text-neutral-900 leading-none">
                Outcome Finder
              </h1>
              <p className="text-xs text-neutral-400 mt-0.5">Call transcript classifier</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {csvRows.length > 0 && (
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-600 border border-neutral-200 rounded-lg hover:border-neutral-400 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Step indicator */}
        <div className="flex items-center gap-2 text-xs">
          {(["upload", "configure", "results"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              {i > 0 && <ChevronRight className="w-3 h-3 text-neutral-300" />}
              <span
                className={`font-medium capitalize px-2 py-1 rounded-md transition-colors ${step === s
                  ? "bg-neutral-900 text-white"
                  : i < ["upload", "configure", "results"].indexOf(step)
                    ? "text-neutral-500"
                    : "text-neutral-300"
                  }`}
              >
                {i + 1}. {s}
              </span>
            </div>
          ))}
        </div>

        {/* Step 1: Upload */}
        <section className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-1">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-neutral-900">Upload CSV</h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                {csvRows.length > 0 ? `${csvRows.length} rows loaded` : "Upload your call transcripts"}
              </p>
            </div>
            {csvRows.length > 0 && (
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                ✓ {csvRows.length} rows
              </span>
            )}
          </div>
          <UploadCard onUpload={handleUpload} />
          {canConfigure && step === "upload" && (
            <div className="pt-4">
              <button
                type="button"
                onClick={() => setStep("configure")}
                className="flex items-center gap-2 px-4 py-2.5 bg-neutral-900 text-white text-sm font-medium rounded-xl hover:bg-neutral-700 transition-colors"
              >
                Continue to Configure
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </section>

        {/* Step 2: Configure */}
        {(step === "configure" || step === "results") && (
          <section className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-6">
            <div>
              <h2 className="text-base font-semibold text-neutral-900">Configure</h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Select a model and define outcome categories
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <ModelSelector
                  models={models}
                  selected={selectedModels}
                  onToggle={(model) => {
                    setSelectedModels((prev) =>
                      prev.some((m) => m.id === model.id)
                        ? prev.filter((m) => m.id !== model.id)
                        : [...prev, model]
                    );
                  }}
                  loading={modelsLoading}
                  error={modelsError}
                />
              </div>
              <div className="text-xs text-neutral-500 pt-6 space-y-2 max-h-48 overflow-y-auto">
                {selectedModels.map((m) => (
                  <div key={m.id} className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-1">
                    <p className="font-medium text-neutral-700">{m.name}</p>
                    <p className="capitalize text-neutral-400">{m.provider}</p>
                    {m.contextLength && (
                      <p className="text-neutral-400">
                        {(m.contextLength / 1000).toFixed(0)}K context
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-neutral-100 pt-6">
              <OutcomeEditor
                outcomes={outcomes}
                onChange={setOutcomes}
                onAutoGenerate={handleAutoGenerate}
                generating={generating}
                generateError={generateError}
                disabled={csvRows.length === 0}
              />
            </div>

            {runError && (
              <p className="text-sm text-red-500">{runError}</p>
            )}

            <div className="border-t border-neutral-100 pt-4 flex items-center justify-between">
              <p className="text-xs text-neutral-400">
                {outcomes.length === 0
                  ? "Define at least one outcome to continue"
                  : `${outcomes.length} outcomes · ${csvRows.length} transcripts`}
              </p>
              <button
                type="button"
                onClick={handleRun}
                disabled={!canRun}
                className="flex items-center gap-2 px-5 py-2.5 bg-neutral-900 text-white text-sm font-medium rounded-xl hover:bg-neutral-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {running ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Running…
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Run Classification
                  </>
                )}
              </button>
            </div>
          </section>
        )}

        {/* Step 3: Results */}
        {step === "results" && (
          <section className="space-y-6">
            {/* Metrics */}
            <MetricsBar
              rows={csvRows.map((r) => r.call_transcript)}
              results={results}
              models={selectedModels}
            />

            {/* Progress */}
            {running && (
              <div className="bg-white border border-neutral-200 rounded-2xl p-6">
                <ProgressBar current={progress} total={csvRows.length} />
              </div>
            )}

            {/* Results table */}
            {results.length > 0 && (
              <div className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-neutral-900">Results</h2>
                  <span className="text-xs text-neutral-400">
                    {results.length} / {csvRows.length} classified
                  </span>
                </div>
                <ResultsTable results={results} csvRows={csvRows} selectedModels={selectedModels} />
              </div>
            )}

            {/* Rerun config button */}
            {!running && (
              <button
                type="button"
                onClick={() => setStep("configure")}
                className="text-xs text-neutral-500 hover:text-neutral-800 transition-colors underline underline-offset-2"
              >
                ← Back to configure
              </button>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
