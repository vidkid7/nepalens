import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import AdminSidebar from "./AdminSidebar";

export const dynamic = "force-dynamic";

export const metadata = {
  title: { default: "Admin Panel", template: "%s | Admin • NepaLens" },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as any).isAdmin) {
    redirect("/login?callbackUrl=/admin");
  }

  return (
    <div className="flex min-h-screen bg-surface-50">
      <AdminSidebar user={session.user as any} />
      <main className="flex-1 lg:ml-64">
        <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">{children}</div>
      </main>
    </div>
  );
}
