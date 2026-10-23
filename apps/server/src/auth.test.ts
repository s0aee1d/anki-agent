import { createHash } from "node:crypto";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Hono } from "hono";
import { describe, expect, it } from "vitest";

const secret = "s3cret";
const hash = (s: string) => createHash("sha256").update(s).digest("hex");
const dir = mkdtempSync(join(tmpdir(), "devices-"));
const file = join(dir, "devices.json");
const device = (id: string, approved: boolean) => ({
  id,
  approved,
  name: "t",
  ip: "1.1.1.1",
  requestedAt: new Date().toISOString(),
  tokenHash: hash(secret),
});

// auth.ts reads DEVICES_FILE at import time, so set it up first.
writeFileSync(file, JSON.stringify({ devices: [device("OKAY-0000", true), device("WAIT-0000", false)] }));
process.env.DEVICES_FILE = file;
const auth = await import("./auth.js");

describe("auth", () => {
  it("stateOf maps devices to states", () => {
    expect(auth.stateOf(null)).toBe("none");
    expect(auth.stateOf(device("A", false) as never)).toBe("pending");
    expect(auth.stateOf(device("A", true) as never)).toBe("approved");
  });

  it("deviceFromCookieHeader accepts a valid cookie", () => {
    expect(auth.deviceFromCookieHeader(`x=1; anki_device=OKAY-0000.${secret}`)?.id).toBe("OKAY-0000");
  });

  it("deviceFromCookieHeader rejects forged, malformed or missing cookies", () => {
    expect(auth.deviceFromCookieHeader("anki_device=OKAY-0000.wrong")).toBeNull();
    expect(auth.deviceFromCookieHeader("anki_device=nodot")).toBeNull();
    expect(auth.deviceFromCookieHeader("anki_device=GONE-0000.s3cret")).toBeNull();
    expect(auth.deviceFromCookieHeader(undefined)).toBeNull();
  });

  describe("requireDevice", () => {
    const app = new Hono();
    app.use("/api/*", auth.requireDevice);
    app.get("/api/auth/status", (c) => c.text("open"));
    app.get("/api/decks", (c) => c.text("secret"));
    const get = (path: string, cookie?: string) => app.request(path, { headers: cookie ? { cookie } : {} });

    it("lets auth routes through without a cookie", async () => {
      expect((await get("/api/auth/status")).status).toBe(200);
    });
    it("blocks anonymous and pending devices with 401", async () => {
      expect((await get("/api/decks")).status).toBe(401);
      expect((await get("/api/decks", `anki_device=WAIT-0000.${secret}`)).status).toBe(401);
    });
    it("allows approved devices", async () => {
      expect((await get("/api/decks", `anki_device=OKAY-0000.${secret}`)).status).toBe(200);
    });
  });
});
