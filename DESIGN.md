---
name: Registros
description: A quiet graphite instrument for a short live table of records, where color is reserved for record state.
colors:
  graphite-ink: "oklch(0.2 0.02 255)"
  graphite-ink-soft: "oklch(0.5 0.02 255)"
  pearl-ink: "oklch(0.96 0.005 250)"
  pearl-ink-soft: "oklch(0.73 0.016 250)"
  shell: "oklch(0.965 0.006 250)"
  shell-dark: "oklch(0.16 0.012 250)"
  panel: "oklch(1 0 0)"
  panel-dark: "oklch(0.205 0.013 250)"
  panel-raised: "oklch(0.972 0.005 250)"
  panel-raised-dark: "oklch(0.245 0.014 250)"
  field: "oklch(0.953 0.007 250)"
  field-dark: "oklch(0.15 0.012 250)"
  focus-blue: "oklch(0.52 0.19 255)"
  focus-blue-dark: "oklch(0.82 0.1 250)"
  state-free-amber: "oklch(0.83 0.16 82)"
  state-free-amber-ink: "oklch(0.27 0.06 70)"
  state-free-wash: "oklch(0.972 0.05 90)"
  state-ok-blue: "oklch(0.5 0.19 258)"
  state-ok-blue-ink: "oklch(0.99 0 0)"
  state-ok-wash: "oklch(0.966 0.024 250)"
  state-reached-green-ink: "oklch(0.36 0.1 155)"
  state-reached-wash: "oklch(0.972 0.026 155)"
  state-reached-line: "oklch(0.78 0.11 155)"
  danger: "oklch(0.5 0.19 27)"
  danger-dark: "oklch(0.78 0.13 25)"
  notice-wash: "oklch(0.95 0.07 90)"
  notice-ink: "oklch(0.38 0.07 75)"
typography:
  display:
    fontFamily: "system-ui, -apple-system, Segoe UI Variable Display, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "3.5rem"
    fontWeight: 300
    lineHeight: 1
    letterSpacing: "-0.045em"
    fontFeature: "tnum"
  headline:
    fontFamily: "system-ui, -apple-system, Segoe UI Variable Display, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.03em"
  title:
    fontFamily: "system-ui, -apple-system, Segoe UI Variable Display, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.5
    letterSpacing: "-0.02em"
  body:
    fontFamily: "system-ui, -apple-system, Segoe UI Variable Text, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 450
    lineHeight: 1.5
  label:
    fontFamily: "system-ui, -apple-system, Segoe UI Variable Text, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "0.005em"
rounded:
  field: "12px"
  panel: "22px"
  sheet: "26px"
  card-auth: "28px"
  pill: "999px"
spacing:
  xs: "0.375rem"
  sm: "0.75rem"
  md: "1.25rem"
  lg: "2rem"
  page-x: "1.5rem"
components:
  button-primary:
    backgroundColor: "{colors.graphite-ink}"
    textColor: "{colors.state-ok-blue-ink}"
    rounded: "{rounded.pill}"
    padding: "0.5rem 1.25rem"
    height: "2.75rem"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.graphite-ink-soft}"
    rounded: "{rounded.pill}"
    padding: "0.375rem 0.875rem"
    height: "2.25rem"
  button-danger-solid:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.panel}"
    rounded: "{rounded.pill}"
    padding: "0.5rem 1.25rem"
    height: "2.75rem"
  input-field:
    backgroundColor: "{colors.field}"
    textColor: "{colors.graphite-ink}"
    rounded: "{rounded.field}"
    padding: "0.5rem 0.875rem"
    height: "2.75rem"
  input-field-focus:
    backgroundColor: "{colors.panel}"
  panel:
    backgroundColor: "{colors.panel}"
    rounded: "{rounded.panel}"
    padding: "1.25rem"
  chip-state-free:
    backgroundColor: "{colors.state-free-amber}"
    textColor: "{colors.state-free-amber-ink}"
    rounded: "{rounded.pill}"
    padding: "0.125rem 0.75rem"
  chip-state-ok:
    backgroundColor: "{colors.state-ok-blue}"
    textColor: "{colors.state-ok-blue-ink}"
    rounded: "{rounded.pill}"
    padding: "0.125rem 0.75rem"
  row-state-free:
    backgroundColor: "{colors.state-free-wash}"
  row-state-ok:
    backgroundColor: "{colors.state-ok-wash}"
  row-state-reached:
    backgroundColor: "{colors.state-reached-wash}"
    textColor: "{colors.state-reached-green-ink}"
