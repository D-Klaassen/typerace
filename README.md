# Typerace

A multiplayer typing game. Race your friends Online in a Room, or pass one keyboard around. Three Modes: Classic Race, Crazy Darts and Hot Seat, with an optional Finger Guide that shows which finger should press the next key.

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
- Every push to `main` that changes `apps/rooms`, `packages/game`, `packages/protocol` or the lockfile deploys the Rooms server too ([`.github/workflows/rooms.yml`](.github/workflows/rooms.yml)), after format, lint, typecheck and unit tests pass. Pull requests that touch them get the same checks. The workflow needs two repository settings, which the wizard sets for you:
  - the secret `CLOUDFLARE_API_TOKEN`: a Cloudflare API token from the "Edit Cloudflare Workers" template (Account Resources: your account; Zone Resources: all zones), set with `gh secret set CLOUDFLARE_API_TOKEN`;
  - the variable `CLOUDFLARE_ACCOUNT_ID`: the Account ID that `pnpm --filter rooms exec wrangler whoami` shows, set with `gh variable set CLOUDFLARE_ACCOUNT_ID --body <id>`.
- To deploy the Rooms server by hand, run `pnpm deploy:rooms` (Actions → Rooms → Run workflow also works). Wrangler needs the same token: `export CLOUDFLARE_API_TOKEN=…` first, or run `pnpm --filter rooms exec wrangler login` once.
- `NEXT_PUBLIC_ROOMS_HOST` is baked into the web app at build time: after changing it in Vercel, redeploy.

Live: https://typerace-puce.vercel.app
