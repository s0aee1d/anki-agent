import "./env.js";
import { createServer, request as httpRequest, IncomingMessage } from "node:http";
import type { Socket } from "node:net";
import { getRequestListener } from "@hono/node-server";
import { Hono } from "hono";
import { authRequest, authStatus, deviceFromCookieHeader } from "./auth.js";

/**
 * Approval gate in front of code-server: same device list and cookie as the Anki
 * app, so a device approved once works on both. Everything is proxied once the
 * cookie belongs to an approved device.
 */
const TARGET = { host: "127.0.0.1", port: Number(process.env.GATE_TARGET_PORT ?? 8080) };
const port = Number(process.env.GATE_PORT ?? 8081);

const PAGE = `<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1">
<title>Access required</title>
<style>body{font:16px system-ui;max-width:420px;margin:15vh auto;padding:0 16px;text-align:center}
button{font:inherit;padding:12px 20px;border-radius:10px;border:0;background:#2563eb;color:#fff}
#id{font-size:2rem;font-weight:700;letter-spacing:.1em;margin:16px 0}#m{color:#666}</style>
<h2>Access required</h2><div id=b></div>
<script>
const b=document.getElementById("b");
async function j(u,o){const r=await fetch(u,o);return r.json()}
function show(s){
  if(s.state==="approved")return location.reload();
  if(s.state==="pending"){b.innerHTML='<p id=m>Waiting for approval. Device ID:</p><div id=id></div>';document.getElementById("id").textContent=s.id;return}
  b.innerHTML='<p id=m>This device is not approved yet.</p><button>Request access</button>';
  b.querySelector("button").onclick=async()=>{const r=await j("/_gate/request",{method:"POST"});r.error?(b.querySelector("#m").textContent=r.error):show(r)};
}
j("/_gate/status").then(show);
setInterval(async()=>{const s=await j("/_gate/status");if(s.state!=="none")show(s)},3000);
</script>`;

const app = new Hono();
app.get("/_gate/status", authStatus);
app.post("/_gate/request", authRequest);
const gateListener = getRequestListener(app.fetch);

const isApproved = (req: IncomingMessage) => deviceFromCookieHeader(req.headers.cookie)?.approved === true;

/** Don't hand our device cookie to the upstream app. */
function upstreamHeaders(req: IncomingMessage) {
  const headers = { ...req.headers };
  if (headers.cookie) {
    headers.cookie = headers.cookie.split(/;\s*/).filter((c) => !c.startsWith("anki_device=")).join("; ");
    if (!headers.cookie) delete headers.cookie;
  }
  return headers;
}

const server = createServer((req, res) => {
  if (req.url?.startsWith("/_gate/")) return void gateListener(req, res);
  if (!isApproved(req)) {
    const html = req.method === "GET" && req.headers.accept?.includes("text/html");
    res.writeHead(401, { "Content-Type": html ? "text/html; charset=utf-8" : "text/plain" });
    return void res.end(html ? PAGE : "unauthorized");
  }
  const up = httpRequest({ ...TARGET, method: req.method, path: req.url, headers: upstreamHeaders(req) }, (r) => {
    res.writeHead(r.statusCode ?? 502, r.headers);
    r.pipe(res);
  });
  up.on("error", () => {
    if (!res.headersSent) res.writeHead(502);
    res.end("upstream unavailable");
  });
  req.pipe(up);
});

server.on("upgrade", (req, socket: Socket, head) => {
  if (!isApproved(req)) {
    socket.end("HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n");
    return;
  }
  const up = httpRequest({ ...TARGET, method: req.method, path: req.url, headers: upstreamHeaders(req) });
  up.on("upgrade", (r, upSocket, upHead) => {
    const lines = [`HTTP/1.1 ${r.statusCode} ${r.statusMessage}`];
    for (let i = 0; i < r.rawHeaders.length; i += 2) lines.push(`${r.rawHeaders[i]}: ${r.rawHeaders[i + 1]}`);
    socket.write(lines.join("\r\n") + "\r\n\r\n");
    if (upHead.length) socket.write(upHead);
    upSocket.pipe(socket).pipe(upSocket);
    upSocket.on("error", () => socket.destroy());
    socket.on("error", () => upSocket.destroy());
  });
  up.on("response", (r) => {
    // Upstream refused the upgrade (e.g. its own login): relay the plain reply.
    const lines = [`HTTP/1.1 ${r.statusCode} ${r.statusMessage}`];
    for (let i = 0; i < r.rawHeaders.length; i += 2) lines.push(`${r.rawHeaders[i]}: ${r.rawHeaders[i + 1]}`);
    socket.write(lines.join("\r\n") + "\r\n\r\n");
    r.pipe(socket);
  });
  up.on("error", () => socket.destroy());
  up.end(head);
});

server.listen(port, "127.0.0.1", () => console.log(`gate on http://127.0.0.1:${port} -> ${TARGET.host}:${TARGET.port}`));
