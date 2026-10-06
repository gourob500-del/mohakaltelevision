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

- Photo cards are client-side PNG exports keyed by the existing published news ID and use shared rendering with current public website settings; this avoids database duplication and keeps all entry points consistent.
- Bundle the authentic SolaimanLipi font locally for photo-card rendering and wait for its FontFace before export; Bengali shaping must not depend on a visitor's installed fonts.