---

# Design System: Registros

## Overview

**Creative North Star: "The Quiet Graphite Instrument"**

Registros is a short live table read many times a day in a second. The shell is cool graphite (hue 250, chroma about 0.012) with one soft ambient glow at the top of the page; everything else is neutral so that the only color on screen is the state of a record. Amber means LIVRE, blue means OK, green means the horario was reached. The tone is soft and premium, Apple-adjacent: capsule controls, large rounded panels, tight tracking on large type, light-weight tabular numerals for the clock.

The grouped list is the signature: one rounded panel, rows separated by hairlines, state carried by a row tint plus a solid chip. It refuses the every-row-a-card dashboard and the indigo-gradient default. Light and dark both ship and follow the device (`color-scheme: light dark`); the owner uses dark, so dark values are first-class, not an inversion afterthought.

**Key Characteristics:**
- Neutral graphite shell, color reserved for record state.
- Monochrome primary action: graphite in light, pearl in dark. No brand accent hue.
- Capsule buttons and chips, 12px fields, 22px panels, 26px sheets.
- Depth by soft offset and blur plus a 1px top highlight; translucent blur only on floating layers.
- One animated moment: a record arriving or turning green.

## Colors

A graphite-and-pearl neutral field with exactly three semantic state hues and one blue used only for focus.

### Primary
- **Graphite Ink** (oklch(0.2 0.02 255)): text and, in light mode, the primary button fill. In dark mode the same role flips to **Pearl Ink** (oklch(0.96 0.005 250)). The primary action is monochrome by design.

### Secondary (state colors; the only chromatic roles)
- **LIVRE Amber** (oklch(0.83 0.16 82)): solid chip for records whose state is LIVRE, with **LIVRE Amber Ink** (oklch(0.27 0.06 70)) text. The row takes the pale **LIVRE Wash** (oklch(0.972 0.05 90)).
- **OK Blue** (oklch(0.5 0.19 258)): solid chip for OK, white text. The row takes **OK Wash** (oklch(0.966 0.024 250)). In dark it lightens to oklch(0.76 0.11 250) with dark ink.
- **Reached Green** (ink oklch(0.36 0.1 155), wash oklch(0.972 0.026 155), line oklch(0.78 0.11 155)): the horario-reached row tint, the "atingido" seal beside the time, the count pill, and the sync "ok" dot. Never a solid chip.

### Tertiary
- **Focus Blue** (oklch(0.52 0.19 255); dark oklch(0.82 0.1 250)): focus ring, caret, selection and accent-color only. It is not a state color and not an action color.

### Neutral
- **Shell** (oklch(0.965 0.006 250); dark oklch(0.16 0.012 250)): page background, with a radial glow (oklch(0.82 0.07 250 / 0.38), dark oklch(0.5 0.1 250 / 0.22)) at top center.
- **Panel** (oklch(1 0 0); dark oklch(0.205 0.013 250)) and **Panel Raised** (oklch(0.972 0.005 250); dark oklch(0.245 0.014 250)): list and form surfaces; raised is the hover and in-edit row.
- **Field** (oklch(0.953 0.007 250); dark oklch(0.15 0.012 250)): inset input fill, deeper than the panel it sits on.
- **Graphite Ink Soft** (oklch(0.5 0.02 255); dark oklch(0.73 0.016 250)): secondary text, labels, dates, placeholders.
- **Hairline** (graphite at 10% alpha; white at 8% in dark) and **Hairline Strong** (20% / 18%): row dividers and panel borders. Field borders are stronger (42% / 40%) for AA non-text contrast.
- **Danger** (oklch(0.5 0.19 27); dark oklch(0.78 0.13 25)) with a 10-14% wash; **Notice** wash/ink (oklch(0.95 0.07 90) / oklch(0.38 0.07 75)) for banners.

