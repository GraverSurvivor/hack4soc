import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { brainProfileSchema } from "@/lib/validations";
import { generateBrainProfileQuiz } from "@/lib/claude";
import { awardBadge } from "@/lib/gamification";

export async function GET() {
  try {
    await requireAuth();

    const cached = await prisma.brainQuizCache.findUnique({
      where: { ageGroup: "8-16" },
    });

    if (cached) {
      return NextResponse.json(cached.questions);
    }

    const quiz = await generateBrainProfileQuiz();
    await prisma.brainQuizCache.create({
      data: {
        ageGroup: "8-16",
        questions: quiz.questions as unknown as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json(quiz.questions);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const parsed = brainProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const scores = { story: 0, calm: 0, game: 0 };
    for (const answer of parsed.data.answers) {
      scores[answer.type]++;
    }

    const dominant = (Object.entries(scores).sort(
      (a, b) => b[1] - a[1]
    )[0][0]) as "story" | "calm" | "game";

    const profile = await prisma.brainProfile.upsert({
      where: { userId: session.user.id },
      update: {
        dominant,
        scores: scores as Prisma.InputJsonValue,
        updatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        dominant,
        scores: scores as Prisma.InputJsonValue,
      },
    });

    await awardBadge(session.user.id, "Brain Explorer");

    return NextResponse.json(profile);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
