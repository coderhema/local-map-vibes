import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, validateUIMessages, type UIMessage } from "ai";

import { attachRunId, createRunIdFetch, getRunId } from "./run-id.server.ts";

const MODEL = "openai/gpt-6-astra";
const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1";

export async function handleLocationChat(request: Request) {
  const origin = request.headers.get("Origin");
  if (origin && new URL(origin).host !== new URL(request.url).host) {
    return Response.json({ message: "This chat request was blocked." }, { status: 403 });
  }

  const apiKey = process.env['LOVABLE_API_KEY'];
  if (!apiKey) return Response.json({ message: "The location assistant is not configured yet." }, { status: 401 });

  try {
    const body = await request.json() as { messages?: UIMessage[] };
    const messages = await validateUIMessages({ messages: body.messages ?? [] });
    const runIdFetch = createRunIdFetch(getRunId(request));
    const provider = createOpenAI({
      baseURL: GATEWAY_URL,
      apiKey,
      headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
      fetch: runIdFetch.fetch,
    });
    const result = streamText({
      model: provider.responses(MODEL),
      instructions: "You are Yard Guide, Backyrd's concise location assistant. Help people find cities, neighborhoods, venues, nearby events, and job-search areas. Give practical location names and short reasons. Use the user's wording and never claim live availability or real-time listings. When useful, mention one of Backyrd's visible sample destinations: Lagos, Cape Town, Berlin, Rio, Tokyo, or New York. Keep answers under 180 words.",
      messages: await convertToModelMessages(messages),
      abortSignal: request.signal,
      providerOptions: { openai: { store: false, forceReasoning: true, reasoningEffort: "low", reasoningSummary: "auto", include: ["reasoning.encrypted_content"] } },
    });
    return attachRunId(result.toUIMessageStreamResponse({ originalMessages: messages, sendReasoning: true }), runIdFetch);
  } catch (error) {
    console.error("Location chat failed", error);
    const message = error instanceof Error ? error.message : "The location assistant could not respond.";
    return Response.json({ message }, { status: 400 });
  }
}