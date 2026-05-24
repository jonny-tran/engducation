import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@engducation/auth";
import { AdminCourseDetailView } from "@/features/learning-content";

interface PageProps {
  params: Promise<{ adminId: string; courseId: string }>;
}

export default async function AdminCourseDetailPage({ params }: PageProps) {
  const { adminId, courseId } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "admin") {
    redirect(`/${session.user.id}`);
  }

  if (session.user.id !== adminId) {
    redirect(`/admin/${session.user.id}/courses/${courseId}`);
  }

  return <AdminCourseDetailView adminId={adminId} courseId={courseId} />;
}
