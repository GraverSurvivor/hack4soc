import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { iepSchema } from "@/lib/validations";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const session = await requireAuth();
    const { studentId } = await params;

    const notes = await prisma.iEPNote.findMany({
      where: {
        studentId,
        OR: [
          { teacherId: session.user.id },
          { studentId: session.user.id },
        ],
      },
    });

    return NextResponse.json(notes);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const session = await requireAuth();
    const { studentId } = await params;
    const body = await req.json();
    const parsed = iepSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const classroom = await prisma.classroom.findFirst({
      where: {
        id: parsed.data.classroomId,
        teacherId: session.user.id,
      },
    });
    if (!classroom) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const note = await prisma.iEPNote.upsert({
      where: {
        studentId_classroomId: {
          studentId,
          classroomId: parsed.data.classroomId,
        },
      },
      update: {
        notes: parsed.data.notes,
        difficulty: parsed.data.difficulty || "standard",
        is504: parsed.data.is504 ?? false,
        extraSupport: parsed.data.extraSupport ?? false,
      },
      create: {
        studentId,
        teacherId: session.user.id,
        classroomId: parsed.data.classroomId,
        notes: parsed.data.notes,
        difficulty: parsed.data.difficulty || "standard",
        is504: parsed.data.is504 ?? false,
        extraSupport: parsed.data.extraSupport ?? false,
      },
    });

    return NextResponse.json(note);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
