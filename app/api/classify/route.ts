import { NextRequest, NextResponse } from "next/server";
import { callModel } from "@/lib/openrouter";
import { buildClassificationMessages, Outcome } from "@/lib/prompts";

export async function POST(req: NextRequest) {
    try {
        const { transcript, outcomes, model } = await req.json();

        if (!transcript) {
            return NextResponse.json({ error: "transcript is required" }, { status: 400 });
        }
        if (!outcomes || !Array.isArray(outcomes) || outcomes.length === 0) {
            return NextResponse.json({ error: "outcomes array is required" }, { status: 400 });
        }
        if (!model) {
            return NextResponse.json({ error: "model is required" }, { status: 400 });
        }

        const messages = buildClassificationMessages(outcomes as Outcome[], transcript);
        const response = await callModel(model, messages);

        // Strip markdown code fence if model wraps JSON
        let raw = response.content.trim();
        if (raw.startsWith("```")) {
            raw = raw.replace(/^```[a-z]*\n?/, "").replace(/```$/, "").trim();
        }

        const parsed = JSON.parse(raw);
        if (!parsed.outcome) {
            throw new Error("Invalid classification response from model");
        }

        return NextResponse.json({
            outcome: parsed.outcome,
            confidence: Math.min(100, Math.max(0, Number(parsed.confidence) || 0)),
            usage: response.usage,
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
