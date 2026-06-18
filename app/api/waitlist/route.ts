import { promises as fs } from "fs";
import path from "path";
import os from "os";

export const runtime = "nodejs";

// Minimal, dependency-free waitlist store. Writes signups to a JSON file and,
// if FORMSPREE_ID is set, also forwards them so you get email + a dashboard.
// Swap the file store for Postgres/KV by replacing `persist()` — the API shape
// stays the same.
const STORE = path.join(os.tmpdir(), "hey-sello-waitlist.json");

async function persist(entry: { email: string; at: string }) {
  let list: unknown[] = [];
  try {
    list = JSON.parse(await fs.readFile(STORE, "utf8"));
  } catch {
    /* first write */
  }
  list.push(entry);
  await fs.writeFile(STORE, JSON.stringify(list, null, 2));
  return list.length;
}

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export async function POST(req: Request) {
  const { email } = (await req.json().catch(() => ({}))) as { email?: string };
  if (!email || !isEmail(email)) {
    return Response.json({ error: "Please enter a valid email." }, { status: 400 });
  }

  const count = await persist({ email, at: new Date().toISOString() });

  const formId = process.env.FORMSPREE_ID;
  if (formId) {
    try {
      await fetch(`https://formspree.io/f/${formId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch {
      /* non-fatal: the signup is already stored locally */
    }
  }

  return Response.json({ ok: true, position: count });
}
