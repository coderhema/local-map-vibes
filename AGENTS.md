<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep the event discovery experience map-first, with MapLibre loaded client-side to preserve SSR safety.
- Use OpenFreeMap's Positron vector basemap and retint existing layers from CSS map tokens for light/dark themes without reloading tiles, preserving routes and fast interactions.
- Keep Yard Guide as one browser-persisted conversation because location help should remain lightweight without requiring account history.
- Listings live in the `listings` table; TinyFish scrapes run in the background (run-async + `scrape_runs`) and are collected on page load or Refresh, because scrapes take minutes and would time out a request.
- Listing refresh logic lives in `src/lib/listings.server.ts`, shared by the Refresh button and the hourly `/api/public/hooks/refresh-listings` job; its ~1h cooldown is the spend guard because that route's bearer check is only a stray-traffic filter.
- The user's chosen home location is browser-persisted (`backyard-home`) and is the origin for routes and distances, so no account is needed.
- Map pins are diffed by listing id (reused, not rebuilt) and the countdown ticks in its own small component, because rebuilding pins or re-rendering the whole page every second made the map lag on phones.
- Persist appearance in `backyrd-theme`, default to the device preference, and keep existing home/chat storage keys unchanged so branding changes do not erase user choices.
- Lazy-load the pointer-transparent R3F atmosphere after the map mounts; project stylized monuments from geographic coordinates and hide horizon-covered objects to preserve map interaction and initial loading speed.
