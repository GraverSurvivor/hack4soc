import { prisma } from "@/lib/db";

export async function verifyClassroomAccess(
  userId: string,
  classroomId: string
): Promise<{ allowed: boolean; classroom?: { id: string; teacherId: string } }> {
  const classroom = await prisma.classroom.findUnique({
    where: { id: classroomId },
    select: { id: true, teacherId: true },
  });

  if (!classroom) return { allowed: false };

  if (classroom.teacherId === userId) {
    return { allowed: true, classroom };
  }

  const member = await prisma.classroomMember.findFirst({
    where: { userId, classroomId },
  });

  return { allowed: Boolean(member), classroom };
}

export async function verifyCourseAccess(userId: string, courseId: string) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, classroomId: true },
  });

  if (!course) return { allowed: false };

  const access = await verifyClassroomAccess(userId, course.classroomId);
  return { ...access, course };
}

export async function verifyUnitAccess(userId: string, unitId: string) {
  const unit = await prisma.unit.findUnique({
    where: { id: unitId },
    select: { id: true, course: { select: { classroomId: true } } },
  });

  if (!unit) return { allowed: false };

  const access = await verifyClassroomAccess(userId, unit.course.classroomId);
  return { ...access, unit };
}
