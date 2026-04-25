# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
