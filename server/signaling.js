/* Neon Hockey — WebRTC signaling server (private rooms).
 *
 * This is the only piece that must be hosted. It does NOT see or relay any
 * gameplay — it only introduces two players so they can open a direct
 * peer-to-peer WebRTC connection, then it gets out of the way.
 *
 * Protocol (JSON over WebSocket):
 *   client -> {type:"create"}                 => server -> {type:"created", room}
 *   client -> {type:"join", room}             => server -> {type:"joined"} (guest)
 *                                                server -> {type:"peer-joined"} (host)
 *   client -> {type:"signal", data}           => relayed to the other peer as {type:"signal", data}
 *   server -> {type:"error", reason}
 *   server -> {type:"peer-left"}              when the other side disconnects
 *
 * Run locally:  npm install && npm start   (listens on PORT, default 8080)
 */
const { WebSocketServer } = require("ws");

const PORT = process.env.PORT || 8080;
const wss = new WebSocketServer({ port: PORT });

const rooms = new Map(); // code -> { host, guest }

function code() {
  const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no easily-confused chars
  let c = "";
  do { c = Array.from({ length: 4 }, () => A[Math.floor(Math.random() * A.length)]).join(""); }
  while (rooms.has(c));
  return c;
}

function send(ws, obj) { try { ws.send(JSON.stringify(obj)); } catch (e) {} }

wss.on("connection", (ws) => {
  ws.room = null;
  ws.role = null;

  ws.on("message", (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch (e) { return; }

    if (msg.type === "create") {
      const c = code();
      rooms.set(c, { host: ws, guest: null });
      ws.room = c; ws.role = "host";
      send(ws, { type: "created", room: c });

    } else if (msg.type === "join") {
      const r = rooms.get((msg.room || "").toUpperCase());
      if (!r) return send(ws, { type: "error", reason: "Room not found" });
      if (r.guest) return send(ws, { type: "error", reason: "Room is full" });
      r.guest = ws; ws.room = (msg.room || "").toUpperCase(); ws.role = "guest";
      send(ws, { type: "joined" });
      send(r.host, { type: "peer-joined" }); // host begins the WebRTC offer

    } else if (msg.type === "signal") {
      const r = rooms.get(ws.room);
      if (!r) return;
      const peer = ws.role === "host" ? r.guest : r.host;
      if (peer) send(peer, { type: "signal", data: msg.data });
    }
  });

  ws.on("close", () => {
    const r = rooms.get(ws.room);
    if (!r) return;
    const peer = ws.role === "host" ? r.guest : r.host;
    if (peer) send(peer, { type: "peer-left" });
    // tear the room down when the host leaves; free the slot when a guest leaves
    if (ws.role === "host") rooms.delete(ws.room);
    else if (r.guest === ws) r.guest = null;
  });
});

console.log("Neon Hockey signaling server listening on port " + PORT);
