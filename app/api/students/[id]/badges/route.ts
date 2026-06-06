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

    const badges = await prisma.userBadge.findMany({
      where: { userId: id },
      include: { badge: true },
      orderBy: { earnedAt: "desc" },
    });

    const allBadges = await prisma.badge.findMany();
    const earnedIds = new Set(badges.map((b) => b.badgeId));

    return NextResponse.json({
      earned: badges,
      available: allBadges.filter((b) => !earnedIds.has(b.id)),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
