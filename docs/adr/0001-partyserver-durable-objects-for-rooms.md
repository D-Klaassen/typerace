# Rooms run on Cloudflare Durable Objects via PartyServer

Each Online Room is one Cloudflare Durable Object (through PartyServer). It is the single owner of that Room's state: the text, each Player's progress, HP, Darts and who wins. The Next.js app itself is hosted on Vercel. We chose this because a Room needs one authoritative place that clients can't overrule. WebSockets on Vercel Functions would spread a Room over several instances and need Redis pub/sub, they were still in beta, and connections are cut after 300 s. Hosted pub/sub (Ably, Pusher, Liveblocks, Supabase) keeps the server out of the message path, and the free quotas only cover a few hundred Matches. A Socket.IO server has no real free hosting. Hosted PartyKit shuts down on 2026-10-23, so we use PartyServer on our own Cloudflare account. See `docs/research/realtime-transport.md`.

## Consequences

- There are two deploy targets, Vercel and Cloudflare, so local development runs `next dev` alongside `wrangler dev`.
- Clients send every keystroke to the Room. The Room decides progress, Typos, Darts and the winner, and the client only predicts locally so typing feels instant.
- If Cloudflare lock-in ever becomes a problem, the fallback is a Socket.IO server on a small paid host. The game rules must stay free of transport code so that move stays cheap.
