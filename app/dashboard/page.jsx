import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardRedirect() {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  const role = session.user.role;

  if (role === "admin") {
    redirect("/admin/dashboard");
  }

  if (role === "employee") {
    redirect("/employee/dashboard");
  }

  if (role === "superAdmin") {
    redirect("/super-admin/dashboard");
  }

  redirect("/");
}
