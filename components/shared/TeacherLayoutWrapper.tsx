"use client";

import { usePathname } from "next/navigation";
import { TeacherSidebar } from "./TeacherSidebar";

export function TeacherLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isOnboarding = pathname?.includes("/onboarding");

  if (isOnboarding) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-navy-900">
      <TeacherSidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
