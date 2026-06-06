import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;

    const [user, history] = await Promise.all([
      prisma.user.findUnique({
        where: { id },
        select: { xp: true, streak: true },
      }),
      prisma.xPHistory.findMany({
        where: { userId: id },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ]);

    return NextResponse.json({ xp: user?.xp || 0, streak: user?.streak || 0, history });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
