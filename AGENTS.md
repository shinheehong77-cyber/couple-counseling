<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Token Optimization Rules

- Read `DESIGN_SYSTEM.md` only for UI work. Do not load it for backend, infra, or non-design changes.
- Use `qmd` first if it is installed. Otherwise use `rg` or `rg --files` before opening files.
- Do not re-read files that were already inspected unless something changed or the prior read was incomplete.
- Avoid speculative tool calls. Search with intent, then open only the most relevant files.
- Parallelize independent reads/searches when possible.
- Do not restate the user's request back to them unless clarification is required.
- If the task changes substantially, clear stale context before continuing.

# Agent Role Assignments

## Architect
- Use PRODUCT_PLAN.md as the source of truth; update ARCHITECTURE.md to match
- Create new API route stubs (suggestions, session-complete, assignments, program)
- Define shared types (SuggestionMeta, SessionCompleteMeta, etc.)

## Backend Engineer
- Fix BUG-1 (userId hardcoding), BUG-2 (couple join field), BUG-3 (assignment extraction)
- Improve counseling prompt: add suggestion metadata, 4-phase flow tracking, session-complete signal
- Implement assignment extraction pipeline (same pattern as emotion extraction)
- Seed assignment templates from PRODUCT_PLAN.md §7

## Frontend Engineer
- Fix BUG-4 (useAuth redirect to `/`), BUG-5 (dashboard /report 404)
- Add suggestion buttons to chat UI after each counselor response
- Add save/end session buttons to chat UI
- Wire dashboard progress bar to real program data
- Wire assignments page to real API data

## Designer
- Fonts: Noto Serif KR + Pretendard (see DESIGN_SYSTEM.md §4); override any Inter defaults
- Touch targets: all interactive elements ≥ 44×44px
- Chat UI: suggestion button style (secondary button pattern)
- Chat UI: save/end button placement (bottom bar)
