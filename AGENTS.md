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
- Use OpenFreeMap's vector basemap for globe geography because the previous raster endpoints return blocked or key-required tiles; use the light Positron style (`https://tiles.openfreemap.org/styles/positron`) since the app is on a light theme.
- Keep Yard Guide as one browser-persisted conversation because location help should remain lightweight without requiring account history.
- Listings live in the `listings` table; TinyFish scrapes run in the background (run-async + `scrape_runs`) and are collected on page load or Refresh, because scrapes take minutes and would time out a request.
