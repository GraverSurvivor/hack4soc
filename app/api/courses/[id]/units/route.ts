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

    const units = await prisma.unit.findMany({
      where: { courseId: id },
      orderBy: { order: "asc" },
      include: {
        quizQuestions: {
          select: { id: true, question: true, options: true },
        },
        progress: {
          where: { userId: session.user.id },
        },
      },
    });

    return NextResponse.json(units);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
