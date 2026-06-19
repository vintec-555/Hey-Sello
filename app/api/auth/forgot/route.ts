import { createResetToken } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { email } = (await req.json().catch(() => ({}))) as { email?: string };
  if (email) {
    const token = await createResetToken(email);
    if (token) {
      const link = `${new URL(req.url).origin}/reset?token=${token}`;
      await sendEmail(
        email,
        "Reset your Hey Sello password",
        `<p>Click the link below to reset your password (valid for 30 minutes):</p><p><a href="${link}">${link}</a></p><p>If you didn't request this, you can ignore this email.</p>`,
      );
    }
  }
  // Always succeed — never reveal whether an email is registered.
  return Response.json({ ok: true });
}
