import { Message } from "./openrouter";

export interface Outcome {
    name: string;
    definition: string;
}

export function buildOutcomeGenerationMessages(transcripts: string[]): Message[] {
    const sample = transcripts.slice(0, 20).join("\n\n---\n\n");
    return [
        {
            role: "system",
            content: "You are a sales call analyst. Analyze call transcripts and create outcome categories.",
        },
        {
            role: "user",
            content: `From these transcripts, create 5–8 meaningful outcome categories.
Return JSON only, no extra text:
{
  "outcomes": [
    { "name": "", "definition": "" }
  ]
}

Transcripts:
${sample}`,
        },
    ];
}

export function buildClassificationMessages(
    outcomes: Outcome[],
    transcript: string
): Message[] {
    const outcomeList = outcomes
        .map((o, i) => `${i + 1}. ${o.name} - ${o.definition}`)
        .join("\n");

    return [
        {
            role: "system",
            content:
                "Classify the transcript into ONE of the allowed outcomes. Return JSON only, no explanation.",
        },
        {
            role: "user",
            content: `Allowed outcomes:
${outcomeList}

Transcript:
"""
${transcript}
"""

Return JSON only:
{
  "outcome": "",
  "confidence": 0
}`,
        },
    ];
}
