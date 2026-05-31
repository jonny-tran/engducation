import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@engducation/auth";
import { StudentCoursesView } from "@/features/learning-content/components/student/student-courses-view";

export default async function CoursesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  // Redirect admin users to their dashboard if they try to access student courses
  if (session.user.role === "admin") {
    redirect(`/admin/${session.user.id}/dashboard`);
  }

  return <StudentCoursesView />;
}
