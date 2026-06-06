// Shared course-generation types and validation schemas for AI parsing and unit output.
import { z } from "zod";

export const LearningModeSchema = z.enum(["story", "calm", "game"]);

export type LearningMode = z.infer<typeof LearningModeSchema>;

export interface StructuredContent {
  title: string;
  subjectArea: string;
  sections: Array<{
    heading: string;
    content: string;
    level: number;
  }>;
  keyTerms: string[];
  figures: string[];
  tables: Array<Array<string>>;
  rawText: string;
}

export const StructuredContentSchema = z.object({
  title: z.string().min(1),
  subjectArea: z.string().min(1),
  sections: z
    .array(
      z.object({
        heading: z.string().min(1),
        content: z.string(),
        level: z.number().int().min(1).max(6),
      })
    )
    .min(1),
  keyTerms: z.array(z.string()).default([]),
  figures: z.array(z.string()).default([]),
  tables: z.array(z.array(z.string())).default([]),
  rawText: z.string(),
});

export const QuizQuestionSchema = z.object({
  question: z.string().min(1),
  options: z.array(z.string()).default([]),
  correctIndex: z.union([z.number(), z.string()]),
  explanation: z.string().min(1),
});

export const UnitSchema = z.object({
  unitTitle: z.string().min(1),
  conceptSummary: z.string().min(1),
  keyPoints: z.array(z.string().min(1)).min(3).max(5),
  vocabulary: z
    .array(
      z.object({
        term: z.string().min(1),
        definition: z.string().min(1),
        exampleSentence: z.string().min(1),
      })
    )
    .max(10),
  quizQuestions: z.array(QuizQuestionSchema).min(10).max(15),
  narrative: z.string().optional(),
  cards: z
    .array(
      z.object({
        heading: z.string().min(1),
        body: z.string().min(1),
      })
    )
    .max(6)
    .optional(),
  questTitle: z.string().optional(),
  questObjective: z.string().optional(),
  xpReward: z.number().int().positive().optional(),
});

export type Unit = z.infer<typeof UnitSchema>;

export interface ModeGenerationResult {
  units: Unit[];
  error?: string;
}

export type CourseGenerationResult = Record<LearningMode, ModeGenerationResult>;
