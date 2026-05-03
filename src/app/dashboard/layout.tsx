import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { Sidebar } from "@/components/layout/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="flex h-full min-h-screen">
      <Sidebar userName={session.user?.name ?? undefined} userEmail={session.user?.email ?? undefined} />
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
