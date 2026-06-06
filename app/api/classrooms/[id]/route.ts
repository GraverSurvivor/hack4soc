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

    const classroom = await prisma.classroom.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatar: true,
                xp: true,
                streak: true,
                brainProfile: true,
                learningProfile: true,
                learningPreferences: true,
              },
            },
          },
        },
        courses: {
          include: {
            units: {
              include: {
                progress: { where: { userId: session.user.id } },
              },
              orderBy: { order: "asc" },
            },
            _count: { select: { units: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!classroom) {
      return NextResponse.json({ error: "Classroom not found" }, { status: 404 });
    }

    const isMember = classroom.members.some(
      (m) => m.userId === session.user.id
    );
    const isTeacher = classroom.teacherId === session.user.id;

    if (!isMember && !isTeacher) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(classroom);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
