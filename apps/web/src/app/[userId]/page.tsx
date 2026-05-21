import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { StudentDashboardView } from "@/features/learning-content";
import UserProfileActions from "./user-profile-actions";
import { ModeToggle } from "@/components/mode-toggle";

interface PageProps {
  params: Promise<{ userId: string }>;
}

export default async function UserProfilePage({ params }: PageProps) {
  const { userId } = await params;

  const session = await authClient.getSession({
    fetchOptions: {
      headers: await headers(),
      throw: true,
    },
  });

  if (!session?.user) {
    redirect("/login");
  }

  // Redirect admin to admin dashboard if they try to access the user route
  if (session.user.role === "admin") {
    redirect(`/admin/${session.user.id}/dashboard`);
  }

  // Route protection: User can only see their own workspace
  if (session.user.id !== userId) {
    redirect(`/${session.user.id}`);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col w-full">
      {/* Premium custom top navbar for student classroom */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b px-6 bg-background/80 backdrop-blur-md sticky top-0 z-10 border-border shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-lg font-extrabold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent tracking-tight">
            🎓 engducation
          </span>
          <span className="px-2 py-0.5 border border-primary/20 rounded-full text-[9px] font-bold uppercase bg-primary/10 text-primary tracking-wider">
            Lớp học ({session.user.name})
          </span>
        </div>
        <div className="flex items-center gap-3">
          <ModeToggle />
          <UserProfileActions />
        </div>
      </header>

      {/* Centered spacious classroom space */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StudentDashboardView />
      </main>
    </div>
  );
}
