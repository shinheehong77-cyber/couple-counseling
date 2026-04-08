# 마주 (Maju) — Design System

> This document is the single source of truth for the visual and interaction design of 마주 (Maju). All UI work (Designer agent, Frontend Engineer agent, any human contributor) **must** read this file before writing CSS, Tailwind classes, or component code. Deviations require an explicit reason documented in the related issue.

---

## 1. Product Context

- **What it is:** A mobile-first web app that helps Korean couples improve their relationship through guided self-reflection, shared exercises, and AI-assisted counseling prompts.
- **Who uses it:** Korean couples, primarily 30s–40s, often one partner more motivated than the other. Users may be anxious, tired, or emotionally vulnerable when opening the app.
- **When they use it:** Usually late evening, alone in bed or on the couch. Sometimes together on one phone. Rarely in bright daylight.
- **Emotional promise:** "This is a safe, private, quiet space. Nothing here will judge me or my partner."

---

## 2. Tone & Aesthetic Direction

**Chosen direction: Warm editorial / Quiet intimacy**

Think: a well-designed Japanese stationery brand, a thoughtful indie magazine, the inside of a hardcover journal. Not a medical app. Not a dating app. Not a productivity SaaS.

### Core adjectives (keep these visible while designing)
- Warm
- Quiet
- Private
- Honest
- Grounded
- Softly confident

### Anti-adjectives (if the design feels like any of these, stop and rework)
- Clinical / medical
- Playful / cute / cartoonish
- Techy / futuristic / AI-generated
- Corporate / SaaS-template
- Romantic-kitsch (hearts, pinks, fairy-tale)
- Dating-app energy (swipes, matches, gamified rewards)

### Specific references to pull inspiration from
- Journaling apps: Day One, Stoic (calm, text-forward)
- Editorial web: Are.na, Dinner Journal, Offscreen Magazine
- Print: MUJI brand materials, Kinfolk magazine layout
- **Not** Headspace, Calm, BetterHelp — those are already overdone templates

---

## 3. Color System

Semantic tokens defined as CSS variables. **Use token names in code, never raw hex values.** Dark mode is the primary mode; light mode is secondary.

### Dark mode (primary — app opens in dark by default)

```css
:root[data-theme="dark"] {
  /* Backgrounds — layered, not pure black */
  --bg-base: #1A1714;         /* deepest, app background */
  --bg-surface: #23201C;      /* cards, modals */
  --bg-elevated: #2D2924;     /* hover, active surfaces */

  /* Text */
  --text-primary: #F4EFE6;    /* warm off-white, not #FFF */
  --text-secondary: #B8AE9E;  /* muted warm gray */
  --text-tertiary: #7A7268;   /* captions, metadata */

  /* Accents — used sparingly */
  --accent-primary: #D4A574;  /* warm amber, main CTA */
  --accent-soft: #3A3129;     /* subtle highlight backgrounds */

  /* Semantic */
  --border-subtle: #332E28;   /* 1px dividers */
  --border-strong: #4A4339;   /* focused inputs */

  /* State (use very rarely — this app is not alert-heavy) */
  --state-gentle-warning: #C9985E;
  --state-gentle-error: #B87060;
}
```

### Light mode (secondary)

```css
:root[data-theme="light"] {
  --bg-base: #FAF7F0;         /* warm cream, NOT pure white */
  --bg-surface: #F4EFE4;
  --bg-elevated: #EDE6D6;

  --text-primary: #2B2420;
  --text-secondary: #5C524A;
  --text-tertiary: #8B8176;

  --accent-primary: #A67A42;
  --accent-soft: #EBE0CC;

  --border-subtle: #E5DCC9;
  --border-strong: #C9BDA5;

  --state-gentle-warning: #B8843C;
  --state-gentle-error: #9B5445;
}
```

