# CLAUDE.md

# CLAUDE.md — 12-rule template

These rules apply to every task in this project unless explicitly overridden.
Bias: caution over speed on non-trivial work. Use judgment on trivial tasks.

## Rule 1 — Think Before Coding
State assumptions explicitly. If uncertain, ask rather than guess.
Present multiple interpretations when ambiguity exists.
Push back when a simpler approach exists.
Stop when confused. Name what's unclear.

## Rule 2 — Simplicity First
Minimum code that solves the problem. Nothing speculative.
No features beyond what was asked. No abstractions for single-use code.
Test: would a senior engineer say this is overcomplicated? If yes, simplify.

## Rule 3 — Surgical Changes
Touch only what you must. Clean up only your own mess.
Don't "improve" adjacent code, comments, or formatting.
Don't refactor what isn't broken. Match existing style.

## Rule 4 — Goal-Driven Execution
Define success criteria. Loop until verified.
Don't follow steps. Define success and iterate.
Strong success criteria let you loop independently.

## Rule 5 — Use the model only for judgment calls
Use me for: classification, drafting, summarization, extraction.
Do NOT use me for: routing, retries, deterministic transforms.
If code can answer, code answers.

## Rule 6 — Token budgets are not advisory
Per-task: 4,000 tokens. Per-session: 30,000 tokens.
If approaching budget, summarize and start fresh.
Surface the breach. Do not silently overrun.

## Rule 7 — Surface conflicts, don't average them
If two patterns contradict, pick one (more recent / more tested).
Explain why. Flag the other for cleanup.
Don't blend conflicting patterns.

## Rule 8 — Read before you write
Before adding code, read exports, immediate callers, shared utilities.
"Looks orthogonal" is dangerous. If unsure why code is structured a way, ask.

## Rule 9 — Tests verify intent, not just behavior
Tests must encode WHY behavior matters, not just WHAT it does.
A test that can't fail when business logic changes is wrong.

## Rule 10 — Checkpoint after every significant step
Summarize what was done, what's verified, what's left.
Don't continue from a state you can't describe back.
If you lose track, stop and restate.

## Rule 11 — Match the codebase's conventions, even if you disagree
Conformance > taste inside the codebase.
If you genuinely think a convention is harmful, surface it. Don't fork silently.

## Rule 12 — Fail loud
"Completed" is wrong if anything was skipped silently.
"Tests pass" is wrong if any were skipped.
Default to surfacing uncertainty, not hiding it.

## Commands

```bash
npm run dev       # start dev server
npm run build     # type-check then build to dist/
npm run preview   # preview the production build
```

There is no lint or test script configured.

## Architecture

Fully client-side Vue 3 + TypeScript SPA. No backend — all state lives in browser `localStorage` via **Pinia** with `pinia-plugin-persistedstate` (every store opts in with `{ persist: true }`).

Deployed to GitHub Pages at `/wedding-app/`, so the router uses `createWebHashHistory`.

### Stores (`src/stores/`)

Six Pinia stores, each owning a slice of the `WeddingSnapshot` shape:

| Store | Key state |
|-------|-----------|
| `useGuestStore` | `guests[]` |
| `useSeatingStore` | `tables[]` (with nested `seats[]`) |
| `useRoomStore` | `rooms[]` |
| `useMenuStore` | `menuOptions[]` |
| `useGroupStore` | `groups[]` |
| `useAppConfigStore` | `coupleName`, `weddingDate`, `venue` |

**Critical invariant**: `Guest.tableId` and `Table.seats[].guestId` are kept in sync by `useSeatingStore` methods (`assignGuest`, `unassignGuest`, `swapSeats`, `deleteTable`). Always go through the seating store when moving guests between seats — never patch both stores manually.

Each table has two independent position systems: `posX/posY` for the manage (card) view and `aerialPosX/aerialPosY` for the aerial (floor-plan) view. Rotation only applies to the aerial view.

### Data model (`src/types/index.ts`)

`WeddingSnapshot` is both the in-memory shape and the JSON export format (version field is `1`). Import/export logic lives in `src/composables/useStateSnapshot.ts`.

### Pages (`src/pages/`)

Routes map 1-to-1 to page components. The seating page has three view modes toggled by a radio group: `manage` (draggable cards), `aerial` (floor plan with drag-to-assign), and `print` (CSS print-optimised grid).

### UI conventions

- Component library: **Naive UI** (`n-*` components)
- Icons: **lucide-vue-next**
- Path alias: `@` → `src/`
- All components use `<script setup lang="ts">`
