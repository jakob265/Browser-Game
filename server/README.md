# Neon Hockey — signaling server (online multiplayer)

This tiny WebSocket server is the only piece you need to host for **online play
with a friend**. It just introduces the two players to each other; once they're
connected, the match runs **directly phone‑to‑phone over WebRTC** and no gameplay
passes through this server.

It handles **private rooms only**: one player creates a room (gets a 4‑letter
code), the other joins with that code.

## Run it locally (to test)

```bash
cd server
npm install
npm start        # listens on ws://localhost:8080
```

Then in the game's **Online** screen, set the Server URL to `ws://localhost:8080`
on both browsers/devices on the same machine/network.

## Deploy it for free (to play over the internet)

The game, when hosted over **HTTPS**, must talk to the server over **`wss://`**
(secure WebSocket) — browsers block insecure `ws://` from an HTTPS page. The
hosts below give you `wss://` automatically.

### Render.com (simple)
1. Push this repo to GitHub.
2. New → **Web Service** → connect the repo.
3. **Root Directory:** `server`  ·  **Build:** `npm install`  ·  **Start:** `npm start`.
4. Render gives you `https://yourapp.onrender.com` — use **`wss://yourapp.onrender.com`**
   as the Server URL in the game.

### Fly.io / Railway / Glitch / Cyclic
Any host that runs a Node process and exposes a WebSocket works. Use the `server/`
folder as the app root, `npm start` as the command, and the platform's
`wss://…` URL in the game. The server reads `PORT` from the environment.

## How players connect

1. Both players open the game and go to **Play → Online With a Friend**.
2. Both paste the **same** `wss://…` Server URL.
3. Player A taps **Create Room** and reads out the 4‑letter code.
4. Player B types the code and taps **Join**.
5. When connected, the match starts. Player B (the guest) sees the board flipped
   so they also play from the bottom.

## Notes & limits

- **1 match per room**, **2 players** (host + guest). The room is freed when the
  host leaves.
- The host's device is authoritative over the physics; the guest streams paddle
  input and renders the host's state with smoothing. Normal internet latency is
  hidden, but a very laggy connection will feel less crisp.
- Connections use Google's public STUN servers for NAT traversal. Most home
  networks work peer‑to‑peer; a small number of strict/symmetric NATs would need
  a TURN relay (not included — ask if you want that added).
- Skills/abilities are disabled online to keep both sides fair and in sync.
