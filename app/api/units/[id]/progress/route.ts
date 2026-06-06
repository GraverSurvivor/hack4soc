import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { progressSchema } from "@/lib/validations";
import { awardXP, checkProgressBadges } from "@/lib/gamification";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id: unitId } = await params;
    const body = await req.json();
    const parsed = progressSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const progressData = {
      ...data,
      quizAnswers: data.quizAnswers as Prisma.InputJsonValue | undefined,
    };
    const progress = await prisma.studentProgress.upsert({
      where: { userId_unitId: { userId: session.user.id, unitId } },
      update: {
        ...progressData,
        completedAt: data.completed ? new Date() : undefined,
      },
      create: {
        userId: session.user.id,
        unitId,
        ...progressData,
        completedAt: data.completed ? new Date() : undefined,
      },
    });

    if (data.completed) {
      await awardXP(session.user.id, 50, "Completed a learning unit");
      if (data.quizScore && data.quizScore >= 80) {
        await awardXP(session.user.id, 25, "High quiz score bonus");
      }
      await checkProgressBadges(
        session.user.id,
        data.learningMode,
        data.quizScore
      );
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { lastActive: new Date() },
    });

    return NextResponse.json(progress);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
