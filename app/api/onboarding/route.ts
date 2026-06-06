import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { learningProfile, learningPreferences } = await req.json();

  // Map profile & preferences to story, calm, game scores
  const scores = { story: 0, calm: 0, game: 0 };
  const prefs = learningPreferences || {};
  
  // 1. Input style mapping
  if (prefs.input_style === "Watching videos") scores.calm += 2;
  else if (prefs.input_style === "Reading text") scores.story += 2;
  else if (prefs.input_style === "Listening to audio") { scores.calm += 1; scores.story += 1; }
  else if (prefs.input_style === "Hands-on practice") scores.game += 2;

  // 2. Focus duration mapping
  if (prefs.focus_duration === "Less than 10 mins") scores.game += 2;
  else if (prefs.focus_duration === "10–20 mins") { scores.game += 1; scores.calm += 1; }
  else if (prefs.focus_duration === "20–40 mins") { scores.calm += 1; scores.story += 1; }
  else if (prefs.focus_duration === "More than 40 mins") scores.story += 2;

  // 3. Memory style mapping
  if (prefs.memory_style === "Diagrams & visuals") scores.calm += 2;
  else if (prefs.memory_style === "Repetition & flashcards") scores.game += 2;
  else if (prefs.memory_style === "Stories & examples") scores.story += 2;
  else if (prefs.memory_style === "Writing notes") { scores.story += 1; scores.calm += 1; }

  // 4. Help style mapping
  if (prefs.help_style === "Step-by-step hints") scores.calm += 2;
  else if (prefs.help_style === "A worked example") scores.story += 2;
  else if (prefs.help_style === "Ask someone") scores.story += 1;
  else if (prefs.help_style === "Try again myself") scores.game += 2;

  // 5. Motivation style mapping
  if (prefs.motivation_style === "Points & badges") scores.game += 2;
  else if (prefs.motivation_style === "Written praise") scores.story += 2;
  else if (prefs.motivation_style === "Progress bars") scores.calm += 2;
  else if (prefs.motivation_style === "Leaderboards") scores.game += 2;

  // 6. Cognitive traits mapping (learningProfile percentages)
  const lp = learningProfile || {};
  if ((lp.adhd ?? 0) > 40) { scores.game += 3; scores.calm += 1; }
  if ((lp.dyslexia ?? 0) > 40) { scores.calm += 2; scores.story += 1; }
  if ((lp.auditory_processing ?? 0) > 40) { scores.calm += 3; }
  if ((lp.dyscalculia ?? 0) > 40) { scores.story += 2; }
  if ((lp.dysgraphia ?? 0) > 40) { scores.calm += 2; }

  const dominant = (Object.entries(scores).sort(
    (a, b) => b[1] - a[1]
  )[0][0]) as "story" | "calm" | "game";

  const dbUser = await prisma.user.update({
    where: { email: session.user.email },
    data: {
      hasCompletedOnboarding: true,
      learningProfile,
      learningPreferences,
    },
  });

  // Upsert brain profile relation
  await prisma.brainProfile.upsert({
    where: { userId: dbUser.id },
    update: {
      dominant,
      scores: scores as Prisma.InputJsonValue,
      updatedAt: new Date(),
    },
    create: {
      userId: dbUser.id,
      dominant,
      scores: scores as Prisma.InputJsonValue,
    },
  });

  return NextResponse.json({ success: true });
}