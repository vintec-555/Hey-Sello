// Hey Sello — tool surface for the automation agent.
//
// Each tool is something Sello can "do" across a connected app. For the demo /
// MVP these run against in-memory fixtures so the product is fully explorable
// without real OAuth. Swapping a fixture executor for a real API call (Gmail,
// Slack, Notion, your CRM) is the only change needed to go live — the tool
// schema the model sees stays identical.

export type ToolResult = { ok: boolean; summary: string; data?: unknown };
export type ToolExecutor = (input: Record<string, unknown>) => Promise<ToolResult>;

export interface SelloTool {
  name: string;
  app: "gmail" | "slack" | "notion" | "crm";
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
  run: ToolExecutor;
}

// ---- In-memory fixtures (stand in for the connected accounts) ----------------

const inbox = [
  { id: "m1", from: "ravi@brightloop.io", subject: "Demo request", snippet: "Hi, saw your launch — can we get a demo this week?", isLead: true },
  { id: "m2", from: "noreply@stripe.com", subject: "Payment received", snippet: "You received a payment of $499.", isLead: false },
  { id: "m3", from: "anita@northstar.co", subject: "Pricing question", snippet: "What's the team plan price for 20 seats?", isLead: true },
];

const crm: { name: string; email: string; stage: string; note: string }[] = [];
const slackLog: { channel: string; text: string }[] = [];
const notionRows: { title: string; props: Record<string, string> }[] = [];

// ---- Tool definitions --------------------------------------------------------

export const tools: SelloTool[] = [
  {
    name: "gmail_search",
    app: "gmail",
    description:
      "Search the connected Gmail inbox. Use to find new leads, messages, or threads matching a query (e.g. 'new leads', 'unread', a sender or subject).",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "What to look for, in plain language." },
      },
      required: ["query"],
    },
    run: async ({ query }) => {
      const q = String(query ?? "").toLowerCase();
      const wantsLeads = /lead|demo|prospect|inquir|interest/.test(q);
      const hits = inbox.filter((m) => (wantsLeads ? m.isLead : true));
      return {
        ok: true,
        summary: `Found ${hits.length} message(s) matching “${query}”.`,
        data: hits.map((m) => ({ id: m.id, from: m.from, subject: m.subject, snippet: m.snippet })),
      };
    },
  },
  {
    name: "gmail_send_reply",
    app: "gmail",
    description:
      "Send an email reply to a contact. Use after drafting a response to a lead or message.",
    input_schema: {
      type: "object",
      properties: {
        to: { type: "string", description: "Recipient email address." },
        subject: { type: "string", description: "Subject line." },
        body: { type: "string", description: "The email body." },
      },
      required: ["to", "subject", "body"],
    },
    run: async ({ to, subject }) => ({
      ok: true,
      summary: `Replied to ${to} — “${subject}”.`,
    }),
  },
  {
    name: "crm_upsert_contact",
    app: "crm",
    description:
      "Create or update a contact in the CRM with a stage and a note. Use to log a new lead or update a deal.",
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
      crm.push({ name: String(name ?? email), email: String(email), stage: String(stage), note: String(note ?? "") });
      return { ok: true, summary: `Logged ${email} in CRM as “${stage}”.` };
    },
  },
  {
    name: "slack_post_message",
    app: "slack",
    description: "Post a message to a Slack channel. Use to notify the team about something Sello did.",
    input_schema: {
      type: "object",
      properties: {
        channel: { type: "string", description: "e.g. #sales, #general." },
        text: { type: "string" },
      },
      required: ["channel", "text"],
    },
    run: async ({ channel, text }) => {
      slackLog.push({ channel: String(channel), text: String(text) });
      return { ok: true, summary: `Posted to ${channel}.` };
    },
  },
  {
    name: "notion_add_row",
    app: "notion",
    description: "Add a row to a Notion database (e.g. a tracker or log).",
    input_schema: {
      type: "object",
      properties: {
        database: { type: "string", description: "Which database/table." },
        title: { type: "string" },
        properties: { type: "object", description: "Other column values as key/value pairs." },
      },
      required: ["database", "title"],
    },
    run: async ({ title, properties }) => {
      notionRows.push({ title: String(title), props: (properties as Record<string, string>) ?? {} });
      return { ok: true, summary: `Added “${title}” to Notion.` };
    },
  },
];

export const toolByName = Object.fromEntries(tools.map((t) => [t.name, t]));
