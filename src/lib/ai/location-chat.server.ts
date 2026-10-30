import { createOpenAI } from "@ai-sdk/openai";
import {
  convertToModelMessages,
  streamText,
  validateUIMessages,
  type LanguageModel,
  type UIMessage,
} from "ai";

import { attachRunId, createRunIdFetch, getRunId } from "./run-id.server.ts";

// Yard Guide works with any OpenAI-compatible API, so it does not depend on Lovable:
// - OPENAI_API_KEY (+ optional OPENAI_BASE_URL for OpenRouter, Groq, etc.) and AI_MODEL
// - otherwise LOVABLE_API_KEY keeps the original Lovable AI gateway working on Lovable hosting.
const DEFAULT_OPENAI_MODEL = "gpt-5-mini";
const LOVABLE_MODEL = "openai/gpt-6-astra";
const LOVABLE_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1";

const INSTRUCTIONS =
  "You are Yard Guide, Backyrd's concise location assistant. Backyrd's default market is Lagos, Nigeria, and most users are students and early-career people around Yaba and the rest of Lagos. Help people find cities, neighbourhoods, venues, nearby events, and job-search areas, and how to get there (walking, danfo/BRT, ride-hailing, driving). Give practical location names and short reasons. Use the user's wording and never claim live availability or real-time listings; some listings in the app are clearly marked sample data. Keep answers under 180 words.";

type Provider = {
  model: LanguageModel;
  runIdFetch?: ReturnType<typeof createRunIdFetch>;
  lovable: boolean;
};

function providerFor(request: Request): Provider | null {
  const openaiKey = process.env["OPENAI_API_KEY"];
  if (openaiKey) {
    const baseURL = process.env["OPENAI_BASE_URL"];
    const openai = createOpenAI(baseURL ? { apiKey: openaiKey, baseURL } : { apiKey: openaiKey });
    // Chat Completions is the widest-supported endpoint across OpenAI-compatible providers.
    return { model: openai.chat(process.env["AI_MODEL"] || DEFAULT_OPENAI_MODEL), lovable: false };
  }
  const lovableKey = process.env["LOVABLE_API_KEY"];
  if (lovableKey) {
    const runIdFetch = createRunIdFetch(getRunId(request));
    const gateway = createOpenAI({
      baseURL: LOVABLE_GATEWAY_URL,
      apiKey: lovableKey,
      headers: { "Lovable-API-Key": lovableKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
      fetch: runIdFetch.fetch,
    });
    return { model: gateway.responses(LOVABLE_MODEL), runIdFetch, lovable: true };
  }
  return null;
}

export async function handleLocationChat(request: Request) {
  const origin = request.headers.get("Origin");
  if (origin && new URL(origin).host !== new URL(request.url).host) {
    return Response.json({ message: "This chat request was blocked." }, { status: 403 });
  }

  const provider = providerFor(request);
  if (!provider)
    return Response.json(
      { message: "The location assistant is not configured yet." },
      { status: 503 },
    );

  try {
    const body = (await request.json()) as { messages?: UIMessage[] };
    const messages = await validateUIMessages({ messages: body.messages ?? [] });
    const result = streamText({
      model: provider.model,
      instructions: INSTRUCTIONS,
      messages: await convertToModelMessages(messages),
      abortSignal: request.signal,
      ...(provider.lovable
        ? {
            providerOptions: {
              openai: {
                store: false,
                forceReasoning: true,
                reasoningEffort: "low",
                reasoningSummary: "auto",
                include: ["reasoning.encrypted_content"],
              },
            },
          }
        : {}),
    });
    const response = result.toUIMessageStreamResponse({
      originalMessages: messages,
      sendReasoning: provider.lovable,
    });
    return provider.runIdFetch ? attachRunId(response, provider.runIdFetch) : response;
  } catch (error) {
    console.error("Location chat failed", error);
    const message =
      error instanceof Error ? error.message : "The location assistant could not respond.";
    return Response.json({ message }, { status: 400 });
  }
}
