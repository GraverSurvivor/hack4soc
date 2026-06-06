import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const unit = await prisma.unit.findUnique({
      where: { id },
      include: {
        quizQuestions: true,
        course: { select: { id: true, title: true, classroomId: true } },
        progress: { where: { userId: session.user.id } },
      },
    });

    if (!unit) {
      return NextResponse.json({ error: "Unit not found" }, { status: 404 });
    }

    const iepNote = await prisma.iEPNote.findFirst({
      where: {
        studentId: session.user.id,
        classroomId: unit.course.classroomId,
      },
    });

    return NextResponse.json({ ...unit, iepNote });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
