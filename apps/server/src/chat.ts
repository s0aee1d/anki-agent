const GATEWAY = process.env.OPENCLAW_URL ?? "http://127.0.0.1:18789";
const PASSWORD = process.env.OPENCLAW_PASSWORD ?? "";
const AGENT = process.env.OPENCLAW_AGENT ?? "anki";
const SESSION_USER = process.env.OPENCLAW_SESSION_USER ?? "anki-pwa";

/**
 * Forwards one user message to the OpenClaw gateway (OpenAI-compatible endpoint)
 * and returns the raw SSE response. The gateway keeps the conversation under a
 * stable session derived from `user`, so only the latest message is sent.
 */
export async function streamChat(message: string, signal?: AbortSignal): Promise<Response> {
  if (!PASSWORD) {
    return Response.json({ error: "OPENCLAW_PASSWORD is not set on the server" }, { status: 500 });
  }
  let upstream: Response;
  try {
    upstream = await fetch(`${GATEWAY}/v1/chat/completions`, {
      method: "POST",
      signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PASSWORD}`,
        "x-openclaw-agent-id": AGENT,
      },
      body: JSON.stringify({
        model: `openclaw:${AGENT}`,
        stream: true,
        user: SESSION_USER,
        messages: [{ role: "user", content: message }],
      }),
    });
  } catch {
    return Response.json(
      { error: `Cannot reach the OpenClaw gateway at ${GATEWAY}. Is it running?` },
      { status: 502 },
    );
  }
  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => "");
    return Response.json(
      { error: `OpenClaw returned ${upstream.status}${text ? `: ${text.slice(0, 300)}` : ""}` },
      { status: 502 },
    );
  }
  return new Response(upstream.body, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
  });
}
