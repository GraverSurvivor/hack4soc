import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { verifyClassroomAccess } from "@/lib/classroom-access";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ classroomId: string }> }
) {
  try {
    const session = await requireAuth();
    const { classroomId } = await params;

    const access = await verifyClassroomAccess(session.user.id, classroomId);
    if (!access.allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const messages = await prisma.chatMessage.findMany({
      where: { classroomId },
      orderBy: { createdAt: "asc" },
      take: 100,
    });

    return NextResponse.json(messages);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ classroomId: string }> }
) {
  try {
    const session = await requireAuth();
    const { classroomId } = await params;
    const { messageId, action } = await req.json();

    const classroom = await prisma.classroom.findFirst({
      where: { id: classroomId, teacherId: session.user.id },
    });
    if (!classroom) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (action === "pin") {
      await prisma.chatMessage.update({
        where: { id: messageId },
        data: { isPinned: true },
      });
    } else if (action === "announcement") {
      await prisma.chatMessage.update({
        where: { id: messageId },
        data: { isAnnouncement: true, isPinned: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
