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

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        units: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            title: true,
            summary: true,
            order: true,
            quizQuestions: { select: { id: true } },
            progress: { where: { userId: session.user.id } },
          },
        },
        classroom: { select: { id: true, name: true } },
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    return NextResponse.json(course);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
