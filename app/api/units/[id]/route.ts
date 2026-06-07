import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { normalizeCorrectAnswer } from "@/lib/content";
import { verifyUnitAccess } from "@/lib/classroom-access";

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

    const access = await verifyUnitAccess(session.user.id, id);
    if (!access.allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const iepNote = await prisma.iEPNote.findFirst({
      where: {
        studentId: session.user.id,
        classroomId: unit.course.classroomId,
      },
    });

    const brainProfile = await prisma.brainProfile.findUnique({
      where: { userId: session.user.id },
    });

    const normalizedQuestions = unit.quizQuestions.map((q) => ({
      ...q,
      options: Array.isArray(q.options) ? (q.options as string[]) : [],
      correct: normalizeCorrectAnswer(
        q.correct,
        Array.isArray(q.options) ? (q.options as string[]).length : 4
      ),
    }));

    return NextResponse.json({
      ...unit,
      quizQuestions: normalizedQuestions,
      iepNote,
      brainProfile: brainProfile?.dominant ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
