const OPENROUTER_BASE = "https://openrouter.ai/api/v1";
const MAX_INPUT_PRICE_PER_1M = 50; // USD, filter out extremely expensive models

export interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  context_length?: number;
  pricing?: {
    prompt: string; // cost per token in USD
    completion: string;
  };
  architecture?: {
    modality?: string;
  };
  top_provider?: {
    is_moderated?: boolean;
  };
}

export interface FilteredModel {
  id: string;
  name: string;
  provider: string;
  inputPricePerMillion: number | null;
  outputPricePerMillion: number | null;
  contextLength: number | null;
}

function parsePrice(priceStr: string | undefined): number | null {
  if (!priceStr) return null;
  const val = parseFloat(priceStr);
  if (isNaN(val)) return null;
  // OpenRouter prices are per token, convert to per 1M tokens
  return val * 1_000_000;
}

function extractProvider(modelId: string): string {
  const parts = modelId.split("/");
  return parts.length >= 2 ? parts[0] : "unknown";
}

export async function fetchModels(): Promise<FilteredModel[]> {
  const res = await fetch(`${OPENROUTER_BASE}/models`, {
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    },
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch models: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  const models: OpenRouterModel[] = data.data || [];

  return models
    .filter((m) => {
      // Keep only text/chat capable models
      const modality = m.architecture?.modality || "";
      if (modality && !modality.includes("text")) return false;

      // Filter by price ceiling
      const inputPrice = parsePrice(m.pricing?.prompt);
      if (inputPrice !== null && inputPrice > MAX_INPUT_PRICE_PER_1M) return false;

      return true;
    })
    .map((m) => ({
      id: m.id,
      name: m.name || m.id,
      provider: extractProvider(m.id),
      inputPricePerMillion: parsePrice(m.pricing?.prompt),
      outputPricePerMillion: parsePrice(m.pricing?.completion),
      contextLength: m.context_length || null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export async function callModel(
  modelId: string,
  messages: Message[],
  retryOnRateLimit = true
): Promise<ChatResponse> {
  const body = {
    model: modelId,
    messages,
    temperature: 0.1,
  };

  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://outcome-finder.app",
      "X-Title": "Call Outcome Classifier",
    },
    body: JSON.stringify(body),
  });

  if (res.status === 429 && retryOnRateLimit) {
    // Retry once after 2 seconds
    await new Promise((r) => setTimeout(r, 2000));
    return callModel(modelId, messages, false);
  }

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Model API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const choice = data.choices?.[0];
  if (!choice) throw new Error("No choices returned from model");

  return {
    content: choice.message?.content || "",
    usage: data.usage,
  };
}
