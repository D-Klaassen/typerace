# Realtime transport for Rooms and Matches

Researched 2026-10-13. Prices, limits and beta status change often, so re-check the linked pages before deciding.

**Workload assumed:** up to 6 Players per Room, each sending progress about 5 times per second. A 2-minute Match is then about 3,600 client messages. In Crazy Darts, damage and HP should be decided by the server.

## 1. WebSockets on Vercel Functions (Fluid Compute)

- **Status:** public beta since 2026-06-22 ([changelog](https://vercel.com/changelog/websocket-support-is-now-in-public-beta)). Next.js has no upgrade API of its own, so you use `experimental_upgradeWebSocket()` from `@vercel/functions`. It "only works on the Vercel platform" ([API ref](https://vercel.com/docs/functions/functions-api-reference/vercel-functions-package)).
- **Room state:** a connection stays on one instance, but new connections and reconnects can land on any instance. Two Players in the same Room may therefore sit on different instances. Vercel says to keep rooms, presence and pub/sub in an external store such as Redis ([docs](https://vercel.com/docs/functions/websockets), [KB](https://vercel.com/kb/guide/do-vercel-serverless-functions-support-websocket-connections)). So yes, Redis pub/sub is required. No single process owns a Room. HP changes have to be atomic Redis operations, and Match timers need their own coordination.
- **Duration:** connections close when the function hits its max duration. That is 300 s on Hobby, and 800 s (1800 s in beta) on Pro ([limits](https://vercel.com/docs/functions/limitations)). A 5-minute cap means clients must reconnect during long sessions.
- **Free tier:** Hobby includes 4 h Active CPU, 360 GB-hrs Provisioned Memory and 1M invocations per month, for non-commercial use only ([fair use](https://vercel.com/docs/limits/fair-use-guidelines)). An open connection keeps its instance's memory billable ([KB](https://vercel.com/kb/guide/do-vercel-serverless-functions-support-websocket-connections)). At 2 GB per instance, 360 GB-hrs covers about 180 instance-hours. Upstash Redis Free allows 500K commands per month ([pricing](https://upstash.com/pricing/redis)). If every progress message becomes a `PUBLISH`, that is roughly 140 Matches per month.
- **Latency:** one Function region, plus a Redis hop for each relayed message.
- **Local dev:** requires `vc dev` (Vercel CLI 54.14.2 or later) instead of `next dev` ([API ref](https://vercel.com/docs/functions/functions-api-reference/vercel-functions-package)), plus a local or remote Redis.
- **Infra / lock-in:** adds Redis. Locked in to a Vercel-only experimental API.

## 2. Cloudflare Durable Objects via PartyServer (one object per Room)

- **PartyKit status:** the hosted PartyKit platform stops deploys on 2026-10-16 and shuts down on 2026-10-23. PartyServer on your own Cloudflare account is the successor ([notice](https://docs.partykit.io/), [migration guide](https://docs.partykit.io/guides/migrate-to-partyserver/)). PartyServer is a `Server` class on top of `DurableObject` with `onConnect`, `onMessage` and `broadcast` ([repo](https://github.com/cloudflare/partykit/tree/main/packages/partyserver)).
- **Room state:** each object has a globally unique name and is single-threaded. Cloudflare names multiplayer games as a use case ([overview](https://developers.cloudflare.com/durable-objects/what-are-durable-objects/)). One object per Room code becomes the authoritative game server, holding HP in memory and SQLite storage. Hibernation resets in-memory state ([WebSockets](https://developers.cloudflare.com/durable-objects/best-practices/websockets/)), so persist what must survive idle periods.
- **Duration:** no fixed connection cap is documented. Each incoming message resets the 30 s CPU budget ([limits](https://developers.cloudflare.com/durable-objects/platform/limits/)). Every deploy restarts objects and drops sockets ([WebSockets](https://developers.cloudflare.com/durable-objects/best-practices/websockets/)).
- **Free tier:** the Free plan includes SQLite-backed objects only. Daily limits are 100K requests and 13,000 GB-s, and incoming WebSocket messages count 20:1 as requests ([pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/)). A Match is therefore about 180 billable requests, or about 500 Matches per day.
- **Latency:** each object is created near the first request, which is the Host, and can take a location hint ([data location](https://developers.cloudflare.com/durable-objects/reference/data-location/)). Clients connect directly, with no extra relay hop.
- **Local dev:** `npx wrangler dev` ([migration guide](https://docs.partykit.io/guides/migrate-to-partyserver/)) runs Durable Objects locally on the production runtime ([dev docs](https://developers.cloudflare.com/workers/development-testing/)). It runs alongside `next dev`.
- **Infra / lock-in:** adds a second deploy target (Cloudflare Worker) with no extra datastore. Locked in to the Durable Objects API.

## 3. Hosted pub/sub (Ably, Pusher, Liveblocks, Supabase Realtime)

- **Server ownership:** you write no code on the message path. Clients publish progress straight to a Room channel. Damage has to go through a Next.js route that validates the word, updates HP atomically in a store, and then publishes the result with a server key. Clients get subscribe-only rights on the state channel:
  - Ably capabilities ([docs](https://ably.com/docs/auth/capabilities))
  - Liveblocks `storage:read` with server-side JSON Patch ([permissions](https://liveblocks.io/docs/authentication/permissions), [REST](https://liveblocks.io/docs/guides/modifying-storage-via-rest-api-with-json-patch))
  - Supabase RLS on `realtime.messages`, whose examples assume signed-in users ([authorization](https://supabase.com/docs/guides/realtime/authorization))
  - Pusher client events need private or presence channels and are capped at 10 per second per client ([events](https://pusher.com/docs/channels/using_channels/events/))

  Each hit therefore costs an HTTP round trip plus a store write, and you still need Redis or a database.
- **Free tiers:**
  - Ably: 6M messages per month and 200 connections ([free](https://ably.com/docs/pricing/free)). Fan-out and echo are counted ([counting](https://ably.com/docs/platform/pricing/message-counting)), so a Match is about 25K messages, or about 240 Matches per month.
  - Supabase: 2M messages per month and 200 connections. Delivered copies count, so that is about 90 Matches per month. Projects pause after a week of inactivity ([pricing](https://supabase.com/pricing), [counting](https://supabase.com/docs/guides/platform/manage-your-usage/realtime-messages)).
  - Pusher Sandbox: 200K messages per day and 100 connections ([pricing](https://pusher.com/channels/pricing/)).
  - Liveblocks Free: 10 connections per room, and the watermark must stay visible ([pricing](https://liveblocks.io/pricing)).
- **Latency:** good for relayed progress. Damage adds a Function plus store hop.
- **Local dev:** depends on cloud accounts and keys.
- **Infra / lock-in:** adds a vendor plus a state store. Locked in to proprietary SDKs.

## 4. Own Node server with Socket.IO

- **Room state:** rooms are built in. One process holds authoritative in-memory state. Only multi-server setups need the Redis adapter ([rooms](https://socket.io/docs/v4/rooms/)), and this scale doesn't.
- **Duration:** none.
- **Hosting cost:**
  - Fly.io has no free tier for new orgs. The smallest always-on machine costs about $2.19 per month ([pricing](https://docs.fly.io/about/pricing)).
  - Railway Free gives $1 of credit per month, and Hobby costs $5 per month ([plans](https://docs.railway.com/reference/pricing/plans)).
  - Render Free spins down after 15 minutes without traffic and takes about a minute to wake ([free](https://render.com/docs/free)).
- **Latency:** one region you pick (for example Amsterdam), with direct connections.
- **Local dev:** just a Node process.
- **Infra / lock-in:** adds a server to run, patch and monitor. Lowest lock-in of the four.

## Summary

| Option | Server-owned state | Free tier fit | Extra infra | Lock-in |
|---|---|---|---|---|
| Vercel WebSockets | Via Redis, no single owner | Tight (Redis commands, 300 s cap) | Redis | Vercel, experimental API |
| Durable Objects | Native, one object per Room | Generous | Cloudflare Worker | Cloudflare |
| Hosted pub/sub | Via Function and store | Fan-out drains quotas | Vendor plus store | Vendor SDK |
| Socket.IO server | Native, in-process | Small paid host | VM/container | Low |

## Recommendation

Use **Cloudflare Durable Objects with PartyServer** (and `partysocket` on the client), with one object per Room, next to the Next.js app on Vercel. Do not use hosted PartyKit, which shuts down on 2026-10-23.

- **Fits the model:** a Room maps directly onto a single-threaded object with a unique name. HP, damage and drop-outs are decided in one place without distributed locking.
- **Free tier:** the Free plan covers hundreds of Matches per day. Its 20:1 billing of incoming messages suits frequent progress updates.
- **Simple:** no Redis, no connection-duration cap, and `wrangler dev` gives realistic local testing.

Vercel WebSockets are not a good fit yet. They are beta, the Next.js API is experimental, Hobby cuts connections at 300 s, and the mandatory Redis has no single Room owner. Hosted pub/sub works for relaying progress, but server-owned damage then needs a second path, and fan-out counting burns through free quotas.

**Fallback:** if Cloudflare lock-in becomes a concern, a Socket.IO server on a small paid host (a few dollars a month) gives the same authoritative-Room model with the least lock-in.
