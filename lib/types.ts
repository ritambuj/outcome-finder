// Shared types used across components
export interface ModelClassification {
    outcome: string;
    confidence: number;
    error?: string;
}

export interface ClassificationResult {
    transcript: string;
    models: Record<string, ModelClassification>;
}

export interface Outcome {
    name: string;
    definition: string;
}
