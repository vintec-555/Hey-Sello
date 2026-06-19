import React from "react";

// Minimal, safe rich-text renderer for the agent's replies.
// Supports: **bold**, bullet lines (- / • / *), and a "Bottom line:" highlight.
// Builds React nodes directly — no dangerouslySetInnerHTML.

function inline(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i}>{part.slice(2, -2)}</strong>
    ) : (
      <React.Fragment key={i}>{part.replace(/\*/g, "")}</React.Fragment>
    ),
  );
}

export default function RichText({ text }: { text: string }) {
  const lines = text.split(/\n/).map((l) => l.trim()).filter(Boolean);
  const blocks: React.ReactNode[] = [];
  let list: string[] = [];

  const flush = () => {
    if (!list.length) return;
    blocks.push(
      <ul className="rt-list" key={`u${blocks.length}`}>
        {list.map((li, i) => (
          <li key={i}>{inline(li)}</li>
        ))}
      </ul>,
    );
    list = [];
  };

  for (const line of lines) {
    const m = /^[-•*]\s+(.*)/.exec(line);
    if (m) {
      list.push(m[1]);
      continue;
    }
    flush();
    const bottom = /^bottom line\s*:/i.test(line);
    blocks.push(
      <p className={bottom ? "rt-bottom" : "rt-p"} key={`p${blocks.length}`}>
        {inline(line)}
      </p>,
    );
  }
  flush();
  return <>{blocks}</>;
}
