import Anthropic from "@anthropic-ai/sdk";
import { tools, toolByName, demoLeads, type ToolResult } from "@/lib/tools";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = "claude-opus-4-8";

const SYSTEM = `You are Hey Sello, an AI automation agent. The user describes a task in plain English and you carry it out by calling the connected tools (Gmail, WhatsApp, CRM).

Rules:
- Work end to end. Plan briefly, then act with tools — don't ask for confirmation on routine, reversible steps.
- These are REAL actions: gmail_send_reply sends a real email, whatsapp_send sends a real WhatsApp message. Be accurate and professional.
- If a tool returns that something "isn't connected", STOP pretending — tell the user plainly which app needs connecting and don't fabricate a result.
- When you handle a lead, reply to them AND log them in the CRM.
- Keep any text you emit short and human — you're narrating what you're doing for a watching user.
- When the task is fully done, give a one or two sentence summary of what you actually accomplished.`;

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
