// Hey Sello — the agent's real tool surface.
//
// These call live integrations. When an integration isn't connected, the tool
// returns an honest "not connected" result — it never fabricates data. (The
// clearly-labeled demo simulation lives in the agent route, gated behind an
// explicit opt-in, so a real run can never be mistaken for a fake one.)
import { gmailConnected, gmailSearch, gmailSend } from "@/lib/integrations/gmail";
import { whatsappConfigured, whatsappSend, whatsappRecent } from "@/lib/integrations/whatsapp";
import { getStored, setStored } from "@/lib/store";

export type ToolResult = { ok: boolean; summary: string; data?: unknown };

export interface SelloTool {
  name: string;
  app: "gmail" | "whatsapp" | "crm";
  description: string;
  input_schema: { type: "object"; properties: Record<string, unknown>; required?: string[] };
  run: (input: Record<string, unknown>) => Promise<ToolResult>;
}

const notConnected = (what: string): ToolResult => ({
  ok: false,
  summary: `${what} isn't connected yet — connect it in the app to do this for real.`,
});

export const tools: SelloTool[] = [
  {
    name: "gmail_search",
    app: "gmail",
    description:
      "Search the connected Gmail inbox with a Gmail query (e.g. 'is:unread', 'newer_than:2d demo', a sender or subject). Returns real messages.",
    input_schema: {
      type: "object",
      properties: { query: { type: "string", description: "Gmail search query." } },
      required: ["query"],
    },
    run: async ({ query }) => {
      if (!(await gmailConnected())) return notConnected("Gmail");
      const msgs = await gmailSearch(String(query ?? ""));
      return { ok: true, summary: `Found ${msgs.length} message(s).`, data: msgs };
    },
  },
  {
    name: "gmail_send_reply",
    app: "gmail",
    description: "Send a real email from the connected Gmail account.",
    input_schema: {
      type: "object",
      properties: {
        to: { type: "string", description: "Recipient email." },
        subject: { type: "string" },
        body: { type: "string" },
      },
      required: ["to", "subject", "body"],
    },
    run: async ({ to, subject, body }) => {
      if (!(await gmailConnected())) return notConnected("Gmail");
      await gmailSend(String(to), String(subject), String(body));
      return { ok: true, summary: `Sent an email to ${to} — “${subject}”.` };
    },
  },
  {
    name: "whatsapp_recent",
    app: "whatsapp",
    description: "Read recent inbound WhatsApp messages (optionally filtered by a query).",
    input_schema: {
      type: "object",
      properties: { query: { type: "string", description: "Optional filter." } },
    },
    run: async ({ query }) => {
      if (!whatsappConfigured()) return notConnected("WhatsApp");
      const msgs = await whatsappRecent(query ? String(query) : undefined);
      return { ok: true, summary: `Found ${msgs.length} recent WhatsApp message(s).`, data: msgs };
    },
  },
  {
    name: "whatsapp_send",
    app: "whatsapp",
    description: "Send a real WhatsApp message to a phone number (E.164, e.g. 919876543210).",
    input_schema: {
      type: "object",
      properties: {
        to: { type: "string", description: "Recipient phone number in E.164 format." },
        text: { type: "string" },
      },
      required: ["to", "text"],
    },
    run: async ({ to, text }) => {
      if (!whatsappConfigured()) return notConnected("WhatsApp");
      await whatsappSend(String(to), String(text));
      return { ok: true, summary: `Sent a WhatsApp message to ${to}.` };
    },
  },
  {
    name: "crm_upsert_contact",
    app: "crm",
    description: "Save or update a contact in Sello's built-in CRM with a stage and note.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string" },
        email: { type: "string" },
        stage: { type: "string", description: "e.g. New, Contacted, Qualified." },
        note: { type: "string" },
      },
      required: ["email", "stage"],
    },
    run: async ({ name, email, stage, note }) => {
      const list = (await getStored<unknown[]>("crm")) ?? [];
      list.push({ name: name ?? email, email, stage, note: note ?? "", at: new Date().toISOString() });
      await setStored("crm", list);
      return { ok: true, summary: `Saved ${email} in the CRM as “${stage}”.` };
    },
  },
];

export const toolByName = Object.fromEntries(tools.map((t) => [t.name, t]));

// ---- Explicit, clearly-labeled demo fixtures (simulation only) --------------
export const demoLeads = [
  { from: "ravi@brightloop.io", subject: "Demo request" },
  { from: "anita@northstar.co", subject: "Pricing question" },
];
