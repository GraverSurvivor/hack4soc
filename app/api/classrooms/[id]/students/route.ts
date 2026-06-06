import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireTeacher } from "@/lib/auth";

const addStudentSchema = z.object({
  email: z.string().email("Enter a valid student email"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireTeacher();
    const { id: classroomId } = await params;
    const body = await req.json();
    const parsed = addStudentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const classroom = await prisma.classroom.findFirst({
      where: { id: classroomId, teacherId: session.user.id },
    });

    if (!classroom) {
      return NextResponse.json({ error: "Classroom not found" }, { status: 404 });
    }

    const student = await prisma.user.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!student || student.role !== "STUDENT") {
      return NextResponse.json(
        { error: "No student account found with that email" },
        { status: 404 }
      );
    }

    await prisma.classroomMember.upsert({
      where: {
        userId_classroomId: {
          userId: student.id,
          classroomId,
        },
      },
      update: {},
      create: {
        userId: student.id,
        classroomId,
      },
    });

    return NextResponse.json({ student }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
