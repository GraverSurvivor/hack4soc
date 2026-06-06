// lib/claude.ts
// Course generation using OpenRouter free tier.
// Falls back to stub content if AI fails so the app never returns 422.

import OpenAI from "openai";
import { buildCoursePrompt } from "@/lib/prompts";
import type { StructuredContent } from "@/types/course";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is missing in .env");
}

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.GEMINI_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    "X-Title": "NeuroSpark",
  },
});

// Try these models in order until one works
const MODELS = [
  "mistralai/mistral-7b-instruct:free",
  "meta-llama/llama-3.2-3b-instruct:free",
  "microsoft/phi-3-mini-128k-instruct:free",
];

// ── Stub generator (used if ALL models fail) ─────────────────────────────────
function buildStubUnits(content: StructuredContent, mode: "story" | "calm" | "game"): any[] {
  const sections = content.sections.slice(0, 5);
  return sections.map((section, i) => {
    const base = {
      unitTitle: section.heading || `Unit ${i + 1}`,
      conceptSummary: section.content.slice(0, 200).replace(/\n/g, " ") + "...",
      keyPoints: [
        "Core principle covered in this lesson",
        "Key mechanisms to understand and master",
        "Essential learning facts from this section",
      ],
      vocabulary: (content.keyTerms ?? []).slice(0, 3).map((term) => ({
        term,
        definition: `Definition of ${term} from the uploaded document.`,
        exampleSentence: `${term} is an important concept in this subject.`,
      })),
      quizQuestions: [
        {
          question: `Which key concept is discussed in ${section.heading || "this lesson"}?`,
          options: [
            section.heading || "The main topic",
            "A completely unrelated idea",
            "An opposite theory",
            "A concept not covered here",
          ],
          correctIndex: 0,
          explanation: `This lesson covers ${section.heading || "the main topic"} in detail.`,
        },
        {
          question: `According to this lesson, what is the core focus of the topic?`,
          options: [
            "To understand the fundamental principles and mechanisms",
            "To ignore the facts",
            "To study a different topic",
            "To memorize the title only",
          ],
          correctIndex: 0,
          explanation: "The material focuses on understanding the primary mechanisms and principles.",
        },
        {
          question: `What is a correct statement about this topic based on the reading?`,
          options: [
            "It is an important subject area containing factual information",
            "It is completely fictional",
            "It has no real-world application",
            "It was discovered yesterday",
          ],
          correctIndex: 0,
          explanation: "The reading contains factual details about this subject area.",
        },
        {
          question: "What is the primary value of studying this concept?",
          options: [
            "It builds a foundation of knowledge for advanced topics",
            "It has no educational value",
            "It replaces other subjects entirely",
            "It is only useful for exams",
          ],
          correctIndex: 0,
          explanation: "Mastering foundational principles prepares learners for advanced conceptual learning.",
        },
        {
          question: "How should a student approach learning this material?",
          options: [
            "By reviewing key terms, summaries, and taking practice quizzes",
            "By copying the text verbatim without thinking",
            "By ignoring all diagrams and vocabulary definitions",
            "By studying for only three seconds",
          ],
          correctIndex: 0,
          explanation: "Active retrieval methods like quizzes and vocabulary review are highly effective for learning.",
        },
        {
          question: "What is key to mastering any educational material?",
          options: [
            "Consistent practice and conceptual understanding",
            "Skipping all quizzes and lessons",
            "Procrastinating until the last second",
            "Reading only the first word of the page",
          ],
          correctIndex: 0,
          explanation: "Regular practice and focused study are critical to learning success.",
        },
        {
          question: "Which of the following is most helpful for long-term memory?",
          options: [
            "Testing yourself repeatedly and explaining concepts",
            "Cramming the night before and forgetting it immediately",
            "Studying in a loud, distracting environment",
            "Never reviewing the material after the first read",
          ],
          correctIndex: 0,
          explanation: "Active recall and self-testing reinforce neural paths and memory retention.",
        },
        {
          question: "What should you do if you struggle with a concept?",
          options: [
            "Ask the AI tutor for hints or consult your teacher",
            "Give up immediately and close the browser",
            "Guess randomly without reading the explanation",
            "Pretend you understand and ignore it",
          ],
          correctIndex: 0,
          explanation: "Seeking support and using adaptive learning modes helps clear up doubts.",
        },
        // Short Answer Questions (options = [])
        {
          question: "Fill in the blank: Active recall is a highly effective method for ________.",
          options: [],
          correctIndex: "learning",
          explanation: "Active recall helps reinforce learning and memory retention.",
        },
        {
          question: "Fill in the blank: The friendly AI assistant who guides you through lessons is named ________.",
          options: [],
          correctIndex: "Spark",
          explanation: "Spark is your guide throughout the learning modes on the NeuroSpark platform.",
        },
      ],
    };

    if (mode === "story") {
      return {
        ...base,
        narrative: `Spark ✨, our curious light guide, was traveling through the fascinating world of ${content.subjectArea} when they discovered a mysterious glowing pathway labeled: ${section.heading || "The Secret Lesson"}.

Spark floated closer, feeling the warm energy of knowledge. As Spark examined the details, they learned something incredible: ${section.content.slice(0, 700).replace(/\n/g, " ")}...

"Wow!" Spark exclaimed, their eyes shining bright. "This means understanding ${section.heading || "this concept"} is absolutely key to unlocking the power of ${content.subjectArea}!"

To continue, Spark needs your help. [Interactive Choice: Activate the blue energy crystal | Inspect the golden leaf crystal]`,
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
    // game
    return {
      ...base,
      questTitle: `Quest: Unlock ${section.heading}`,
      questObjective: `Learn about ${section.heading} and answer 3 questions to earn XP!`,
      xpReward: (i + 1) * 100,
    };
  });
}

// ── Try one prompt against multiple models ────────────────────────────────────
async function tryModels(prompt: string): Promise<any[] | null> {
  for (const model of MODELS) {
    try {
      console.log(`🚀 Trying model: ${model}`);
      const response = await client.chat.completions.create({
        model,
        max_tokens: 4000,
        messages: [{ role: "user", content: prompt }],
      });

      const raw = response.choices[0]?.message?.content ?? "";
      console.log(`📦 [${model}] finish_reason: ${response.choices[0]?.finish_reason}`);
      console.log(`📦 [${model}] raw (first 400 chars): ${raw.slice(0, 400)}`);

      if (!raw.trim()) {
        console.warn(`⚠️ [${model}] returned empty response`);
        continue;
      }

      // Strip markdown fences
      const cleaned = raw
        .replace(/```json\s*/gi, "")
        .replace(/```\s*/g, "")
        .trim();

      // Find the JSON array in the response
      const startIdx = cleaned.indexOf("[");
      const endIdx = cleaned.lastIndexOf("]");
      if (startIdx === -1 || endIdx === -1) {
        console.warn(`⚠️ [${model}] no JSON array found in response`);
        continue;
      }

      const jsonStr = cleaned.slice(startIdx, endIdx + 1);
      const parsed = JSON.parse(jsonStr);

      if (!Array.isArray(parsed) || parsed.length === 0) {
        console.warn(`⚠️ [${model}] parsed result is empty array`);
        continue;
      }

      console.log(`✅ [${model}] parsed ${parsed.length} units successfully`);
      return parsed;
    } catch (err: any) {
      console.error(`❌ [${model}] failed:`, err?.message ?? err);
    }
  }
  return null;
}

// ── Generate one mode ─────────────────────────────────────────────────────────
async function generateMode(
  content: StructuredContent,
  mode: "story" | "calm" | "game",
  iepEnabled = false
): Promise<any[]> {
  console.log(`\n=== generateMode [${mode}] starting ===`);

  let prompt: string;
  try {
    prompt = buildCoursePrompt(content, mode, iepEnabled);
    console.log(`✅ [${mode}] prompt built OK, length: ${prompt.length}`);
  } catch (err: any) {
    console.error(`💥 [${mode}] buildCoursePrompt CRASHED:`, err?.message ?? err);
    console.log(`⚠️ [${mode}] falling back to stub content`);
    return buildStubUnits(content, mode);
  }

  const result = await tryModels(prompt);

  if (result) return result;

  console.warn(`⚠️ [${mode}] all models failed — using stub content`);
  return buildStubUnits(content, mode);
}

// ── Main export ───────────────────────────────────────────────────────────────
export async function generateCourseContent(
  input: StructuredContent | unknown,
  iepEnabled = false
): Promise<{ structure: StructuredContent; story: any[]; calm: any[]; game: any[] }> {
  // Normalise input — parser returns StructuredContent directly
  let structure: StructuredContent;

  if (
    input &&
    typeof input === "object" &&
    "sections" in (input as object) &&
    "title" in (input as object)
  ) {
    structure = input as StructuredContent;
  } else {
    // Fallback: received raw text or something unexpected
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

  console.log(`\n📚 generateCourseContent: "${structure.title}" | ${structure.sections?.length ?? 0} sections`);

  // Generate all 3 modes — errors are caught inside generateMode, never bubble up
  const [story, calm, game] = await Promise.all([
    generateMode(structure, "story", iepEnabled),
    generateMode(structure, "calm", iepEnabled),
    generateMode(structure, "game", iepEnabled),
  ]);

  console.log(`\n📊 Results: story=${story.length}, calm=${calm.length}, game=${game.length}`);
  return { structure, story, calm, game };
}

// ── Moderate Chat Message ───────────────────────────────────────────────────
export async function moderateChatMessage(
  content: string
): Promise<{ safe: boolean; reason?: string }> {
  try {
    const response = await client.chat.completions.create({
      model: "meta-llama/llama-3.2-3b-instruct:free",
      messages: [
        {
          role: "system",
          content: "You are a content moderation assistant. Check if the message is appropriate for a school classroom (no profanity, bullying, explicit content, or hate speech). Respond strictly in JSON: {\"safe\": boolean, \"reason\": \"string (optional)\"}",
        },
        { role: "user", content },
      ],
    });

    const raw = response.choices[0]?.message?.content ?? "";
    try {
      const parsed = JSON.parse(raw.trim());
      return {
        safe: parsed.safe ?? true,
        reason: parsed.reason,
      };
    } catch {
      // If the response is not valid JSON, check for simple "unsafe" keywords
      const isUnsafe = /unsafe|inappropriate|profanity|offensive/i.test(raw);
      return { safe: !isUnsafe };
    }
  } catch (err) {
    console.error("Moderation failed, defaulting to safe:", err);
    return { safe: true };
  }
}

// ── Generate Spark Chat Response ─────────────────────────────────────────────
export async function generateSparkChatResponse(
  question: string,
  courseContext: string
): Promise<string> {
  try {
    const prompt = `
You are Spark ✨, a friendly and supportive AI learning assistant. A student is asking a question in the classroom chat.

Here is the context of the course they are learning:
${courseContext}

Student's question:
"${question}"

Please answer their question in an encouraging, helpful, and clear manner. Keep your response friendly and concise (maximum 2-3 sentences) suitable for a chat bubble.
`;

    const response = await client.chat.completions.create({
      model: "meta-llama/llama-3.2-3b-instruct:free",
      messages: [{ role: "user", content: prompt }],
    });

    return response.choices[0]?.message?.content?.trim() ?? "I'm here to help! Could you rephrase that?";
  } catch (err) {
    console.error("Spark response failed:", err);
    return "I'm having a little trouble connecting right now, but keep up the great work learning! 🧠";
  }
}

// ── Generate Brain Profile Quiz ─────────────────────────────────────────────
export async function generateBrainProfileQuiz(): Promise<{
  questions: Array<{
    question: string;
    options: Array<{ text: string; type: "story" | "calm" | "game" }>;
  }>;
}> {
  return {
    questions: [
      {
        question: "When you learn a new game, what is your first step?",
        options: [
          { text: "Read the manual or backstory to understand the world.", type: "story" },
          { text: "Watch a video walkthrough or observe others play quietly.", type: "calm" },
          { text: "Jump straight in and start pressing buttons to figure it out.", type: "game" },
        ],
      },
      {
        question: "What kind of homework assignment do you find most fun?",
        options: [
          { text: "Writing a creative story or journal entry about the topic.", type: "story" },
          { text: "Completing a structured sheet of math problems or simple definitions.", type: "calm" },
          { text: "Taking part in a speed quiz or an interactive group competition.", type: "game" },
        ],
      },
      {
        question: "Imagine you're learning about the water cycle. What helps you remember it best?",
        options: [
          { text: "An adventure story about a drop of water named Dewy traveling the earth.", type: "story" },
          { text: "A clean, color-coded diagram showing evaporation and precipitation.", type: "calm" },
          { text: "A puzzle game where you drag droplets to the right places to earn points.", type: "game" },
        ],
      },
      {
        question: "How do you feel about studying with score trackers, levels, and badges?",
        options: [
          { text: "They are okay, but I prefer learning through rich examples.", type: "story" },
          { text: "They distract me; I prefer a quiet interface with no alerts.", type: "calm" },
          { text: "I love them! They make studying feel like a challenge I want to win.", type: "game" },
        ],
      },
      {
        question: "If you get stuck on a difficult question, what do you want to see?",
        options: [
          { text: "A paragraph showing how this applies to a real-life situation.", type: "story" },
          { text: "A clear, numbered checklist of steps to solve it.", type: "calm" },
          { text: "An interactive hint card and a direct option to try again.", type: "game" },
        ],
      },
    ],
  };
}