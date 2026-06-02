import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@engducation/auth";
import dynamic from "next/dynamic";
import Loader from "@/components/ui/loader";

const AdminModuleWorkspaceView = dynamic(
  () => import("@/features/learning-content/components/admin/admin-module-workspace-view").then((mod) => mod.AdminModuleWorkspaceView),
  {
    loading: () => <Loader />,
  }
);

interface PageProps {
  params: Promise<{ adminId: string; courseId: string; moduleId: string }>;
}

export default async function AdminModuleWorkspacePage({ params }: PageProps) {
  const { adminId, courseId, moduleId } = await params;

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
    redirect(`/admin/${session.user.id}/courses/${courseId}/modules/${moduleId}`);
  }

  return (
    <AdminModuleWorkspaceView
      adminId={adminId}
      courseId={courseId}
      moduleId={moduleId}
    />
  );
}
