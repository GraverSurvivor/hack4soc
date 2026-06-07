import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { chatMessageSchema } from "@/lib/validations";
import { generateSparkChatResponse, moderateChatMessage } from "@/lib/claude";
import { parseCalmContent, parseStoryContent } from "@/lib/content";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const rateLimit = checkRateLimit(`chat-${session.user.id}`);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many messages. Please slow down." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = chatMessageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { content, classroomId } = parsed.data;

    const member = await prisma.classroomMember.findFirst({
      where: { userId: session.user.id, classroomId },
    });
    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId },
    });

    if (!member && classroom?.teacherId !== session.user.id) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 });
    }

    const isSparkMention = /@spark/i.test(content);

    if (!isSparkMention) {
      const moderation = await moderateChatMessage(content);
      if (!moderation.safe) {
        return NextResponse.json(
          { error: moderation.reason || "Message not appropriate for classroom" },
          { status: 400 }
        );
      }
    }

    const message = await prisma.chatMessage.create({
      data: {
        classroomId,
        userId: session.user.id,
        userName: session.user.name || "User",
        content,
      },
    });

    let sparkReply = null;
    if (isSparkMention) {
      const courses = await prisma.course.findMany({
        where: { classroomId },
        include: { units: true },
      });
      const courseContext = courses
        .flatMap((c) =>
          c.units.map((u) => {
            const story = parseStoryContent(u.storyMode).slice(0, 400);
            const calm = parseCalmContent(u.calmMode).slice(0, 300);
            return `Unit: ${u.title}\nSummary: ${u.summary}\nStory excerpt: ${story}\nCalm excerpt: ${calm}`;
          })
        )
        .join("\n\n");

      const question = content.replace(/@spark/gi, "").trim();
      const answer = await generateSparkChatResponse(question, courseContext);

      sparkReply = await prisma.chatMessage.create({
        data: {
          classroomId,
          userId: "ai",
          userName: "Spark ✨",
          content: answer,
          isAI: true,
        },
      });
    }

    return NextResponse.json({ message, sparkReply }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
