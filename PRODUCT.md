# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack
Static HTML, CSS and plain JavaScript, no build step and no dependencies. Hosted as static files (GitHub Pages or Cloudflare Pages). Installable as a PWA on Android (standalone, system bars visible in the app's background color).

## Users
One person (the owner) and people they share the password with, watching a handful of records through the day on a phone and a desktop, usually with the tab left open. Writes to the product in Portuguese (Brazil), uses the dark theme.

## Product Purpose
Keep a short live table of records (Nome required; Projeto, Horario, Data, Estado, Observacoes) and see at a glance which ones have reached their date and time, which are free (LIVRE) or OK, and how long is left. Success: open it, read the state of every record in a second, change one in a few keystrokes.

## Positioning
A personal tool, not a SaaS: instant, no account, one shared password, syncs phone and computer through Firestore, installable like an app.

## Operating Context
Frequent short visits. The tab sits in the background and the favicon shows a dot when a horario is reached. Records are edited inline in the table; notes per record and a per-device history live in modals.

## Capabilities and Constraints
Add, edit inline, delete with confirmation and undo; auto date (next occurrence of the horario) and a question dialog when an edit changes the horario; sort by Horario or Nome with LIVRE then OK first; row states LIVRE (amber), OK (blue), reached (green); countdown "faltam ..."; history modal; notes per record (local only); single shared password (24h session); PWA with no cache; update banner. All logic modules and the 96 unit tests must keep working; ids and data-acao hooks used by tests must stay.

## Brand Commitments
Name "Registros". Portuguese (Brazil) copy. Keep the three state colors meaning: amber = LIVRE, blue = OK, green = reached.

## Evidence on Hand
No logos or photography. Icons in assets/icons (replaceable).

## Product Principles
1. The table is the product; everything else gets out of its way.
2. State must be readable without reading: color, position and time-left carry it.
3. Every action is reversible or confirmed.
4. Works equally on a 360px phone and a wide monitor.

## Accessibility & Inclusion
WCAG AA contrast in light and dark, visible keyboard focus, reduced motion respected, 44px touch targets on mobile.
