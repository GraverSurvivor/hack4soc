import { splitIntoLevels } from "@/lib/utils";

export interface LevelChallenge {
  question: string;
  options: string[];
  correctIndex: number;
  hint?: string;
}

export interface GameLevel {
  title: string;
  body: string;
  challenge?: LevelChallenge;
}

export interface GameContent {
  questTitle?: string;
  xpReward?: number;
  levels: GameLevel[];
}

export function correctIndexToLetter(index: number | string): string {
  const n = typeof index === "string" ? parseInt(index, 10) : index;
  if (Number.isNaN(n) || n < 0) return "A";
  return String.fromCharCode(65 + n);
}

export function normalizeCorrectAnswer(correct: string, optionsLength = 4): string {
  const trimmed = correct.trim();
  if (/^[A-D]$/i.test(trimmed)) return trimmed.toUpperCase();
  const asNum = parseInt(trimmed, 10);
  if (!Number.isNaN(asNum) && asNum >= 0 && asNum < optionsLength) {
    return correctIndexToLetter(asNum);
  }
  return trimmed.toUpperCase();
}

function tryParseJson(raw: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed : null;
  } catch {
    return null;
  }
}

export function formatStoryMode(unit: Record<string, unknown> | string): string {
  if (typeof unit === "string") {
    const parsed = tryParseJson(unit);
    if (parsed?.narrative) return String(parsed.narrative);
    return unit;
  }
  if (unit.narrative) return String(unit.narrative);
  if (unit.conceptSummary) {
    const summary = String(unit.conceptSummary);
    const keyPoints = Array.isArray(unit.keyPoints)
      ? (unit.keyPoints as string[]).map((p) => `• ${p}`).join("\n")
      : "";
    return `${summary}\n\n${keyPoints}`.trim();
  }
  return JSON.stringify(unit);
}

export function formatCalmMode(unit: Record<string, unknown> | string): string {
  if (typeof unit === "string") {
    const parsed = tryParseJson(unit);
    if (parsed?.cards) return formatCalmFromCards(parsed.cards as { heading: string; body: string }[]);
    return unit;
  }
  if (Array.isArray(unit.cards)) {
    return formatCalmFromCards(unit.cards as { heading: string; body: string }[]);
  }
  if (unit.conceptSummary) {
    const summary = String(unit.conceptSummary);
    const keyPoints = Array.isArray(unit.keyPoints)
      ? (unit.keyPoints as string[]).map((p) => `## Key Point\n\n${p}`).join("\n\n")
      : "";
    return `# ${unit.unitTitle ?? "Lesson"}\n\n## Overview\n\n${summary}\n\n${keyPoints}`.trim();
  }
  return JSON.stringify(unit);
}

function formatCalmFromCards(cards: { heading: string; body: string }[]): string {
  return cards.map((c) => `## ${c.heading}\n\n${c.body}`).join("\n\n");
}

function challengeFromQuiz(
  quizQuestions: Array<{ question: string; options: string[]; correctIndex: number; explanation?: string }>,
  index: number
): LevelChallenge | undefined {
  const q = quizQuestions[index];
  if (!q) return undefined;
  return {
    question: q.question,
    options: q.options,
    correctIndex: q.correctIndex ?? 0,
    hint: q.explanation,
  };
}

export function formatGameMode(unit: Record<string, unknown> | string): string {
  if (typeof unit === "string") {
    const parsed = tryParseJson(unit);
    if (parsed?.levels) return unit;
    return unit;
  }

  if (Array.isArray(unit.levels) && unit.levels.length > 0) {
    return JSON.stringify({
      questTitle: unit.questTitle ?? unit.unitTitle,
      xpReward: unit.xpReward ?? 100,
      levels: unit.levels,
    });
  }

  const quizQuestions = (unit.quizQuestions ?? []) as Array<{
    question: string;
    options: string[];
    correctIndex: number;
    explanation?: string;
  }>;
  const keyPoints = (unit.keyPoints ?? []) as string[];
  const vocabulary = (unit.vocabulary ?? []) as { term: string; definition: string }[];

  const levels: GameLevel[] = [];
  const questTitle = String(unit.questTitle ?? unit.unitTitle ?? "Quest");
  const questObjective = String(unit.questObjective ?? unit.conceptSummary ?? "");

  levels.push({
    title: `Level 1: ${questTitle}`,
    body: [
      `🌟 **Mission:** ${questObjective}`,
      "",
      "**Intel:**",
      ...keyPoints.slice(0, 3).map((p) => `• ${p}`),
    ].join("\n"),
    challenge: challengeFromQuiz(quizQuestions, 0),
  });

  if (keyPoints.length > 3 || vocabulary.length > 0) {
    levels.push({
      title: "Level 2: Power-Up Knowledge",
      body: [
        "**Power-ups unlocked:**",
        ...keyPoints.slice(3).map((p) => `⚡ ${p}`),
        "",
        vocabulary.length > 0 ? "**Vocabulary loot:**" : "",
        ...vocabulary.slice(0, 3).map((v) => `📖 **${v.term}** — ${v.definition}`),
      ]
        .filter(Boolean)
        .join("\n"),
      challenge: challengeFromQuiz(quizQuestions, 1),
    });
  }

  levels.push({
    title: `Level ${levels.length + 1}: Boss Challenge`,
    body: [
      "🏆 **Final gate ahead!**",
      "",
      "Use everything you've learned to unlock the boss challenge.",
      questObjective ? `\n${questObjective}` : "",
    ].join("\n"),
    challenge: challengeFromQuiz(quizQuestions, 2),
  });

  return JSON.stringify({
    questTitle,
    xpReward: unit.xpReward ?? levels.length * 100,
    levels,
  });
}

export function parseGameMode(raw: string): GameContent {
  const parsed = tryParseJson(raw);
  if (parsed?.levels && Array.isArray(parsed.levels)) {
    return {
      questTitle: parsed.questTitle as string | undefined,
      xpReward: parsed.xpReward as number | undefined,
      levels: parsed.levels as GameLevel[],
    };
  }

  const textLevels = splitIntoLevels(raw);
  return {
    levels: textLevels.map((level, i) => {
      const challengeMatch = level.body.match(
        /⚔️\s*CHALLENGE:\s*(.+?)(?:\n|$)([\s\S]*?)(?:✅|🎉|🏆|$)/i
      );
      if (!challengeMatch) {
        return { title: level.title, body: level.body };
      }

      const question = challengeMatch[1].trim();
      const optionsBlock = challengeMatch[2] ?? "";
      const optionLines = optionsBlock
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => /^[A-D]\)/i.test(l));

      const options = optionLines.map((l) => l.replace(/^[A-D]\)\s*/i, "").replace(/\s*✓.*$/, "").trim());
      let correctIndex = optionLines.findIndex((l) => l.includes("✓"));
      if (correctIndex === -1) correctIndex = 0;

      const body = level.body.replace(/⚔️\s*CHALLENGE:[\s\S]*?(✅|🎉|🏆|$)/i, "").trim();

      return {
        title: level.title,
        body,
        challenge: options.length >= 2 ? { question, options, correctIndex, hint: "Review the level content above!" } : undefined,
      };
    }),
  };
}

export function parseStoryContent(raw: string): string {
  const parsed = tryParseJson(raw);
  if (parsed?.narrative) return String(parsed.narrative);
  return raw;
}

export function parseCalmContent(raw: string): string {
  const parsed = tryParseJson(raw);
  if (parsed?.cards) return formatCalmFromCards(parsed.cards as { heading: string; body: string }[]);
  return raw;
}
