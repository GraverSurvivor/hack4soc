import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { streamTutorResponse } from "@/lib/claude";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const rateLimit = checkRateLimit(session.user.id);
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Please wait a minute." }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    const { question, unitId, history = [] } = await req.json();

    if (!question || !unitId) {
      return new Response(
        JSON.stringify({ error: "Question and unitId are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const unit = await prisma.unit.findUnique({
      where: { id: unitId },
      include: { course: true },
    });

    if (!unit) {
      return new Response(
        JSON.stringify({ error: "Unit not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const iepNote = await prisma.iEPNote.findFirst({
      where: {
        studentId: session.user.id,
        classroomId: unit.course.classroomId,
      },
    });

    const unitContent = `
STORY MODE:
${unit.storyMode}

CALM VISUAL MODE:
${unit.calmMode}

GAME MODE:
${unit.gameMode}
`;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamTutorResponse(
            question,
            unitContent,
            history,
            iepNote?.notes
          )) {
            controller.enqueue(encoder.encode(chunk));
          }
          controller.close();
        } catch {
          controller.enqueue(
            encoder.encode(
              "I'm having trouble right now. Please try again in a moment!"
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    return new Response(JSON.stringify({ error: message }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
}
