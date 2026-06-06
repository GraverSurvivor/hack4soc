import { TeacherLayoutWrapper } from "@/components/shared/TeacherLayoutWrapper";

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <TeacherLayoutWrapper>{children}</TeacherLayoutWrapper>;
}
