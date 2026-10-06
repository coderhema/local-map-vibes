import { createFileRoute } from "@tanstack/react-router";

import { handleLocationChat } from "@/lib/ai/location-chat.server";

export const Route = createFileRoute("/api/chat")({
  server: { handlers: { POST: ({ request }) => handleLocationChat(request) } },
});