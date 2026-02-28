// Shared types used across components
export interface ClassificationResult {
    transcript: string;
    outcome: string;
    confidence: number;
    error?: string;
}

export interface Outcome {
    name: string;
    definition: string;
}
