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
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><defs><linearGradient id='g' x1='0' y1='0' x2='32' y2='32' gradientUnits='userSpaceOnUse'><stop stop-color='%238b7bff'/><stop offset='1' stop-color='%2346d0ff'/></linearGradient></defs><rect width='32' height='32' rx='9' fill='url(%23g)'/><path d='M16 6.5c.6 5.4 3.5 8.4 9 9-5.5.6-8.4 3.6-9 9-.6-5.4-3.5-8.4-9-9 5.5-.6 8.4-3.6 9-9Z' fill='white'/></svg>",
  },
};

export const viewport = { themeColor: "#07070c" };

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
