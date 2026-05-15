# Responsive UI Guardrails

This project contains dense Chinese dashboard pages. The main responsive failure mode is not true vertical writing; it is text columns being squeezed until Chinese characters wrap one-by-one. Use these guardrails whenever building or editing dashboard, table, filter, or metric-card UI.

## Non-negotiables

1. **Grid children that may shrink need `minmax(0, ...)`.**
   - Prefer `xl:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]` over `xl:grid-cols-[1fr_0.8fr]`.
   - Add `min-w-0` to cards/panels inside complex grids.

2. **Important short Chinese labels should stay horizontal.**
   - Use `text-horizontal whitespace-nowrap` for metric labels, nav items, chips, badges, and compact buttons.
   - Do not apply nowrap globally to long paragraphs; let body copy wrap normally.

3. **Small-screen controls should scroll horizontally, not compress.**
   - Use `overflow-x-auto no-scrollbar` on filter rows, nav rows, and chip rows.
   - Add `shrink-0 whitespace-nowrap` to each chip/button inside those rows.

4. **Tables must be contained.**
   - Wrap wide tables in `max-w-full overflow-x-auto`.
   - Never place `min-w-[...]` tables directly inside a CSS grid child unless the grid child has `min-w-0`.

5. **Avoid fixed minimum widths below `sm`.**
   - Bad: `min-w-[26rem]` on an input/form that appears on phones.
   - Good: `min-w-0 sm:min-w-[26rem]`.

## Utilities

Defined in `src/app/globals.css`:

- `no-scrollbar`: hides scrollbars while preserving horizontal scroll.
- `text-horizontal`: forces horizontal Chinese label flow and keeps Chinese words from breaking character-by-character.
- `scroll-row`: base utility for horizontally scrollable rows.

## Responsive verification checklist

Before considering dense pages done, check:

- widths: `320`, `375`, `390`, `430`, `768`, `1024`, `1440`, `1600`
- browser zoom: about `80%`, `90%`, `100%`, `110%`, `125%`
- pass criteria:
  - no metric/nav/chip label becomes one-character-per-line
  - `document.body.scrollWidth <= window.innerWidth + 1`
  - intentionally wide tables scroll inside their own container, not the whole page
  - search/filter controls remain reachable on phone widths
