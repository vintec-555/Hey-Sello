import { getBusinessProfile, saveBusinessProfile } from "@/lib/business";
import { currentUserId } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const uid = await currentUserId();
  if (!uid) return Response.json({ error: "Not signed in" }, { status: 401 });
  return Response.json({ profile: (await getBusinessProfile(uid)) ?? {} });
}

export async function POST(req: Request) {
  const uid = await currentUserId();
  if (!uid) return Response.json({ error: "Not signed in" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const profile = await saveBusinessProfile(uid, body);
  return Response.json({ ok: true, profile });
}
