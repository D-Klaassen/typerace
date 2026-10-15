# Typerace

A multiplayer typing game. Race your friends Online in a Room, or pass one keyboard around. Three Modes: Classic Race, Crazy Darts and Time Trial, with an optional Finger Guide that shows which finger should press the next key.

- [`CONTEXT.md`](CONTEXT.md): the domain language (Player, Room, Match, Turn, Time Bank, …)
- [`docs/spec.md`](docs/spec.md): what v1 does
- [`docs/adr/`](docs/adr/): decisions that are hard to reverse

## Develop

Requires Node 24 and pnpm 11 (`corepack enable`).

```bash
pnpm install
pnpm dev
```

`pnpm dev` runs the web app on http://localhost:3000 and the Rooms server (`wrangler dev`) on port 8787.

Before every commit, `pnpm check` must pass: formatting, lint, typecheck, unit tests and the Playwright tests.

## Layout

| Path                | What                                                   |
| ------------------- | ------------------------------------------------------ |
| `apps/web`          | Next.js app: every screen, and Shared Keyboard play    |
| `apps/rooms`        | PartyServer on Cloudflare: one Durable Object per Room |
| `packages/game`     | The game rules as pure TypeScript, used by both apps   |
| `packages/protocol` | Room codes and the messages between browser and Room   |

## Deploy

The web app runs on Vercel and the Rooms server on Cloudflare. The first time, run the wizard; it walks you through logging in, deploying the Rooms server and creating the Vercel project:

```bash
scripts/deploy-wizard.sh
```

After that:

- Every push to `main` deploys the web app (Vercel's GitHub link).
- Every push to `main` that touches `apps/rooms`, `packages/game`, `packages/protocol` or `pnpm-lock.yaml` deploys the Rooms server ([`.github/workflows/deploy-rooms.yml`](.github/workflows/deploy-rooms.yml)). It needs the repo secret `CLOUDFLARE_API_TOKEN`: a Cloudflare API token from the "Edit Cloudflare Workers" template. Run it by hand from the Actions tab (Deploy Rooms → Run workflow) when needed.
- To deploy the Rooms server from your own machine instead: `pnpm deploy:rooms`, after `export CLOUDFLARE_API_TOKEN=…` or `pnpm --filter rooms exec wrangler login` once.
- `NEXT_PUBLIC_ROOMS_HOST` is baked into the web app at build time: after changing it in Vercel, redeploy.

Live: https://typerace-puce.vercel.app