### Named Rules
**The State-Only Color Rule.** Amber, blue and green mean LIVRE, OK and reached, and nothing else. Never use them for decoration, categories, brand or buttons. Avatars are neutral for the same reason.
**The Monochrome Action Rule.** Primary buttons are ink on the shell (graphite in light, pearl in dark). Do not introduce an accent fill for actions.
**The Chip Beats Row Rule.** A row's state tint is pale; its chip is solid. When LIVRE or OK and reached coincide, the state color wins the row and the green survives only as the seal beside the time.

## Typography

**Display Font:** the platform system stack (`system-ui`, Segoe UI Variable Display, Roboto, Helvetica Neue, Arial)
**Body Font:** the same stack with Segoe UI Variable Text
**Label/Mono Font:** none; numerals use `font-variant-numeric: tabular-nums`

**Character:** Native and unobtrusive. Hierarchy comes from weight contrast (300 clock against 700 headings) and tight negative tracking on large sizes, not from a second family.

### Hierarchy
- **Display** (300, 3.5rem, 1, -0.045em; 2.5rem under 900px): the live clock, tabular numerals. Seconds drop to 1.5rem in Graphite Ink Soft.
- **Headline** (700, 1.875rem, 1.1, -0.03em; 1.625rem under 900px): page h1 and the password card title (1.625rem).
- **Title** (700, 1.25rem, -0.02em): sheet titles. Empty-state title is 1.0625rem at 650.
- **Body** (450, 1rem, 1.5): table cells and field text. Names are 650. Notes and secondary lines are 0.8125rem with max 42ch.
- **Label** (600, 0.75-0.8125rem, 0.005-0.02em): field labels, table headers, pills, seals. Sentence case throughout; no uppercase.

### Named Rules
**The Tabular Time Rule.** Every time, date, count and countdown uses tabular numerals so a live-updating row never jiggles.
**The Weight-Not-Size Rule.** Emphasis inside a row is weight (450 / 550 / 650), not a larger size or a different face.

## Layout

A single centered column, max 72rem, with 1.5rem side padding (0.875rem under 900px) and safe-area insets honored on all four sides. Order: top bar (title, count pills, sync status left; clock right, bottom-aligned), add form, sort segmented control right-aligned, then the grouped list. Section gaps are 2rem; internal rhythm steps through 0.375, 0.5, 0.75, 0.875, 1.25rem.

The add form is a five-column grid (2fr, 1.5fr, 8.25rem, 9.75rem, 1.5fr) with notes spanning four columns. At 960px it becomes two columns; at 560px horario and data stay side by side and every other field goes full width. The table uses fixed layout above 900px so inline editing never shifts columns; the actions column is 22.5rem, collapsing to icon-only (12rem) between 901 and 1439px. Under 900px the table becomes stacked rows: the header is visually hidden, each cell shows its `data-rotulo` label in a 4.75rem column, and actions span the row with 44px targets.

Breakpoints: 560px, 900px, 960px, 1439px.

## Elevation & Depth

Hybrid: tonal layering for the page, soft ambient shadow for panels, glass for floating layers. Shadows are offset-and-blur with no halo and no hard offset. Every panel also carries a 1px inner top highlight so it reads as a lit edge.

### Shadow Vocabulary
- **Panel** (`0 1px 2px oklch(0.2 0.03 255 / 0.05), 0 18px 40px -18px oklch(0.2 0.03 255 / 0.2)` plus highlight `inset 0 1px 0 oklch(1 0 0 / 0.7)`): form, list, empty state.
- **Sheet** (`0 2px 6px oklch(0.2 0.03 255 / 0.08), 0 40px 80px -24px oklch(0.2 0.03 255 / 0.38)`): modals, toast, update banner, password card. Dark variants are black at 0.35-0.8 alpha.
- **Segment thumb** (`0 1px 2px oklch(0.2 0.03 255 / 0.16), 0 3px 8px -2px oklch(0.2 0.03 255 / 0.12)`): the selected sort segment.
- **Focus glow** (`0 0 0 4px` Focus Blue at 22%): text-field focus only.

