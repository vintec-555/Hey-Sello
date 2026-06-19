"use client";

import { useId } from "react";

// Clean "Hey Sello" wordmark: a gradient tile with a sparkle mark + text.
export default function Logo({ size = 26, text = true }: { size?: number; text?: boolean }) {
  const id = useId().replace(/:/g, "");
  return (
    <span className="logo">
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect width="32" height="32" rx="9" fill={`url(#g${id})`} />
        <path
          d="M16 6.5c.6 5.4 3.5 8.4 9 9-5.5.6-8.4 3.6-9 9-.6-5.4-3.5-8.4-9-9 5.5-.6 8.4-3.6 9-9Z"
          fill="#fff"
        />
        <defs>
          <linearGradient id={`g${id}`} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop stopColor="#8b7bff" />
            <stop offset="1" stopColor="#46d0ff" />
          </linearGradient>
        </defs>
      </svg>
      {text && <span className="logo__text">Hey Sello</span>}
    </span>
  );
}
