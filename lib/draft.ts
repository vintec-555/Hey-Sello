import Anthropic from "@anthropic-ai/sdk";
import { getBusinessProfile, businessContext } from "@/lib/business";

const DRAFT_SYSTEM = `You are Hey Sello, drafting a reply to an incoming business email on the owner's behalf.
Write a complete, professional reply in PLAIN TEXT (no markdown, asterisks, or emoji):
- A greeting using the sender's first name if you can tell it.
- A warm, concise body that acknowledges their message and moves it forward (answer a question, offer a time, or ask one clarifying question).
- A polite sign-off like "Best regards," followed by "The team".
Keep it short and genuinely helpful. Output ONLY the email body.`;

export async function generateReply(
  uid: string,
  email: { from: string; subject: string; snippet: string },
): Promise<string | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  const client = new Anthropic({ apiKey: key });
  const res = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 600,
    system: DRAFT_SYSTEM + businessContext(await getBusinessProfile(uid)),
    messages: [
      {
        role: "user",
        content: `A new email just arrived.\nFrom: ${email.from}\nSubject: ${email.subject}\nPreview: ${email.snippet}\n\nWrite the reply body now.`,
      },
    ],
  });
  const text = res.content.find((b) => b.type === "text");
  return text && text.type === "text" ? text.text.trim() : null;
}

export function extractEmail(from: string): string {
  const m = /<([^>]+)>/.exec(from) || /([^\s<>]+@[^\s<>]+)/.exec(from);
  return m ? m[1] : from;
}
