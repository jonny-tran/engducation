import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { AdminSidebar } from "@/components/admin-sidebar";
import {
  SidebarInset,
  SidebarProvider,
} from "@engducation/ui/components/sidebar";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ adminId: string }>;
}

export default async function AdminLayout({ children, params }: LayoutProps) {
  const { adminId } = await params;

  const session = await authClient.getSession({
    fetchOptions: {
      headers: await headers(),
      throw: true,
    },
  });

  if (!session?.user) {
    redirect("/login");
  }

  // Redirect non-admin users to their standard user profile
  if (session.user.role !== "admin") {
    redirect(`/${session.user.id}`);
  }

  // Route protection: Admins can only see their own admin dashboard
  if (session.user.id !== adminId) {
    redirect(`/admin/${session.user.id}/dashboard`);
  }

  return (
    <SidebarProvider>
      <AdminSidebar session={session as any} />
      <SidebarInset className="bg-gradient-to-br from-slate-50 via-slate-100 to-rose-50/10 dark:from-slate-950 dark:via-slate-900 dark:to-rose-950/5 min-h-full">
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
