import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, requireTeacher } from "@/lib/auth";
import { classroomSchema } from "@/lib/validations";
import { generateInviteCode } from "@/lib/utils";

export async function GET() {
  try {
    const session = await requireAuth();

    if (session.user.role === "TEACHER") {
      const classrooms = await prisma.classroom.findMany({
        where: { teacherId: session.user.id },
        include: {
          _count: { select: { members: true, courses: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(classrooms);
    }

    const memberships = await prisma.classroomMember.findMany({
      where: { userId: session.user.id },
      orderBy: { joinedAt: "desc" },
      include: {
        classroom: {
          include: {
            _count: { select: { members: true, courses: true } },
            teacher: { select: { name: true } },
            courses: {
              orderBy: { createdAt: "desc" },
              include: {
                units: {
                  orderBy: { order: "asc" },
                  include: {
                    progress: { where: { userId: session.user.id } },
                  },
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json(
      memberships.map((m) => ({
        ...m.classroom,
        joinedAt: m.joinedAt,
      }))
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 403 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireTeacher();
    const body = await req.json();
    const parsed = classroomSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    let inviteCode = generateInviteCode();
    let attempts = 0;
    while (attempts < 10) {
      const exists = await prisma.classroom.findUnique({
        where: { inviteCode },
      });
      if (!exists) break;
      inviteCode = generateInviteCode();
      attempts++;
    }

    const classroom = await prisma.classroom.create({
      data: {
        name: parsed.data.name,
        inviteCode,
        teacherId: session.user.id,
      },
    });

    return NextResponse.json(classroom, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
