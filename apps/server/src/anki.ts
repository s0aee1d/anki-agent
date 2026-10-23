import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const ANKICLI = process.env.ANKICLI_BIN ?? "ankicli";
const PYTHON = process.env.ANKI_PYTHON ?? "python3";
const REVIEW_SCRIPT = fileURLToPath(new URL("../py/review.py", import.meta.url));

interface Envelope<T> {
  ok: boolean;
  data: T | null;
  error: { code: string; message: string } | null;
}

// Every call opens the collection, so run them one at a time to avoid lock errors.
let queue: Promise<unknown> = Promise.resolve();
function serial<T>(job: () => Promise<T>): Promise<T> {
  const run = queue.then(job, job);
  queue = run.catch(() => undefined);
  return run;
}

function exec(file: string, args: string[]): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    execFile(file, args, { maxBuffer: 64 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err && (err as NodeJS.ErrnoException).code === "ENOENT") {
        reject(new Error(`Cannot run ${file}. Is it installed and on PATH?`));
      } else if (err && !stdout) {
        reject(new Error(stderr.trim() || err.message));
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

// python-anki prints a "blocked main thread" stack dump to stdout when a call is slow;
// the envelope is the pretty-printed object starting on a line of its own.
function parseJson<T>(stdout: string): T {
  const start = /^[{[]/m.exec(stdout)?.index ?? 0;
  return JSON.parse(stdout.slice(start)) as T;
}

export function ankicli<T = unknown>(...args: string[]): Promise<T> {
  return serial(async () => {
    const { stdout } = await exec(ANKICLI, ["--json", ...args]);
    const env = parseJson<Envelope<T>>(stdout);
    if (!env.ok || env.data === null) throw new Error(env.error?.message ?? "ankicli failed");
    return env.data;
  });
}

let collectionPath: Promise<string> | undefined;
function resolveCollection(): Promise<string> {
  collectionPath ??= ankicli<{ collection_path: string }>("collection", "info")
    .then((i) => i.collection_path)
    .catch((e) => {
      collectionPath = undefined;
      throw e;
    });
  return collectionPath;
}

async function study<T>(op: string, ...args: (string | number)[]): Promise<T> {
  const path = await resolveCollection();
  return serial(async () => {
    const { stdout } = await exec(PYTHON, ["-I", REVIEW_SCRIPT, path, op, ...args.map(String)]);
    return parseJson<T>(stdout.trim().split("\n").at(-1) ?? "");
  });
}

export interface DeckStats {
  deck_id: number;
  name: string;
  new_count: number;
  learn_count: number;
  review_count: number;
  total_in_deck: number;
}

export interface CardInfo {
  cardId: number;
  noteId: number;
  deckName: string;
  question: string;
  answer: string;
  css: string;
  /** Card template index (0-based); Anki styles cards via `.card{ord+1}`. */
  ord: number;
}

export const listDecks = () => study<DeckStats[]>("decks");

export const nextCard = (deck: string) => study<{ card: CardInfo | null; remaining: number }>("next", deck);

export async function answerCard(cardId: number, ease: 1 | 2 | 3 | 4): Promise<boolean> {
  const { ok } = await study<{ ok: boolean }>("answer", cardId, ease);
  return ok;
}

export async function getMedia(filename: string): Promise<Buffer | null> {
  let path: string;
  try {
    ({ path } = await ankicli<{ path: string }>("media", "resolve-path", "--name", filename));
  } catch (e) {
    if (e instanceof Error && /not found/i.test(e.message)) return null;
    throw e;
  }
  return readFile(path);
}

export const sync = () => ankicli("sync", "run");

export const health = () => ankicli<{ note_count: number }>("collection", "info");
