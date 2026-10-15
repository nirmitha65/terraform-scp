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

## Architecture
- Soil reasoning lives in `src/lib/terraform/engine.ts` and reads only `src/data/knowledge_base.json`; UI components never hardcode advice — keeps decision logic separate and traceable to KB record/rule IDs.
- Engine rules are covered by `src/lib/terraform/engine.test.ts`; update tests when rules change.
