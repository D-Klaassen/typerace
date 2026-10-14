# Typerace

A multiplayer typing game. Read these before changing anything:

- `CONTEXT.md`: the domain glossary. Use its terms in code, tests and UI copy.
- `docs/spec.md`: the v1 spec and the build order.
- `docs/adr/`: decisions that are hard to reverse.

## Layout

- `apps/web`: Next.js 16 (App Router). See `apps/web/AGENTS.md` and read the bundled docs in `apps/web/node_modules/next/dist/docs/` before writing Next.js code.
- `packages/game`: the game rules as pure TypeScript. No React, no networking, and no reading the clock: time is always passed in.
- `apps/rooms` (later): PartyServer Rooms on Cloudflare.

## Checks

Run `pnpm check` (format, lint, typecheck, test) before every commit; it must be green. `pnpm format` fixes formatting.

All user-facing text goes through next-intl (`apps/web/messages/en.json`), never hard-coded in components.
