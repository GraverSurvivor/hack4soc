import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function Home() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.user.role === "TEACHER") redirect("/teacher/dashboard");
  if (!session.user.hasCompletedOnboarding) redirect("/student/onboarding");
  redirect("/student/home");
}
