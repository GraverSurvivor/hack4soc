import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/auth";
import { getDashboardData } from "@/lib/dashboard";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ classroomId: string }> }
) {
  try {
    const session = await requireTeacher();
    const { classroomId } = await params;

    const classroom = await prisma.classroom.findFirst({
      where: { id: classroomId, teacherId: session.user.id },
    });

    if (!classroom) {
      return NextResponse.json({ error: "Classroom not found" }, { status: 404 });
    }

    const data = await getDashboardData(classroomId);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
