import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["TEACHER", "STUDENT"]),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const classroomSchema = z.object({
  name: z.string().min(2, "Classroom name must be at least 2 characters"),
});

export const joinClassroomSchema = z.object({
  inviteCode: z.string().min(4, "Invalid invite code"),
});

export const progressSchema = z.object({
  completed: z.boolean().optional(),
  quizScore: z.number().min(0).max(100).optional(),
  quizAnswers: z.record(z.string()).optional(),
  learningMode: z.enum(["story", "calm", "game"]).optional(),
  timeSpent: z.number().min(0).optional(),
});

export const iepSchema = z.object({
  notes: z.string(),
  difficulty: z.enum(["easy", "standard", "advanced"]).optional(),
  is504: z.boolean().optional(),
  extraSupport: z.boolean().optional(),
  classroomId: z.string(),
});

export const chatMessageSchema = z.object({
  content: z.string().min(1).max(1000),
  classroomId: z.string(),
});

export const brainProfileSchema = z.object({
  answers: z.array(
    z.object({
      questionIndex: z.number(),
      optionIndex: z.number(),
      type: z.enum(["story", "calm", "game"]),
    })
  ),
});
