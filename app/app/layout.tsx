import { redirect } from "next/navigation";
import { currentUserId } from "@/lib/auth";

// Protects everything under /app — visitors are sent to /login.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const uid = await currentUserId();
  if (!uid) redirect("/login");
  return <>{children}</>;
}