### Named Rules
**The Float-Only Glass Rule.** `backdrop-filter` blur (24-32px, saturate 170%) is allowed only on layers that float over content: sheets, toast, update banner, sticky notes header. Panels in the page flow are solid. Under `prefers-reduced-transparency` every glass layer falls back to the solid Panel color.
**The Soft Lift Rule.** Depth comes from large negative-spread blurs under a surface. No halos, no hard offset shadows, no colored glows.

## Shapes

Capsule for anything pressed or labeling (buttons, chips, pills, seals, segmented control, toast, count badge); 12px for inset fields and banners; 22px for in-flow panels; 26px for sheets (top corners only when docked to the bottom on phones); 28px for the password card; 18px for the empty-state icon tile. Avatars are circles. Borders are 1px hairlines; the list is one panel with dividers, not separate bordered cards.

## Components

### Buttons
- **Shape:** capsule (999px), minimum 44px tall (36px for quiet and outline, 32px for text and inline).
- **Primary:** Graphite Ink fill, near-white text, 0.5rem 1.25rem padding; hover steps to the lighter ink (oklch(0.32 0.025 255)); dark mode inverts to pearl.
- **Quiet / Outline / Text:** transparent, Graphite Ink Soft text at 550 weight, a 7% ink wash on hover that also darkens the text. Row actions are quiet buttons with icon plus label.
- **Danger:** quiet buttons wash red on hover; the confirmation sheet uses a solid Danger fill with a brightness lift on hover.
- **Press and focus:** scale(0.97) on active; 2px Focus Blue outline at 2px offset on keyboard focus.

### Chips and pills
- **Neutral pill:** ink at 7% alpha, soft text, 0.8125rem 600; the green variant adds a dot and the Reached Green ink.
- **State chip:** solid LIVRE Amber or OK Blue at 650 weight, 0.875rem. The chip shows the state text exactly as typed.
- **Seal:** small green capsule with a check icon beside a reached horario.

### Cards / Containers
- **Panel:** 22px radius, Panel background, 1px Hairline border, Panel shadow plus highlight, 1.25rem padding for the form; the list panel has no padding and clips its rows.
- **Rows:** 0.875rem 1.25rem cells, hairline between rows, hover to Panel Raised, tinted by state as above, Panel Raised while editing.

### Inputs / Fields
- **Style:** Field fill, 1px strong border (42% ink), 12px radius, 2.75rem min height, 450 weight, tabular numerals on masked inputs.
- **Focus:** background lifts to Panel, border turns Focus Blue, 4px soft ring. **Error:** border becomes Danger with a 0.8125rem 600 message beneath. Labels sit above at 0.8125rem 600.

### Navigation
There is no nav bar. The sort control is an inset segmented capsule (3px padding, 2rem segments); the selected segment is a raised Panel capsule with the Segment thumb shadow and 650 weight.

### Bottom sheet (signature)
History, notes and confirmation dialogs are glass sheets (26px radius, 42rem wide, 32px blur). Under 560px large sheets dock to the bottom with only top corners rounded and rise with a 0.42s ease; confirmation sheets stay centered at 26rem.

### Toast and update banner
Pill-shaped glass strips: the delete-undo toast floats bottom center, the update banner top center. Each has an ink-filled capsule action button inside its right end.

## Do's and Don'ts

### Do:
- **Do** reserve amber, blue and green for LIVRE, OK and reached; everything else stays graphite and pearl.
- **Do** keep every control at least 44px tall on touch (2.75rem), and keep the 1px strong field borders.
- **Do** use `var(--ease)` (cubic-bezier(0.16, 1, 0.3, 1)) at 0.2-0.45s for state transitions, and honor `prefers-reduced-motion`.
- **Do** group list content inside one panel with hairline separators.
- **Do** put new colors in the token block at the top of `css/estilo.css` with a dark counterpart; copy stays in Portuguese (Brazil), for example "Nenhum registro ainda" and "Desfazer".
- **Do** give a new floating layer the solid reduced-transparency fallback.

### Don't:
- **Don't** make each record its own card, or add gradients to fills; the only gradient is the ambient top glow.
- **Don't** introduce an accent hue for buttons, links or avatars.
- **Don't** use blur on in-flow panels, hard offset shadows, or colored glows.
- **Don't** convey state by color alone: keep the chip text, the seal and the countdown.
- **Don't** let a new layer set its own radius; pick from 12, 22, 26 or capsule.
