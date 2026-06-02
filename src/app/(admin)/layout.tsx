import AdminSidebarDesktop from "@/components/layout/AdminSidebar";
import AdminHeader from "@/components/layout/AdminHeader";
import { getSessionUser } from "@/lib/server/auth-session";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();

  if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
    redirect("/login?next=/admin");
  }

  return (
    <div className="flex h-screen bg-bg-base overflow-hidden">
      <AdminSidebarDesktop />
      <div className="flex flex-col flex-1 overflow-hidden">
        <AdminHeader />
        <main className="flex-1 overflow-y-auto p-6 relative z-10">
          {children}
        </main>
      </div>
    </div>
  );
}
