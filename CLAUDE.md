# Couples Counseling App — Agent Instructions

## CRITICAL: Before any UI work

Before writing CSS, Tailwind classes, component code, or discussing design decisions, you MUST read `DESIGN_SYSTEM.md` in this project root. This is non-negotiable.

The design system defines:
- Tone & aesthetic direction (warm editorial, not medical/SaaS/cute)
- Color tokens (warm neutrals, amber accent, no pure black/white)
- Typography (Noto Serif KR + Pretendard, NEVER Inter)
- Component patterns (borders not shadows, generous spacing)
- Motion philosophy (gentle, no bounce)
- Microcopy voice (Korean -요 form)

## How to use the design system

1. Read DESIGN_SYSTEM.md in full at the start of any UI-related task
2. Cite specific sections when making design decisions (e.g., "Per §4 Typography, using Noto Serif KR for the headline")
3. If a request conflicts with the design system, flag it to CEO before proceeding
4. Use CSS variables from §3 — never raw hex values
5. Reference §11 ("What to do when uncertain") whenever a design choice feels unclear

## Tech stack (confirmed)

- Next.js + Tailwind CSS v4
- shadcn/ui (Radix + Nova preset, CSS variables)
- Lucide icons (already aligned with DESIGN_SYSTEM §8)
- shadcn MCP server enabled — use it to look up component APIs instead of guessing

## Project context

This is the couples counseling app project under KDSPT. Sibling projects (tax-saas, hair-solution) have their OWN design systems with completely different tones. Do not copy patterns across projects.
