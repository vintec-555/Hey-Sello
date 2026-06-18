import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hey Sello — Work that runs itself",
  description:
    "Hey Sello connects your tools and lets AI run the repetitive work for you. Join the waitlist for early access.",
  openGraph: {
    title: "Hey Sello — Work that runs itself",
    description: "AI automations that handle your repetitive work, end to end. Join the waitlist.",
    type: "website",
  },
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='48' fill='%236c5ce7'/><text x='50' y='52' font-size='62' text-anchor='middle' dominant-baseline='central' fill='white'>⟳</text></svg>",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
