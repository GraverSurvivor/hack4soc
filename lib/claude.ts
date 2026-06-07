// lib/claude.ts
// AI layer using OpenRouter free tier models via OpenAI-compatible API.
// Falls back to stub content if AI fails so the app never returns 422.

import OpenAI from "openai";
import {
  BRAIN_PROFILE_QUIZ_SYSTEM,
  CHAT_MODERATION_SYSTEM,
  CHAT_SPARK_SYSTEM,
  buildCoursePrompt,
  tutorSystemPrompt,
} from "@/lib/prompts";
import type { StructuredContent } from "@/types/course";

const API_KEY = process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error("OPENROUTER_API_KEY or GEMINI_API_KEY is missing in .env");
}

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: API_KEY,
  defaultHeaders: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    "X-Title": "NeuroSpark",
  },
});

const MODELS = [
  "google/gemma-2-9b-it:free",
  "mistralai/mistral-7b-instruct:free",
  "meta-llama/llama-3.2-3b-instruct:free",
  "microsoft/phi-3-mini-128k-instruct:free",
];

const COURSE_SYSTEM = `You are an expert curriculum designer for inclusive K-12 education.
You produce accurate, engaging JSON lesson units from source documents.
Never invent facts. Always return valid JSON arrays only — no markdown, no commentary.`;

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

async function chatOnce(
  messages: ChatMessage[],
  maxTokens = 2000
): Promise<string> {
  for (const model of MODELS) {
    try {
      const response = await client.chat.completions.create({
        model,
        max_tokens: maxTokens,
        messages,
      });
      const text = response.choices[0]?.message?.content?.trim() ?? "";
      if (text) return text;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`❌ [${model}] chat failed:`, message);
    }
  }
  return "";
}

function extractJsonObject(text: string): Record<string, unknown> | null {
  const cleaned = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function extractJsonArray(text: string): unknown[] | null {
  const cleaned = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start === -1 || end === -1) return null;
  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1));
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

// ── Stub generator (used if ALL models fail) ─────────────────────────────────
function buildStubUnits(content: StructuredContent, mode: "story" | "calm" | "game"): Record<string, unknown>[] {
  const sections = content.sections.slice(0, 5);
  return sections.map((section, i) => {
    const base = {
      unitTitle: section.heading || `Unit ${i + 1}`,
      conceptSummary: section.content.slice(0, 200).replace(/\n/g, " ") + "...",
      keyPoints: [
        "Key concept from this section",
        "Important term to understand",
        "Core principle covered here",
      ],
      vocabulary: (content.keyTerms ?? []).slice(0, 3).map((term) => ({
        term,
        definition: `Definition of ${term} from the uploaded document.`,
        exampleSentence: `${term} is an important concept in this subject.`,
      })),
      quizQuestions: [
        {
          question: `What is the main topic of the section titled "${section.heading}"?`,
          options: [section.heading, "An unrelated topic", "A different concept", "None of the above"],
          correctIndex: 0,
          explanation: `This section is specifically about ${section.heading}.`,
        },
        {
          question: "Which subject area does this material belong to?",
          options: [content.subjectArea, "History", "Literature", "Geography"],
          correctIndex: 0,
          explanation: `This is a ${content.subjectArea} topic.`,
        },
        {
          question: "What is the title of the full document?",
          options: [content.title, "Unknown Title", "Another Document", "Sample Text"],
          correctIndex: 0,
          explanation: `The document is titled "${content.title}".`,
        },
        {
          question: `Which detail best matches "${section.heading}"?`,
          options: [
            section.content.slice(0, 60).replace(/\n/g, " ") || section.heading,
            "Something not in the lesson",
            "A random guess",
            "None of these",
          ],
          correctIndex: 0,
          explanation: "The correct answer comes directly from this section.",
        },
        {
          question: "Why is this concept worth learning?",
          options: [
            `It helps you understand ${content.subjectArea} better`,
            "It has no real use",
            "It only matters on tests",
            "It is unrelated to the course",
          ],
          correctIndex: 0,
          explanation: "Understanding core ideas builds a strong foundation.",
        },
      ],
    };

    if (mode === "story") {
      return {
        ...base,
        narrative: `Spark floated beside a curious student and smiled. "Today we're exploring ${section.heading}," Spark said warmly.\n\n${section.content.slice(0, 400).replace(/\n/g, " ")}...\n\nSpark paused and asked, "Can you picture it?" The student nodded — this idea was starting to make sense.\n\n"That's the magic of ${content.subjectArea}," Spark whispered. "One concept at a time, we build something amazing."`,
      };
    }
    if (mode === "calm") {
      return {
        ...base,
        cards: [
          { heading: "What is this about?", body: section.heading },
          { heading: "Key idea", body: section.content.slice(0, 150).replace(/\n/g, " ") },
          { heading: "Why it matters", body: `Understanding ${section.heading} helps us learn more about ${content.subjectArea}.` },
        ],
      };
    }

    return {
      ...base,
      questTitle: `Quest: Unlock ${section.heading}`,
      questObjective: `Learn about ${section.heading} and beat 3 challenges to earn XP!`,
      xpReward: (i + 1) * 100,
      levels: [
        {
          title: `Level 1: ${section.heading}`,
          body: `🌟 Mission start! ${section.content.slice(0, 200).replace(/\n/g, " ")}...`,
          challenge: base.quizQuestions[0],
        },
        {
          title: "Level 2: Power-Up",
          body: "⚡ Review the key ideas and unlock the next challenge!",
          challenge: base.quizQuestions[1],
        },
        {
          title: "Level 3: Boss Gate",
          body: "🏆 Final challenge! Prove what you've learned.",
          challenge: base.quizQuestions[2],
        },
      ],
    };
  });
}

