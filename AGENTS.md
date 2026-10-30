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
- Lazy-load the pointer-transparent R3F atmosphere after the map mounts; project stylized monuments and surface clouds from geographic coordinates and hide horizon-covered objects to preserve map interaction and initial loading speed.
- Group distant hints by side, listing kind and category with a selectable member list; update only when group membership changes to keep camera movement smooth.
- Keep city, regional, world and street camera presets in the browser-safe map-discovery module; focus changes the camera, not listing availability, so worldwide opportunities remain accessible.
- Keep transport geometry and local repeatable trail textures in the browser-safe route-trails module; use one shared animated source and a wider hover hit-layer for fast, consistent mode switching. Distances are direct geographic estimates, not road-network navigation.
- Keep event eligibility in the shared listing-visibility helper, applied before listing pagination and during scrape ingestion; invalidate discovery at UTC midnight and on window focus so old listings cannot linger.
- Fetch real OSM stop suggestions only when a route is shown or its mode changes, with bounded cached server requests; label proximity to the estimated path rather than implying a confirmed transit service.

- Resolve listing category colours through semantic CSS variables for both React controls and DOM map markers so theme changes stay consistent without rebuilding pins.
- Keep the logo font token independent from heading/body font tokens so typography refreshes preserve brand lettering.
- Convert CSS colour tokens to sRGB at map/3D renderer boundaries because those renderers do not accept every modern CSS colour format.
