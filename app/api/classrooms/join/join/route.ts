import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { joinClassroomSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const parsed = joinClassroomSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const classroom = await prisma.classroom.findUnique({
      where: { inviteCode: parsed.data.inviteCode.toUpperCase() },
    });

    if (!classroom) {
      return NextResponse.json(
        { error: "Invalid invite code. Check with your teacher." },
        { status: 404 }
      );
    }

    const existing = await prisma.classroomMember.findUnique({
      where: {
        userId_classroomId: {
          userId: session.user.id,
          classroomId: classroom.id,
        },
      },
    });

    if (!existing) {
      await prisma.classroomMember.create({
        data: {
          userId: session.user.id,
          classroomId: classroom.id,
        },
      });
    }

    return NextResponse.json({ classroom });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
