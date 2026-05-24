import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@engducation/auth";
import AuthView from "@/features/auth/components/auth-view";

export default async function LoginPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user) {
    if (session.user.role === "admin") {
      redirect(`/admin/${session.user.id}/dashboard`);
    } else {
      redirect(`/${session.user.id}`);
    }
  }

  return <AuthView />;
}
