import { prisma } from "./db";

export const BADGE_DEFINITIONS = [
  { name: "First Steps", description: "Complete your first lesson", icon: "🚀", category: "progress" },
  { name: "Story Seeker", description: "Complete 5 lessons in Story Mode", icon: "📖", category: "mode" },
  { name: "Calm Scholar", description: "Complete 5 lessons in Calm Visual Mode", icon: "🧘", category: "mode" },
  { name: "XP Champion", description: "Complete 5 lessons in Game Mode", icon: "🎮", category: "mode" },
  { name: "Perfect Score", description: "Get 100% on a quiz", icon: "💯", category: "quiz" },
  { name: "Quiz Master", description: "Score 90%+ on 5 quizzes", icon: "🏆", category: "quiz" },
  { name: "Streak Starter", description: "Maintain a 3-day login streak", icon: "🔥", category: "streak" },
  { name: "Week Warrior", description: "Maintain a 7-day login streak", icon: "⚡", category: "streak" },
  { name: "Month Master", description: "Maintain a 30-day login streak", icon: "👑", category: "streak" },
  { name: "Brain Explorer", description: "Complete the Brain Profile Quiz", icon: "🧠", category: "profile" },
  { name: "Curious Mind", description: "Ask 10 questions to the AI tutor", icon: "💬", category: "engagement" },
  { name: "Helper", description: "Help a classmate in community chat", icon: "🤝", category: "social" },
  { name: "Speed Learner", description: "Complete a unit in under 10 minutes", icon: "⏱️", category: "progress" },
  { name: "Night Owl", description: "Study after 8 PM", icon: "🦉", category: "engagement" },
  { name: "Early Bird", description: "Study before 7 AM", icon: "🌅", category: "engagement" },
  { name: "Triple Threat", description: "Try all three learning modes", icon: "🌈", category: "mode" },
  { name: "Course Crusher", description: "Complete an entire course", icon: "🎓", category: "progress" },
  { name: "Comeback Kid", description: "Improve quiz score by 30%+ on retry", icon: "📈", category: "quiz" },
  { name: "Focus Master", description: "Use Focus Mode for 5 lessons", icon: "🎯", category: "engagement" },
  { name: "Community Star", description: "Send 50 chat messages", icon: "⭐", category: "social" },
  { name: "XP Legend", description: "Earn 1000 total XP", icon: "💎", category: "xp" },
];

export async function ensureBadgesExist() {
  for (const badge of BADGE_DEFINITIONS) {
    await prisma.badge.upsert({
      where: { name: badge.name },
      update: {},
      create: badge,
    });
  }
}

export async function awardXP(
  userId: string,
  amount: number,
  reason: string
): Promise<number> {
  const [user] = await Promise.all([
    prisma.user.update({
      where: { id: userId },
      data: { xp: { increment: amount } },
    }),
    prisma.xPHistory.create({
      data: { userId, amount, reason },
    }),
  ]);

  await checkXPBadges(userId, user.xp);
  return user.xp;
}

export async function awardBadge(userId: string, badgeName: string) {
  const badge = await prisma.badge.findUnique({ where: { name: badgeName } });
  if (!badge) return;

  await prisma.userBadge.upsert({
    where: { userId_badgeId: { userId, badgeId: badge.id } },
    update: {},
    create: { userId, badgeId: badge.id },
  });
}

async function checkXPBadges(userId: string, totalXP: number) {
  if (totalXP >= 1000) await awardBadge(userId, "XP Legend");
}

export async function updateStreak(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastLogin = user.lastLoginDate ? new Date(user.lastLoginDate) : null;
  if (lastLogin) lastLogin.setHours(0, 0, 0, 0);

  let newStreak = user.streak;

  if (!lastLogin) {
    newStreak = 1;
  } else {
    const diffDays = Math.floor(
      (today.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays === 1) {
      newStreak = user.streak + 1;
    } else if (diffDays > 1) {
      newStreak = 1;
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      streak: newStreak,
      lastLoginDate: today,
      lastActive: new Date(),
    },
  });

  if (newStreak >= 3) await awardBadge(userId, "Streak Starter");
  if (newStreak >= 7) await awardBadge(userId, "Week Warrior");
  if (newStreak >= 30) await awardBadge(userId, "Month Master");
}

export async function checkProgressBadges(
  userId: string,
  learningMode?: string,
  quizScore?: number
) {
  const progressCount = await prisma.studentProgress.count({
    where: { userId, completed: true },
  });

  if (progressCount >= 1) await awardBadge(userId, "First Steps");
  if (quizScore === 100) await awardBadge(userId, "Perfect Score");

  if (learningMode) {
    const modeCount = await prisma.studentProgress.count({
      where: { userId, completed: true, learningMode: learningMode as "story" | "calm" | "game" },
    });
    if (modeCount >= 5) {
      const badgeMap: Record<string, string> = {
        story: "Story Seeker",
        calm: "Calm Scholar",
        game: "XP Champion",
      };
      if (badgeMap[learningMode]) await awardBadge(userId, badgeMap[learningMode]);
    }
  }

  const modes = await prisma.studentProgress.findMany({
    where: { userId, completed: true },
    select: { learningMode: true },
    distinct: ["learningMode"],
  });
  if (modes.length >= 3) await awardBadge(userId, "Triple Threat");
}
