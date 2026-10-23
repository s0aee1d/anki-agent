import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { Context, MiddlewareHandler } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";

export const DEVICES_FILE =
  process.env.DEVICES_FILE ?? fileURLToPath(new URL("../../../data/devices.json", import.meta.url));

const COOKIE = "anki_device";
const MAX_PENDING = 10;
const PENDING_TTL_MS = 24 * 3600_000;
const ID_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export interface Device {
  id: string;
  approved: boolean;
  name: string;
  ip: string;
  requestedAt: string;
  tokenHash: string;
}

let cache: { mtime: number; devices: Device[] } | null = null;

export function loadDevices(): Device[] {
  if (!existsSync(DEVICES_FILE)) return [];
  const mtime = statSync(DEVICES_FILE).mtimeMs;
  if (cache?.mtime === mtime) return cache.devices;
  let devices: Device[] = [];
  try {
    devices = JSON.parse(readFileSync(DEVICES_FILE, "utf8")).devices ?? [];
  } catch {
    // Mid-edit or malformed: keep the last good copy rather than locking everyone out or in.
    return cache?.devices ?? [];
  }
  cache = { mtime, devices };
  return devices;
}

export function saveDevices(devices: Device[]) {
  mkdirSync(dirname(DEVICES_FILE), { recursive: true });
  const tmp = `${DEVICES_FILE}.tmp`;
  writeFileSync(tmp, JSON.stringify({ devices }, null, 2) + "\n", { mode: 0o600 });
  renameSync(tmp, DEVICES_FILE);
  cache = null;
}

const hash = (s: string) => createHash("sha256").update(s).digest("hex");

function newId() {
  const b = randomBytes(8);
  const c = Array.from(b, (x) => ID_ALPHABET[x % ID_ALPHABET.length]).join("");
  return `${c.slice(0, 4)}-${c.slice(4)}`;
}

/** Returns the device behind a raw `Cookie` header, or null if the cookie is missing/forged. */
export function deviceFromCookieHeader(header: string | undefined): Device | null {
  const raw = header?.match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`))?.[1];
  return raw ? deviceFromToken(raw) : null;
}

const deviceFor = (c: Context): Device | null => {
  const raw = getCookie(c, COOKIE);
  return raw ? deviceFromToken(raw) : null;
};

function deviceFromToken(raw: string): Device | null {
  const dot = raw.indexOf(".");
  if (dot < 1) return null;
  const device = loadDevices().find((d) => d.id === raw.slice(0, dot));
  if (!device) return null;
  const a = Buffer.from(hash(raw.slice(dot + 1)));
  const b = Buffer.from(device.tokenHash);
  return a.length === b.length && timingSafeEqual(a, b) ? device : null;
}

export const stateOf = (d: Device | null) => (!d ? "none" : d.approved ? "approved" : "pending");

export const requireDevice: MiddlewareHandler = async (c, next) => {
  if (c.req.path.startsWith("/api/auth/")) return next();
  if (deviceFor(c)?.approved) return next();
  return c.json({ error: "unauthorized" }, 401);
};

export function authStatus(c: Context) {
  const d = deviceFor(c);
  return c.json({ state: stateOf(d), id: d?.id });
}

export function authRequest(c: Context) {
  const existing = deviceFor(c);
  if (existing) return c.json({ state: stateOf(existing), id: existing.id });

  const now = Date.now();
  const devices = loadDevices().filter((d) => d.approved || now - Date.parse(d.requestedAt) < PENDING_TTL_MS);
  if (devices.filter((d) => !d.approved).length >= MAX_PENDING) {
    return c.json({ error: "Too many pending requests. Try again later." }, 429);
  }

  const secret = randomBytes(32).toString("hex");
  const device: Device = {
    id: newId(),
    approved: false,
    name: (c.req.header("user-agent") ?? "unknown").slice(0, 120),
    ip: (c.req.header("x-forwarded-for") ?? "unknown").split(",")[0].trim().slice(0, 64),
    requestedAt: new Date(now).toISOString(),
    tokenHash: hash(secret),
  };
  saveDevices([...devices, device]);

  setCookie(c, COOKIE, `${device.id}.${secret}`, {
    httpOnly: true,
    sameSite: "Strict",
    secure: c.req.header("x-forwarded-proto") === "https",
    path: "/",
    maxAge: 400 * 24 * 3600,
  });
  return c.json({ state: "pending", id: device.id });
}

export function authLogout(c: Context) {
  deleteCookie(c, COOKIE, { path: "/" });
  return c.json({ ok: true });
}