async function tryModels(prompt: string, mode: string): Promise<Record<string, unknown>[] | null> {
  for (const model of MODELS) {
    try {
      console.log(`🚀 Trying model: ${model} [${mode}]`);
      const response = await client.chat.completions.create({
        model,
        max_tokens: 8000,
        temperature: mode === "calm" ? 0.3 : 0.7,
        messages: [
          { role: "system", content: COURSE_SYSTEM },
          { role: "user", content: prompt },
        ],
      });

      const raw = response.choices[0]?.message?.content ?? "";
      if (!raw.trim()) continue;

      const parsed = extractJsonArray(raw);
      if (parsed && parsed.length > 0) {
        const normalized = (parsed as Record<string, unknown>[]).map(normalizeUnit);
        console.log(`✅ [${model}] parsed ${normalized.length} units`);
        return normalized;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`❌ [${model}] failed:`, message);
    }
  }
  return null;
}

function normalizeUnit(unit: Record<string, unknown>): Record<string, unknown> {
  const quizQuestions = Array.isArray(unit.quizQuestions) ? unit.quizQuestions : [];
  const normalizedQuiz = quizQuestions.slice(0, 5).map((q: Record<string, unknown>) => {
    const options = Array.isArray(q.options) ? q.options.slice(0, 4) : [];
    while (options.length < 4) options.push("Option");
    const correctIndex = typeof q.correctIndex === "number" ? q.correctIndex : 0;
    return {
      question: String(q.question ?? ""),
      options,
      correctIndex: Math.min(3, Math.max(0, correctIndex)),
      explanation: String(q.explanation ?? ""),
    };
  });

  return { ...unit, quizQuestions: normalizedQuiz };
}

async function generateMode(
  content: StructuredContent,
  mode: "story" | "calm" | "game",
  iepEnabled = false
): Promise<Record<string, unknown>[]> {
  let prompt: string;
  try {
    prompt = buildCoursePrompt(content, mode, iepEnabled);
  } catch {
    return buildStubUnits(content, mode);
  }

  const result = await tryModels(prompt, mode);
  return result ?? buildStubUnits(content, mode);
}

export async function generateCourseContent(
  input: StructuredContent | unknown,
  iepEnabled = false
): Promise<{ structure: StructuredContent; story: Record<string, unknown>[]; calm: Record<string, unknown>[]; game: Record<string, unknown>[] }> {
  let structure: StructuredContent;

  if (
    input &&
    typeof input === "object" &&
    "sections" in (input as object) &&
    "title" in (input as object)
  ) {
    structure = input as StructuredContent;
  } else {
    const text =
      typeof input === "string"
        ? input
        : Buffer.isBuffer(input)
        ? (input as Buffer).toString("utf-8")
        : JSON.stringify(input);

    structure = {
      title: "Uploaded Course",
      subjectArea: "General",
      sections: [{ heading: "Content", content: text.slice(0, 5000), level: 1 }],
      keyTerms: [],
      figures: [],
      tables: [],
      rawText: text,
    };
  }

  const [story, calm, game] = await Promise.all([
    generateMode(structure, "story", iepEnabled),
    generateMode(structure, "calm", iepEnabled),
    generateMode(structure, "game", iepEnabled),
  ]);

  return { structure, story, calm, game };
}

export async function* streamTutorResponse(
  question: string,
  unitContent: string,
  history: { role: string; content: string }[] = [],
  accommodationNotes?: string
): AsyncGenerator<string> {
  const system = tutorSystemPrompt(unitContent, accommodationNotes);
  const messages: ChatMessage[] = [
    { role: "system", content: system },
    ...history
      .filter((m) => m.role === "user" || m.role === "assistant")
      .slice(-6)
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    { role: "user", content: question },
  ];

  for (const model of MODELS) {
    try {
      const stream = await client.chat.completions.create({
        model,
        max_tokens: 800,
        stream: true,
        messages,
      });

      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content;
        if (text) yield text;
      }
      return;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`❌ [${model}] tutor stream failed:`, message);
    }
  }

  const fallback = await chatOnce(messages, 600);
  yield fallback || "I'm having trouble connecting right now. Please try again in a moment!";
}

