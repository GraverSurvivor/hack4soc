import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireTeacher } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ classroomId: string; studentId: string }> }
) {
  try {
    const session = await requireTeacher();
    const { classroomId, studentId } = await params;

    const classroom = await prisma.classroom.findFirst({
      where: { id: classroomId, teacherId: session.user.id },
    });
    if (!classroom) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const student = await prisma.user.findUnique({
      where: { id: studentId },
      include: {
        brainProfile: true,
        progress: {
          include: {
            unit: {
              include: { course: true, quizQuestions: true },
            },
          },
        },
        badges: { include: { badge: true } },
        iepNotes: { where: { classroomId } },
        xpHistory: { orderBy: { createdAt: "desc" }, take: 20 },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    return NextResponse.json(student);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
