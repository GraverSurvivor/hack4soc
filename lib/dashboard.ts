import { prisma } from "./db";
import { daysSince, getTrendArrow } from "./utils";

export async function getDashboardData(classroomId: string) {
  const classroom = await prisma.classroom.findUnique({
    where: { id: classroomId },
    include: {
      members: {
        include: {
          user: {
            include: {
              brainProfile: true,
              progress: {
                include: { unit: { include: { course: true } } },
              },
              badges: { include: { badge: true } },
            },
          },
        },
      },
      courses: {
        include: {
          units: {
            include: { quizQuestions: true, progress: true },
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });

  if (!classroom) throw new Error("Classroom not found");

  const students = classroom.members
    .filter((m) => m.user.role === "STUDENT")
    .map((m) => m.user);

  const allUnits = classroom.courses.flatMap((c) => c.units);
  const totalUnits = allUnits.length;

  const studentCards = students.map((student) => {
    const studentProgress = student.progress.filter((p) =>
      allUnits.some((u) => u.id === p.unitId)
    );
    const completed = studentProgress.filter((p) => p.completed).length;
    const completionPct = totalUnits > 0 ? (completed / totalUnits) * 100 : 0;
    const scores = studentProgress
      .filter((p) => p.quizScore != null)
      .map((p) => p.quizScore!);
    const avgScore =
      scores.length > 0
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : 0;

    const recentScores = scores.slice(-3);
    const olderScores = scores.slice(-6, -3);
    const recentAvg =
      recentScores.length > 0
        ? recentScores.reduce((a, b) => a + b, 0) / recentScores.length
        : 0;
    const olderAvg =
      olderScores.length > 0
        ? olderScores.reduce((a, b) => a + b, 0) / olderScores.length
        : recentAvg;

    return {
      id: student.id,
      name: student.name,
      avatar: student.avatar,
      brainProfile: student.brainProfile?.dominant || "calm",
      lastActive: student.lastActive,
      completionPct: Math.round(completionPct),
      avgScore: Math.round(avgScore),
      trend: getTrendArrow(recentAvg, olderAvg),
      xp: student.xp,
      streak: student.streak,
    };
  });

  const avgCompletion =
    studentCards.length > 0
      ? studentCards.reduce((a, s) => a + s.completionPct, 0) /
        studentCards.length
      : 0;

  const allScores = studentCards.map((s) => s.avgScore).filter((s) => s > 0);
  const avgQuizScore =
    allScores.length > 0
      ? allScores.reduce((a, b) => a + b, 0) / allScores.length
      : 0;

  const modeDistribution = { story: 0, calm: 0, game: 0 };
  for (const student of students) {
    const mode = student.brainProfile?.dominant as keyof typeof modeDistribution;
    if (mode && modeDistribution[mode] !== undefined) {
      modeDistribution[mode]++;
    } else {
      modeDistribution.calm++;
    }
  }

  const atRiskAlerts = students
    .filter((student) => {
      const inactive = daysSince(student.lastActive) >= 3;
      const progress = student.progress;
      const recentQuizzes = progress
        .filter((p) => p.quizScore != null)
        .sort((a, b) => (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0))
        .slice(0, 2);
      const lowScores =
        recentQuizzes.length >= 2 &&
        recentQuizzes.every((p) => (p.quizScore || 0) < 50);
      return inactive || lowScores;
    })
    .map((student) => {
      const reasons: string[] = [];
      if (daysSince(student.lastActive) >= 3) {
        reasons.push(`Inactive for ${daysSince(student.lastActive)} days`);
      }
      const recentQuizzes = student.progress
        .filter((p) => p.quizScore != null)
        .sort((a, b) => (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0))
        .slice(0, 2);
      if (
        recentQuizzes.length >= 2 &&
        recentQuizzes.every((p) => (p.quizScore || 0) < 50)
      ) {
        reasons.push("Scored below 50% on last 2 quizzes");
      }
      return {
        studentId: student.id,
        studentName: student.name,
        reasons,
      };
    });

  const heatmap = students.map((student) => ({
    studentId: student.id,
    studentName: student.name,
    units: allUnits.map((unit) => {
      const progress = student.progress.find((p) => p.unitId === unit.id);
      return {
        unitId: unit.id,
        unitTitle: unit.title,
        score: progress?.quizScore ?? null,
        completed: progress?.completed ?? false,
        quizAnswers: progress?.quizAnswers ?? null,
      };
    }),
  }));

  return {
    overview: {
      totalStudents: students.length,
      avgCompletion: Math.round(avgCompletion),
      avgQuizScore: Math.round(avgQuizScore),
      atRiskCount: atRiskAlerts.length,
    },
    modeDistribution,
    studentCards,
    atRiskAlerts,
    heatmap,
    courses: classroom.courses.map((c) => ({
      id: c.id,
      title: c.title,
      unitCount: c.units.length,
    })),
  };
}
