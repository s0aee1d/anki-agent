import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("node:child_process", () => ({ execFile: vi.fn() }));
vi.mock("node:fs/promises", () => ({ readFile: vi.fn() }));

let m: typeof import("./anki.js");

type Handler = (file: string, args: string[]) => { stdout?: string; stderr?: string; code?: string };

const ok = (data: unknown) => ({ stdout: JSON.stringify({ ok: true, data, error: null }) });
const fail = (message: string) => ({ stdout: JSON.stringify({ ok: false, data: null, error: { code: "X", message } }) });

const calls: { file: string; args: string[] }[] = [];

function stub(handler: Handler) {
  calls.length = 0;
  vi.mocked(execFile).mockImplementation(((file: string, args: string[], _o: unknown, cb: Function) => {
    calls.push({ file, args });
    const r = handler(file, args);
    if (r.code) cb(Object.assign(new Error("spawn"), { code: r.code }), "", "");
    else cb(null, r.stdout ?? "", r.stderr ?? "");
  }) as never);
}

const COLLECTION = { collection_path: "/c/collection.anki2" };

beforeEach(async () => {
  vi.resetAllMocks();
  vi.resetModules();
  m = await import("./anki.js");
});

describe("anki", () => {
  it("ankicli runs the CLI with --json and returns data", async () => {
    stub(() => ok({ a: 1 }));
    await expect(m.ankicli("deck", "list")).resolves.toEqual({ a: 1 });
    expect(calls[0].args).toEqual(["--json", "deck", "list"]);
  });

  it("ankicli explains when the binary is missing", async () => {
    stub(() => ({ code: "ENOENT" }));
    await expect(m.ankicli("deck", "list")).rejects.toThrow(/Cannot run ankicli/);
  });

  it("ankicli surfaces error envelopes", async () => {
    stub(() => fail("collection locked"));
    await expect(m.ankicli("deck", "list")).rejects.toThrow("collection locked");
  });

  it("tolerates python-anki's stdout stack dump before the envelope", async () => {
    stub(() => ({ stdout: 'blocked main thread for 250ms:\n  File "x", line 1\n' + ok({ a: 1 }).stdout }));
    await expect(m.ankicli("deck", "list")).resolves.toEqual({ a: 1 });
  });

  it("listDecks runs the bridge once", async () => {
    stub((_f, a) => (a.includes("collection") ? ok(COLLECTION) : { stdout: '[{"deck_id": 1}]\n' }));
    await expect(m.listDecks()).resolves.toEqual([{ deck_id: 1 }]);
    expect(calls.at(-1)?.args.slice(-2)).toEqual(["/c/collection.anki2", "decks"]);
  });

  it("nextCard passes the deck name through to the bridge", async () => {
    stub((_f, a) => (a.includes("collection") ? ok(COLLECTION) : { stdout: '{"card": null, "remaining": 0}' }));
    await expect(m.nextCard('My "Deck"')).resolves.toEqual({ card: null, remaining: 0 });
    expect(calls.at(-1)?.args.slice(-3)).toEqual(["/c/collection.anki2", "next", 'My "Deck"']);
  });

  it("answerCard applies the answer through the bridge", async () => {
    stub((_f, a) => (a.includes("collection") ? ok(COLLECTION) : { stdout: '{"ok": true}' }));
    await expect(m.answerCard(1, 3)).resolves.toBe(true);
    expect(calls.at(-1)?.args.slice(-4)).toEqual(["/c/collection.anki2", "answer", "1", "3"]);
  });

  it("getMedia reads the resolved file and returns null when missing", async () => {
    stub(() => ok({ path: "/c/collection.media/a.png" }));
    vi.mocked(readFile).mockResolvedValue(Buffer.from("hi"));
    expect((await m.getMedia("a.png"))?.toString()).toBe("hi");
    stub(() => fail('Media file "nope" was not found'));
    await expect(m.getMedia("nope")).resolves.toBeNull();
  });

  it("sync runs ankicli sync run", async () => {
    stub(() => ok({ performed: true }));
    await m.sync();
    expect(calls[0].args).toEqual(["--json", "sync", "run"]);
  });
});
