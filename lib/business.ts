import { getStored, setStored } from "@/lib/store";

// The owner's "Business Brain" — context Sello uses to make every reply
// accurate and on-brand instead of generic.
export type BusinessProfile = {
  name?: string;
  about?: string;
  services?: string;
  hours?: string;
  location?: string;
  bookingLink?: string;
  tone?: string;
  faqs?: string;
  notes?: string;
};

const FIELDS: (keyof BusinessProfile)[] = [
  "name", "about", "services", "hours", "location", "bookingLink", "tone", "faqs", "notes",
];

export async function getBusinessProfile(): Promise<BusinessProfile | null> {
  return getStored<BusinessProfile>("business_profile");
}

export async function saveBusinessProfile(input: Record<string, unknown>): Promise<BusinessProfile> {
  const clean: BusinessProfile = {};
  for (const f of FIELDS) {
    const v = input[f];
    if (typeof v === "string" && v.trim()) clean[f] = v.trim().slice(0, 4000);
  }
  await setStored("business_profile", clean);
  return clean;
}

// Renders the profile into a system-prompt block.
export function businessContext(p: BusinessProfile | null): string {
  if (!p) return "";
  const L: string[] = [];
  if (p.name) L.push(`Business name: ${p.name}`);
  if (p.about) L.push(`What we do: ${p.about}`);
  if (p.services) L.push(`Services & prices:\n${p.services}`);
  if (p.hours) L.push(`Hours: ${p.hours}`);
  if (p.location) L.push(`Location / area served: ${p.location}`);
  if (p.bookingLink) L.push(`Booking link (share it when a customer wants to book): ${p.bookingLink}`);
  if (p.faqs) L.push(`Common questions & answers:\n${p.faqs}`);
  if (p.notes) L.push(`Other notes: ${p.notes}`);
  if (p.tone) L.push(`Preferred tone for all replies: ${p.tone}`);
  if (!L.length) return "";
  return `\n\nABOUT THIS BUSINESS — use this to make every reply accurate and on-brand. Only state facts from here; if something isn't covered, say you'll check rather than guessing.\n${L.join("\n")}`;
}