export async function moderateChatMessage(
  content: string
): Promise<{ safe: boolean; reason?: string }> {
  const raw = await chatOnce(
    [
      { role: "system", content: CHAT_MODERATION_SYSTEM },
      { role: "user", content },
    ],
    200
  );

  const parsed = extractJsonObject(raw);
  if (parsed && typeof parsed.safe === "boolean") {
    return {
      safe: parsed.safe,
      reason: typeof parsed.reason === "string" ? parsed.reason : undefined,
    };
  }

  // Fail open for moderation so chat isn't blocked when AI is down
  return { safe: true };
}

export async function generateSparkChatResponse(
  question: string,
  courseContext: string
): Promise<string> {
  const answer = await chatOnce(
    [
      { role: "system", content: CHAT_SPARK_SYSTEM },
      {
        role: "user",
        content: `COURSE CONTENT:\n${courseContext || "No course content loaded yet."}\n\nSTUDENT QUESTION: ${question}`,
      },
    ],
    400
  );

  return (
    answer ||
    "Hi! I'm Spark ✨ I'm having a little trouble right now — try asking again in a moment!"
  );
}

export async function generateBrainProfileQuiz(): Promise<{
  questions: Array<{
    question: string;
    options: Array<{ text: string; type: "story" | "calm" | "game" }>;
  }>;
}> {
  const raw = await chatOnce(
    [{ role: "system", content: BRAIN_PROFILE_QUIZ_SYSTEM }],
    3000
  );

  const parsed = extractJsonObject(raw);
  if (parsed?.questions && Array.isArray(parsed.questions)) {
    return {
      questions: parsed.questions as Array<{
        question: string;
        options: Array<{ text: string; type: "story" | "calm" | "game" }>;
      }>,
    };
  }

  return {
    questions: [
      {
        question: "When learning something new, what sounds most fun?",
        options: [
          { text: "A story adventure with characters", type: "story" },
          { text: "Clear cards I can read at my own pace", type: "calm" },
          { text: "A game with levels and XP", type: "game" },
        ],
      },
      {
        question: "How do you like information presented?",
        options: [
          { text: "As a narrative with a guide", type: "story" },
          { text: "Step-by-step with visuals", type: "calm" },
          { text: "Short challenges and rewards", type: "game" },
        ],
      },
      {
        question: "What keeps you most engaged?",
        options: [
          { text: "Characters and plot twists", type: "story" },
          { text: "Predictable structure and calm pacing", type: "calm" },
          { text: "Beating levels and earning points", type: "game" },
        ],
      },
      {
        question: "When stuck on a problem, you prefer to...",
        options: [
          { text: "Imagine a story about the concept", type: "story" },
          { text: "Break it into smaller calm steps", type: "calm" },
          { text: "Turn it into a mini-challenge", type: "game" },
        ],
      },
      {
        question: "Your ideal study session feels like...",
        options: [
          { text: "Reading an exciting book", type: "story" },
          { text: "Organizing flashcards quietly", type: "calm" },
          { text: "Playing an educational game", type: "game" },
        ],
      },
      {
        question: "What motivates you to keep going?",
        options: [
          { text: "Finding out what happens next", type: "story" },
          { text: "Checking off each concept clearly", type: "calm" },
          { text: "Leveling up and unlocking rewards", type: "game" },
        ],
      },
      {
        question: "In a group project, you usually...",
        options: [
          { text: "Tell the story of our idea", type: "story" },
          { text: "Make a clear plan and checklist", type: "calm" },
          { text: "Turn tasks into a friendly competition", type: "game" },
        ],
      },
      {
        question: "When reviewing for a test, you like...",
        options: [
          { text: "Connecting facts into a story", type: "story" },
          { text: "Reviewing one topic at a time calmly", type: "calm" },
          { text: "Quiz games and timed challenges", type: "game" },
        ],
      },
      {
        question: "Your favorite apps usually have...",
        options: [
          { text: "Stories or characters", type: "story" },
          { text: "Clean, simple layouts", type: "calm" },
          { text: "Points, badges, or levels", type: "game" },
        ],
      },
      {
        question: "Learning feels best when it is...",
        options: [
          { text: "Imaginative and narrative", type: "story" },
          { text: "Structured and low-stress", type: "calm" },
          { text: "Interactive and game-like", type: "game" },
        ],
      },
    ],
  };
}
