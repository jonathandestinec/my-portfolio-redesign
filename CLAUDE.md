@AGENTS.md

## Commit and PR rules (owner preference)

- Never add AI attribution to commits or pull requests: no `Co-Authored-By` trailers, no session links, no "Generated with" footers, and no AI tool listed as a contributor.
- Write commit messages in plain conventional style (`feat: ...`, `docs: ...`).

## Error and empty pages (owner preference)

- Never ship the framework's default 404 or error pages. Every project gets custom, on-brand pages for not found (`not-found.tsx`), runtime errors (`error.tsx`), root-layout failures (`global-error.tsx`), and empty, unavailable or expired states.
