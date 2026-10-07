import { createFileRoute } from "@tanstack/react-router";

// Hourly job: save finished scrapes, then start a new one. The 55-minute
// cooldown inside startRefresh caps TinyFish spend no matter who calls this.
export const Route = createFileRoute("/api/public/hooks/refresh-listings")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!/^Bearer \S+$/.test(request.headers.get("authorization") ?? "")) return new Response("Unauthorized", { status: 401 });
        const { collectPending, startRefresh } = await import("@/lib/listings.server");
        const collected = await collectPending();
        const refresh = await startRefresh();
        return Response.json({ added: collected.added, started: refresh.started });
      },
    },
  },
});
