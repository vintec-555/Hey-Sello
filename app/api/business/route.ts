import { getBusinessProfile, saveBusinessProfile } from "@/lib/business";

export const runtime = "nodejs";

export async function GET() {
  return Response.json({ profile: (await getBusinessProfile()) ?? {} });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const profile = await saveBusinessProfile(body);
  return Response.json({ ok: true, profile });
}
