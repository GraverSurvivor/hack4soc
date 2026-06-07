import { StudentNav } from "@/components/shared/StudentNav";
import { ClassroomProvider } from "@/components/shared/ClassroomProvider";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClassroomProvider>
      <div className="min-h-screen bg-navy-900 pb-20 md:pb-0">
        <StudentNav />
        <main>{children}</main>
      </div>
    </ClassroomProvider>
  );
}
