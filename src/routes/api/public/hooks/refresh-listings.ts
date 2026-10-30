import { createFileRoute } from "@tanstack/react-router";

// Hourly job: save finished scrapes, then start a new one. The 55-minute
// cooldown inside startRefresh caps TinyFish spend no matter who calls this.
// Off Lovable, set CRON_SECRET and call with `Authorization: Bearer <CRON_SECRET>`
// (e.g. from a Render Cron Job). Without CRON_SECRET any bearer token is
// accepted, as before, so the existing Lovable pg_cron job keeps working.
export const Route = createFileRoute("/api/public/hooks/refresh-listings")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = /^Bearer (\S+)$/.exec(request.headers.get("authorization") ?? "")?.[1];
        if (!token) return new Response("Unauthorized", { status: 401 });
        const secret = process.env["CRON_SECRET"];
        if (secret) {
          const { createHash, timingSafeEqual } = await import("node:crypto");
          const digest = (v: string) => createHash("sha256").update(v, "utf8").digest();
          if (!timingSafeEqual(digest(token), digest(secret))) return new Response("Unauthorized", { status: 401 });
        }
        const { collectPending, startRefresh } = await import("@/lib/listings.server");
        const collected = await collectPending();
        const refresh = await startRefresh();
        return Response.json({ added: collected.added, started: refresh.started });
      },
    },
  },
});
