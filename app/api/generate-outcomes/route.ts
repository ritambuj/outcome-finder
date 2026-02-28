import { NextRequest, NextResponse } from "next/server";
import { callModel } from "@/lib/openrouter";
import { buildOutcomeGenerationMessages } from "@/lib/prompts";

export async function POST(req: NextRequest) {
    try {
        const { transcripts, model } = await req.json();

        if (!transcripts || !Array.isArray(transcripts) || transcripts.length === 0) {
            return NextResponse.json({ error: "transcripts array is required" }, { status: 400 });
        }
        if (!model) {
            return NextResponse.json({ error: "model is required" }, { status: 400 });
        }

        const messages = buildOutcomeGenerationMessages(transcripts);
        const response = await callModel(model, messages);

        // Strip markdown code fence if model wraps JSON
        let raw = response.content.trim();
        if (raw.startsWith("```")) {
            raw = raw.replace(/^```[a-z]*\n?/, "").replace(/```$/, "").trim();
        }

        const parsed = JSON.parse(raw);
        if (!parsed.outcomes || !Array.isArray(parsed.outcomes)) {
            throw new Error("Invalid response format from model");
        }

        return NextResponse.json({ outcomes: parsed.outcomes });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
