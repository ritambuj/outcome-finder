import { NextResponse } from "next/server";
import { fetchModels } from "@/lib/openrouter";

export async function GET() {
    try {
        const models = await fetchModels();
        return NextResponse.json({ models });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
