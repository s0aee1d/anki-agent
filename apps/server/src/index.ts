import "./env.js";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import * as anki from "./anki.js";
import { authLogout, authRequest, authStatus, requireDevice } from "./auth.js";
import { streamChat } from "./chat.js";

const app = new Hono();

app.onError((err, c) => c.json({ error: err.message }, 502));

app.use("/api/*", requireDevice);
app.get("/api/auth/status", authStatus);
app.post("/api/auth/request", authRequest);
app.post("/api/auth/logout", authLogout);

app.get("/api/health", async (c) => c.json({ ankicli: await anki.health() }));

app.get("/api/decks", async (c) => c.json(await anki.listDecks()));

app.get("/api/study/next", async (c) => {
  const deck = c.req.query("deck");
  if (!deck) return c.json({ error: "deck is required" }, 400);
  return c.json(await anki.nextCard(deck));
});

app.post("/api/study/answer", async (c) => {
  const { cardId, ease } = await c.req.json<{ cardId: number; ease: 1 | 2 | 3 | 4 }>();
  if (![1, 2, 3, 4].includes(ease)) return c.json({ error: "ease must be 1-4" }, 400);
  return c.json({ ok: await anki.answerCard(cardId, ease) });
});

app.post("/api/sync", async (c) => {
  await anki.sync();
  return c.json({ ok: true, at: Date.now() });
});

app.post("/api/chat", async (c) => {
  const { message } = await c.req.json<{ message?: string }>();
  if (!message?.trim()) return c.json({ error: "message is required" }, 400);
  return streamChat(message, c.req.raw.signal);
});

app.get("/api/media/:name", async (c) => {
  const name = c.req.param("name");
  if (name.includes("/") || name.includes("..")) return c.text("bad name", 400);
  const data = await anki.getMedia(name);
  if (!data) return c.text("not found", 404);
  return new Response(new Uint8Array(data), { headers: { "Cache-Control": "private, max-age=3600" } });
});

const port = Number(process.env.PORT ?? 3001);
const hostname = process.env.HOST ?? "127.0.0.1";
serve({ fetch: app.fetch, port, hostname }, () => {
  console.log(`server on http://${hostname}:${port}`);
});