### Color rules
- **Never use pure black (#000) or pure white (#FFF).** Every neutral has warmth in it.
- **Never use blue or green as accent colors.** Blue feels corporate/techy, green feels medical.
- **Never use pink, red, or purple as brand colors.** Even for "love"-adjacent content.
- **One accent per screen.** If two things both want to be amber, one of them is wrong.
- Gradients: avoid unless it's a very subtle background texture. No bold gradient CTAs.

---

## 4. Typography

### Font stack

```css
/* Headlines — serif for warmth and editorial feel */
--font-display: "Noto Serif KR", "Source Serif Pro", Georgia, serif;

/* Body — humanist sans for readability */
--font-body: "Pretendard", -apple-system, "SF Pro Text", sans-serif;

/* Mono — only for timestamps, version numbers, rare technical UI */
--font-mono: "JetBrains Mono", "SF Mono", Consolas, monospace;
```

**Absolutely forbidden:** Inter, Roboto, Arial, Helvetica Neue as primary fonts. These are the "AI slop" signature. If a component library defaults to Inter, override it at the CSS variable level.

### Scale (mobile-first, rem-based)

| Token | Size | Line height | Usage |
|---|---|---|---|
| `--text-xs` | 12px | 1.5 | metadata, captions (rare) |
| `--text-sm` | 14px | 1.6 | secondary UI text |
| `--text-base` | 16px | 1.7 | **body default** |
| `--text-lg` | 18px | 1.6 | emphasized body |
| `--text-xl` | 22px | 1.4 | card titles, section headers |
| `--text-2xl` | 28px | 1.3 | page titles |
| `--text-3xl` | 36px | 1.2 | hero / onboarding |
| `--text-display` | 48px | 1.1 | landing page hero only |

### Typography rules
- **Body minimum is 16px.** Users are often tired. 14px only for true secondary content.
- **Line height is generous.** 1.6–1.7 for body. The app should feel like a well-laid-out book, not a dense dashboard.
- **Korean text:** use Pretendard or Noto Serif KR. Make sure `word-break: keep-all` is set globally so Korean doesn't break mid-word.
- **Headlines can be mixed case or use slight letter-spacing.** Avoid ALL CAPS except for tiny labels.
- **Long-form content (journal entries, counseling prompts) uses serif** (`--font-display`) for warmth and reading rhythm. UI chrome uses sans.

---

## 5. Spacing & Layout

### Scale (8px base grid)

```
--space-1: 4px     /* tight inline */
--space-2: 8px     /* element padding */
--space-3: 12px    /* small gaps */
--space-4: 16px    /* default gap */
--space-6: 24px    /* card padding */
--space-8: 32px    /* section spacing (mobile) */
--space-12: 48px   /* section spacing (desktop) */
--space-16: 64px   /* large separation */
--space-24: 96px   /* hero / landing page sections */
```

### Layout rules
- **Mobile-first. Design at 375px width first, then scale up.**
- **Max content width on desktop: 680px for reading content**, 1024px for dashboards. Never full-width text blocks — they hurt reading.
- **Generous vertical rhythm.** Between a card and the next card, minimum `--space-6` (24px). Between sections, minimum `--space-8` (32px).
- **Internal card padding: minimum `--space-6` (24px).** Cramped cards feel anxious.
- **Touch targets: minimum 44×44px.** Non-negotiable, this is accessibility.

---

## 6. Component Patterns

### Buttons
- **Primary:** filled with `--accent-primary`, text in `--bg-base`, `--radius-md` (8px), no shadow, subtle scale on press (`transform: scale(0.98)`)
- **Secondary:** 1px border in `--border-strong`, transparent background, `--text-primary` text
- **Tertiary / text:** just underlined text in `--accent-primary`, no border, no background
- **Never use:** drop shadows on buttons, gradient fills, icon-only buttons for primary actions
- **Hover:** very subtle brightness shift, not a dramatic color change

### Cards
- Background: `--bg-surface`
- Border: `1px solid --border-subtle` (instead of shadow)
- Radius: `--radius-lg` (12px)
- **No box-shadow.** This app uses borders, not shadows, for elevation. Shadows feel dated and SaaS-y.
- Padding: `--space-6` minimum

### Inputs & forms
- Background: `--bg-elevated`
- Border: `1px solid --border-subtle`, transitions to `--border-strong` on focus
- Focus ring: 2px offset ring in `--accent-primary`, **not** a glow
- Label above input, never floating. Couples counseling is emotional — users shouldn't have to guess what a field is for.
- Placeholders are muted (`--text-tertiary`) and never replace labels

### Navigation
- Bottom tab bar on mobile (native app feel)
- Max 4 tabs. If you need 5, reconsider the IA.
- Active tab: `--accent-primary` icon + label
- Inactive: `--text-tertiary`

### Modals & dialogs
- Full-screen sheets on mobile, not tiny centered modals
- Dismissible by swipe down (native feel)
- Background dim: `rgba(26, 23, 20, 0.75)` — warm dim, not black

---

## 7. Motion & Animation

### Philosophy
**Motion should feel like a deep breath, not a bounce.** This app is for emotionally tired people. Animations that are too energetic feel jarring.

### Timing
```css
--ease-gentle: cubic-bezier(0.25, 0.1, 0.25, 1);   /* default for UI */
--ease-exit: cubic-bezier(0.4, 0, 1, 1);           /* things leaving */
--duration-fast: 150ms;     /* hover, small state changes */
--duration-base: 250ms;     /* default */
--duration-slow: 400ms;     /* page transitions, modals */
--duration-ambient: 800ms;  /* background / decorative */
```

### Rules
- **Never use bounce or spring easings.** No `cubic-bezier` with overshoot.
- **Respect `prefers-reduced-motion`.** Some users have vestibular issues; couples therapy context makes this extra important.
- **Page transitions are fades or gentle slides**, not flashy.
- **Loading states:** a slow, warm pulse — not a spinning wheel. Better yet, skeleton screens in `--bg-elevated`.
- **No parallax. No scroll-triggered reveals on core app screens.** (Marketing landing page can use them sparingly.)

---

## 8. Iconography & Imagery

### Icons
- **Library: Lucide React**, stroke-based, 1.5px stroke weight
- **Never use:** filled icons, emoji as UI icons, Font Awesome, Material Icons (too corporate/techy)
- Size: 20px default, 24px for primary actions, 16px for inline text
- Color: inherit from parent text color, never colored icons in the UI chrome

### Imagery
- **No stock photos of smiling couples.** This is the single most forbidden thing.
- **No illustrations of people.** Faceless or abstract illustrations only, if any.
- Preferred: abstract organic shapes, soft gradients as ambient backgrounds, grain textures, nature references (stones, water, paper textures)
- Photography, if used: moody, low-saturation, editorial style. Objects and textures, not people.

---

## 9. Content & Microcopy Voice

Design is not only visual — copy is part of the system.

- **Tone:** soft, direct, never cute. "How are you feeling today?" not "Hey there! 👋 Ready to check in?"
- **Korean honorifics:** use `-요` form consistently. Not `-ㅂ니다` (too formal, medical), not `-어/야` (too casual, violates intimacy of the couple's shared space).
- **Never use exclamation marks** except in rare celebration moments.
- **Error messages are gentle.** "We couldn't save that — want to try again?" not "ERROR: SAVE_FAILED".
- **Empty states explain, not joke.** A blank journal shouldn't say "Wow, such empty!" — it should say "Your first entry is waiting whenever you're ready."

---

## 10. Accessibility (non-negotiable)

- All text meets **WCAG AA** contrast (4.5:1 for body, 3:1 for large text)
- Focus states are visible and 2px minimum
- Touch targets 44×44px minimum
- Forms have real `<label>` elements, not just placeholders
- Images have meaningful `alt` text
- Color is never the only signal (always pair with icon or text)
- `prefers-reduced-motion` respected
- Korean screen reader (VoiceOver KR) tested for key flows

---

## 11. What to do when uncertain

If you (human or agent) are unsure whether a design choice fits this system, ask these three questions:

1. **Would this feel safe and private at 11pm to someone who had a hard day?**
2. **Does this look like it could have come from a well-designed indie magazine, or does it look like a generic SaaS template?**
3. **If I replaced our app name with "generic therapy app," would this design still feel specifically ours?**

If the answer to any of these is "no" or "I'm not sure," the design needs more work.

---

## 12. Document ownership & updates

- **Owner:** Designer agent (primary), CEO (approval for structural changes)
- **Location:** `~/couple-counseling/DESIGN_SYSTEM.md` (source of truth)
- **Referenced by:** All agents touching the couples counseling project
- **Update rule:** Any change to color tokens, typography, or component patterns requires a linked issue (KDS-xxx) and CEO approval. Microcopy and content rules can be updated freely by Designer.

---

*Last updated: 2026-04-06 (initial version)*
