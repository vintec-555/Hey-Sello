// Durable key/value storage.
// Uses Vercel KV / Upstash Redis (REST) when configured — required for the
// background poller, since serverless instances don't share a filesystem.
// Falls back to a local temp file for dev when no KV is set.
import { promises as fs } from "fs";
import path from "path";
import os from "os";

const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const FILE = path.join(os.tmpdir(), "hey-sello-store.json");

export function durable(): boolean {
  return Boolean(KV_URL && KV_TOKEN);
}

async function kv(cmd: string[]): Promise<unknown> {
  const r = await fetch(KV_URL!, {
    method: "POST",
    headers: { Authorization: `Bearer ${KV_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmd),
  });
  if (!r.ok) throw new Error(`KV error ${r.status}`);
  return (await r.json()).result;
}

async function readFile(): Promise<Record<string, unknown>> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8"));
  } catch {
    return {};
  }
}

export async function getStored<T>(key: string): Promise<T | null> {
  if (durable()) {
    const v = (await kv(["GET", key])) as string | null;
    return v ? (JSON.parse(v) as T) : null;
  }
  const all = await readFile();
  return (all[key] as T) ?? null;
}

export async function setStored(key: string, value: unknown): Promise<void> {
  if (durable()) {
    await kv(["SET", key, JSON.stringify(value)]);
    return;
  }
  const all = await readFile();
  all[key] = value;
  await fs.writeFile(FILE, JSON.stringify(all, null, 2));
}
