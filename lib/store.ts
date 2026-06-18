// Tiny pluggable persistence for connection tokens.
//
// Production (Vercel/serverless): set the relevant *_REFRESH_TOKEN env var —
// file writes there are ephemeral and not shared across instances.
// Local dev: tokens obtained via the OAuth flow are cached to a JSON file.
import { promises as fs } from "fs";
import path from "path";
import os from "os";

const FILE = path.join(os.tmpdir(), "hey-sello-connections.json");

type Store = Record<string, unknown>;

async function readAll(): Promise<Store> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8"));
  } catch {
    return {};
  }
}

export async function getStored<T>(key: string): Promise<T | null> {
  const all = await readAll();
  return (all[key] as T) ?? null;
}

export async function setStored(key: string, value: unknown): Promise<void> {
  const all = await readAll();
  all[key] = value;
  await fs.writeFile(FILE, JSON.stringify(all, null, 2));
}
