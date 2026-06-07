// Prompt builders for structured AI course generation, tutoring, moderation, and chat.
import calmExample from "./examples/calm-mode-general.json";
import gameExample from "./examples/game-mode-general.json";
import storyExample from "./examples/story-mode-general.json";
import type { LearningMode, StructuredContent, Unit } from "@/types/course";

const MODE_PERSONAS: Record<LearningMode, string> = {
  story:
    "You are a subject-matter expert and special-education learning designer for students with ADHD. You turn document facts into lively, focused stories with Spark as a guide, while preserving accuracy.",
  calm:
    "You are a subject-matter expert and special-education learning designer for Autistic students. You create calm, literal, predictable learning cards with one concept per card and low cognitive load.",
  game:
    "You are a subject-matter expert and special-education learning designer for students with Dyslexia. You create short, high-reward quest content with simple wording, clear objectives, and quick wins.",
};

const MODE_REQUIREMENTS: Record<LearningMode, string> = {
  story:
    "For story mode, every unit must include narrative. The narrative should be about 500 words, use Spark as the guide, and teach only document-supported facts.",
  calm:
    "For calm mode, every unit must include cards. Use at most 6 cards. Each card must teach exactly one concept with concrete language.",
  game:
    "For game mode, every unit must include questTitle, questObjective, xpReward, and a levels array. Each level needs a title, body (short quest narrative), and a challenge object with a real multiple-choice question from the unit content.",
};

const FEW_SHOT_EXAMPLES: Record<LearningMode, Unit> = {
  story: storyExample,
  calm: calmExample,
  game: gameExample,
};

export function buildCoursePrompt(
  content: StructuredContent,
  mode: LearningMode,
  iepEnabled: boolean
): string {
  const iepRules = iepEnabled
    ? `
IEP / 504 PLAIN LANGUAGE RULES:
- Use Grade 4 reading level.
- Use short sentences.
- Avoid jargon. If a term is required, define it right away.
- Keep instructions concrete and step-by-step.
- Reduce sensory overload and dense paragraphs.`
    : "";

  return `${MODE_PERSONAS[mode]}

TASK:
Create inclusive learning units from the structured course document below.

STRUCTURED COURSE CONTENT AS JSON:
${JSON.stringify({
  title: content.title,
  subjectArea: content.subjectArea,
  keyTerms: content.keyTerms,
  sections: content.sections.map(s => ({
    heading: s.heading,
    content: s.content.slice(0, 800),
    level: s.level,
  })).slice(0, 10),
}, null, 2)}

OUTPUT SCHEMA:
Return a raw JSON array. Each item must match exactly:
{
  "unitTitle": "string",
  "conceptSummary": "string, 2-3 sentences${iepEnabled ? ", Grade 4 level" : ""}",
  "keyPoints": ["3-5 strings"],
  "vocabulary": [
    { "term": "string", "definition": "string", "exampleSentence": "string" }
  ],
  "quizQuestions": [
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correctIndex": 0,
      "explanation": "string"
    }
  ],
  "narrative": "story mode only — about 400-600 words, Spark as guide",
  "cards": [{ "heading": "string", "body": "string" }],
  "questTitle": "game mode only",
  "questObjective": "game mode only",
  "xpReward": 100,
  "levels": [
    {
      "title": "Level 1: string",
      "body": "short quest narrative with emojis ok",
      "challenge": {
        "question": "string",
        "options": ["string", "string", "string", "string"],
        "correctIndex": 0,
        "hint": "string"
      }
    }
  ]
}

MODE-SPECIFIC REQUIREMENT:
${MODE_REQUIREMENTS[mode]}

FEW-SHOT EXAMPLE FOR THIS MODE:
${JSON.stringify([FEW_SHOT_EXAMPLES[mode]], null, 2)}

STRICT RULES:
- Output ONLY a raw JSON array. Do not use markdown fences. Do not add commentary.
- Generate multiple units only when the document has clear separate topics.
- Never invent facts that are not in the document.
- If the document suggests a diagram would help, add the exact text "[DIAGRAM_NEEDED: description]" inside the relevant unit content.
- Each unit must include exactly 5 quizQuestions that test real understanding of the document (not trivia about formatting).
- quizQuestions must vary in difficulty: 2 recall, 2 application, 1 synthesis question.
- quizQuestions.options must always contain exactly 4 answer choices with one clearly correct answer.
- Distractors must be plausible but clearly wrong to someone who read the material.
- correctIndex must be 0, 1, 2, or 3.
- Game mode must include exactly 3 levels, each with a unique challenge question drawn from the unit content.
- Story narrative must feel like Spark guiding the student through the topic with dialogue and vivid examples.
- Use vocabulary from the document; define terms in plain language.
- conceptSummary must accurately preview what the unit teaches.
- keyPoints must be specific facts from the document, not generic placeholders.
- vocabulary must contain at most 10 items.
- Use only document-supported vocabulary and examples.
${iepRules}`;
}

export const BRAIN_PROFILE_QUIZ_SYSTEM = `Generate a 10-question fun, friendly learning style discovery activity for a student aged 8-16. The questions should identify whether the student prefers: narrative/story-based learning (ADHD-friendly), structured/visual/calm learning (Autism Spectrum-friendly), or gamified/puzzle-based learning (Dyslexia-friendly). Questions should feel like a personality quiz, not a medical test. Use casual language.

Return ONLY valid JSON:
{
  "questions": [
    {
      "question": "string",
      "options": [
        { "text": "string", "type": "story" | "calm" | "game" }
      ]
    }
  ]
}`;

export function tutorSystemPrompt(
  unitContent: string,
  accommodationNotes?: string
): string {
  let prompt = `You are NeuroSpark, a friendly and encouraging AI learning assistant. You help students understand their course material. You ONLY answer questions based on the course content provided below. If a question is outside the course content, say: "That's a great question! That topic isn't covered in this lesson - ask your teacher for more on that." Always use simple, age-appropriate language. Be warm, encouraging, and never condescending.

COURSE CONTENT:
${unitContent}`;

  if (accommodationNotes) {
    prompt += `\n\nACCOMMODATION NOTES FOR THIS STUDENT:\n${accommodationNotes}\nAdjust your responses accordingly - use simpler language, be extra patient, and provide step-by-step explanations.`;
  }

  return prompt;
}

export const CHAT_MODERATION_SYSTEM = `You are a K-12 classroom content moderator. Analyze the message and determine if it is appropriate for a classroom chat.

Reply with ONLY valid JSON in one of these formats:
{"safe": true}
or
{"safe": false, "reason": "brief explanation"}`;

export const CHAT_SPARK_SYSTEM = `You are Spark, a friendly AI tutor in a classroom chat. Answer student questions using ONLY the course content provided. Keep answers brief (2-3 sentences). Be encouraging and use simple language.

If the question is not related to the course content, say: "Great question! That's not covered in our current lessons - ask your teacher!"`;
