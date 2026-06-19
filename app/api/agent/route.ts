import Anthropic from "@anthropic-ai/sdk";
import { tools, toolByName, demoLeads, type ToolResult } from "@/lib/tools";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = "claude-opus-4-8";

const SYSTEM = `You are Hey Sello, a friendly, professional AI assistant that does real work across a small business owner's tools (Gmail, WhatsApp, CRM).

HOW TO ACT
- Work end to end. Briefly plan, then use the tools. Don't ask permission for routine, reversible steps.
- These are REAL actions: gmail_send_reply sends a real email; whatsapp_send sends a real WhatsApp message. Be careful and professional.
- If a tool says something "isn't connected", stop and tell the user — in plain words — which app to connect. Never invent results.
- When you handle a lead, reply to them and save them in the CRM.
- Inbox searches return a 'total' (the real number of matching emails) and a sample of the most recent. ALWAYS state the real total to the user (e.g. "You have about 10,000 unread emails") and make clear that you've grouped/summarized the most recent ones — never imply the sample size is the total.

HOW TO WRITE YOUR REPLIES — the reader is a busy, non-technical business owner, so this matters as much as the work itself:
- Use clear, simple, warm, professional English. No jargon, no technical terms, no email search syntax, no internal tool names.
- Be short and skimmable. Lead with the bottom line in ONE sentence.
- When you list things (e.g. emails), use a bullet list: each item on its own line starting with "- ", and put the sender or subject in **double asterisks**. Keep each bullet to one short line. Example:

You have 10 unread emails — nothing urgent.
- **LinkedIn** — 2 notifications, no reply needed
- **Acquire.com** — 4 new listings that match what you're looking for
Bottom line: only the Acquire alerts may be worth a quick look.

- Avoid long paragraphs. Prefer: one-line intro → bullets → one-line "Bottom line:".
- While working, emit at most ONE short status line (e.g. "Checking your inbox…"). Don't narrate every step.
- Finish with a friendly one-line summary of what you did or found.

WHEN YOU SEND AN EMAIL (gmail_send_reply) — write it like a thoughtful professional:
- Start with a proper greeting using the person's first name when you know it (e.g. "Hi Ravi,").
- A clear, concise body that directly addresses their message — answer their actual question, keep it warm and to the point.
- A polite sign-off ("Best regards," / "Thanks,") followed by the sender's name or "The team".
- PLAIN TEXT only in the email body — no markdown, asterisks, bullets, or emoji. Proper sentences and line breaks.
- Keep it short unless detail is genuinely needed. Never send a one-line abrupt reply.`;

type SSE = (event: string, data: unknown) => void;

function sseStream(run: (send: SSE) => Promise<void>): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send: SSE = (event, data) =>
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      try {
        await run(send);
      } catch (err) {
        send("error", { message: err instanceof Error ? err.message : "Something went wrong." });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST(req: Request) {
  const { task, demo } = (await req.json().catch(() => ({}))) as { task?: string; demo?: boolean };
  if (!task || !task.trim()) {
    return Response.json({ error: "Describe a task for Sello to run." }, { status: 400 });
  }

  // Explicit, clearly-labeled simulation. Only runs when the client asks for it
  // (the "Run sample (simulated)" button). Never mistaken for a real run.
  if (demo) {
    return sseStream(async (send) => {
      send("mode", { live: false });
      send("status", { text: "Simulating — no real messages are sent." });
      await sleep(500);
      send("tool", { app: "gmail", name: "gmail_search", input: { query: task } });
      await sleep(450);
      send("result", { summary: `Found ${demoLeads.length} example lead(s).` });
      for (const lead of demoLeads) {
        send("tool", { app: "gmail", name: "gmail_send_reply", input: { to: lead.from, subject: `Re: ${lead.subject}` } });
        await sleep(450);
        send("result", { summary: `(simulated) Replied to ${lead.from}.` });
        send("tool", { app: "crm", name: "crm_upsert_contact", input: { email: lead.from, stage: "Contacted" } });
        await sleep(400);
        send("result", { summary: `(simulated) Logged ${lead.from} in CRM.` });
      }
      send("message", {
        text: `Simulation complete — this is a preview of the flow. Connect Gmail/WhatsApp and add an API key to run it for real.`,
      });
      send("done", {});
    });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return sseStream(async (send) => {
      send("mode", { live: false });
      send("message", {
        text: "The agent isn't switched on yet — add ANTHROPIC_API_KEY to run real tasks, or try the simulated sample to preview the flow.",
      });
      send("done", {});
    });
  }

  // Real agent loop over the live tools.
  const client = new Anthropic({ apiKey });
  const apiTools = tools.map((t) => ({
    name: t.name,
    description: `[${t.app}] ${t.description}`,
    input_schema: t.input_schema,
  }));

  return sseStream(async (send) => {
    send("mode", { live: true });
    const messages: Anthropic.MessageParam[] = [{ role: "user", content: task }];

    for (let turn = 0; turn < 12; turn++) {
      const res = await client.messages.create({
        model: MODEL,
        max_tokens: 2048,
        system: SYSTEM,
        tools: apiTools,
        messages,
      });

      for (const block of res.content) {
        if (block.type === "text" && block.text.trim()) send("message", { text: block.text });
      }

      if (res.stop_reason !== "tool_use") {
        send("done", {});
        return;
      }

      messages.push({ role: "assistant", content: res.content });
      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const block of res.content) {
        if (block.type !== "tool_use") continue;
        const tool = toolByName[block.name];
        send("tool", { app: tool?.app ?? "app", name: block.name, input: block.input });
        let result: ToolResult;
        try {
          result = tool
            ? await tool.run(block.input as Record<string, unknown>)
            : { ok: false, summary: `Unknown tool: ${block.name}` };
        } catch (e) {
          result = { ok: false, summary: e instanceof Error ? e.message : "Tool failed." };
        }
        send("result", { summary: result.summary, ok: result.ok });
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: JSON.stringify(result),
          is_error: !result.ok,
        });
      }

      messages.push({ role: "user", content: toolResults });
    }

    send("message", { text: "Reached the step limit for this run." });
    send("done", {});
  });
}
