import { createFileRoute } from "@tanstack/react-router";

// Render health check: cheap, no database or AI calls.
export const Route = createFileRoute("/api/health")({
  server: { handlers: { GET: () => Response.json({ ok: true }) } },
});
