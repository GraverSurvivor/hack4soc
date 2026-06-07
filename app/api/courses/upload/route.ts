import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireTeacher } from "@/lib/auth";
import { extractTextFromFile } from "@/lib/parser";
import { generateCourseContent } from "@/lib/claude";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  correctIndexToLetter,
  formatCalmMode,
  formatGameMode,
  formatStoryMode,
} from "@/lib/content";

const MAX_FILE_SIZE = 50 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const session = await requireTeacher();

    const rateLimit = await checkRateLimit(session.user.id);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a minute." },
        { status: 429 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string;
    const classroomId = formData.get("classroomId") as string;

    if (!file || !title || !classroomId) {
      return NextResponse.json(
        { error: "File, title, and classroom are required" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size must be under 50MB" },
        { status: 400 }
      );
    }

    const classroom = await prisma.classroom.findFirst({
      where: { id: classroomId, teacherId: session.user.id },
    });
    if (!classroom) {
      return NextResponse.json({ error: "Classroom not found" }, { status: 404 });
    }

    // ── Parse file ────────────────────────────────────────────────────────────
    const buffer = Buffer.from(await file.arrayBuffer());
    let structure: Awaited<ReturnType<typeof extractTextFromFile>>;
    try {
      structure = await extractTextFromFile(buffer, file.name, file.type);
      console.log("✅ Parsed:", structure.title, "| Sections:", structure.sections.length);
    } catch (err) {
      const message = err instanceof Error ? err.message : "We couldn't read that file.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    // ── Generate course content (3 modes) ────────────────────────────────────
    let generated: Awaited<ReturnType<typeof generateCourseContent>>;
    try {
      generated = await generateCourseContent(structure);
      console.log("GENERATED CONTENT:", JSON.stringify(generated, null, 2));
    } catch (err) {
      console.error("❌ generateCourseContent failed:", err);
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "AI generation failed" },
        { status: 503 }
      );
    }

    const { story, calm, game } = generated;
    const unitCount = Math.max(story.length, calm.length, game.length);

    if (unitCount === 0) {
      return NextResponse.json(
        { error: "AI could not generate content from this file. Try a clearer document." },
        { status: 422 }
      );
    }

    // ── Save to DB ────────────────────────────────────────────────────────────
    const course = await prisma.course.create({
      data: {
        title,
        classroomId,
        rawText: structure.rawText,
        fileName: file.name,
        units: {
          create: Array.from({ length: unitCount }, (_, index) => {
            const storyUnit = (story[index] ?? {}) as Record<string, unknown>;
            const calmUnit = (calm[index] ?? {}) as Record<string, unknown>;
            const gameUnit = (game[index] ?? {}) as Record<string, unknown>;

            const unitTitle = String(
              storyUnit.unitTitle ?? calmUnit.unitTitle ?? gameUnit.unitTitle ?? `Unit ${index + 1}`
            );
            const summary = String(
              storyUnit.conceptSummary ?? calmUnit.conceptSummary ?? gameUnit.conceptSummary ?? ""
            );
            const quizSource = (storyUnit.quizQuestions ??
              calmUnit.quizQuestions ??
              gameUnit.quizQuestions ??
              []) as Array<{
              question?: string;
              options?: string[];
              correctIndex?: number;
              explanation?: string;
            }>;

            return {
              title: unitTitle,
              summary,
              storyMode: formatStoryMode(storyUnit),
              calmMode: formatCalmMode(calmUnit),
              gameMode: formatGameMode(gameUnit),
              order: index,
              quizQuestions: {
                create: quizSource.map((q) => ({
                  question: q.question ?? "",
                  options: (q.options ?? []) as Prisma.InputJsonValue,
                  correct: correctIndexToLetter(q.correctIndex ?? 0),
                  explanation: q.explanation ?? "",
                })),
              },
            };
          }),
        },
      },
      include: {
        units: {
          include: { quizQuestions: true },
          orderBy: { order: "asc" },
        },
      },
    });

    return NextResponse.json(
      {
        ...course,
        meta: {
          subjectArea: structure.subjectArea,
          unitCount,
          keyTerms: structure.keyTerms,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}