import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@engducation/auth";
import { StudentCourseDetailView } from "@/features/learning-content";

interface PageProps {
  params: Promise<{ courseId: string }>;
}

export default async function CourseDetailPage({ params }: PageProps) {
  const { courseId } = await params;

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

  return <StudentCourseDetailView courseId={courseId} />;
}
