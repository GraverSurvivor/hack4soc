"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BrainStyleCard } from "@/components/shared/BrainStyleCard";
import { toast } from "sonner";

interface QuizQuestion {
  question: string;
  options: { text: string; type: "story" | "calm" | "game" }[];
}

export default function BrainProfileQuiz() {
  const router = useRouter();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<
    { questionIndex: number; optionIndex: number; type: "story" | "calm" | "game" }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<{
    dominant: string;
    scores: { story: number; calm: number; game: number };
  } | null>(null);

  useEffect(() => {
    fetch("/api/quiz/brain-profile")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setQuestions(data);
      })
      .catch(() => toast.error("Failed to load quiz"))
      .finally(() => setLoading(false));
  }, []);

  const selectOption = (optionIndex: number) => {
    const q = questions[current];
    const answer = {
      questionIndex: current,
      optionIndex,
      type: q.options[optionIndex].type,
    };
    const newAnswers = [...answers.filter((a) => a.questionIndex !== current), answer];
    setAnswers(newAnswers);

    if (current < questions.length - 1) {
      setTimeout(() => setCurrent((c) => c + 1), 400);
    } else {
      submitQuiz(newAnswers);
    }
  };

  const submitQuiz = async (
    finalAnswers: typeof answers
  ) => {
    const res = await fetch("/api/quiz/brain-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers: finalAnswers }),
    });
    const data = await res.json();
    if (res.ok) {
      setResult({ dominant: data.dominant, scores: data.scores as { story: number; calm: number; game: number } });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-navy-400 animate-pulse-soft">Loading your quiz... 🧠</p>
      </div>
    );
  }

  if (result) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg space-y-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <h1 className="text-2xl font-bold text-white text-center mb-6">
              Your Brain Style Results! 🎉
            </h1>
            <BrainStyleCard dominant={result.dominant} scores={result.scores} />
          </motion.div>
          <Button onClick={() => router.push("/student/home")} className="w-full">
            Start Learning!
          </Button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center text-navy-400">
        Quiz unavailable. Please try again later.
      </div>
    );
  }

  const q = questions[current];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-navy-900">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <span className="text-4xl">🧠</span>
          <h1 className="text-2xl font-bold text-white mt-2">
            Let&apos;s find out how YOUR brain learns best!
          </h1>
          <p className="text-navy-400 text-sm mt-2">
            This is a fun activity, not a test. Just pick what feels right!
          </p>
        </div>

        <Progress
          value={((current + 1) / questions.length) * 100}
          className="mb-6"
        />
        <p className="text-center text-sm text-navy-400 mb-6">
          Question {current + 1} of {questions.length}
        </p>

        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="bg-navy-800 rounded-2xl border border-navy-700 p-6"
          >
            <h2 className="text-lg font-semibold text-white mb-6">{q.question}</h2>
            <div className="space-y-3">
              {q.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => selectOption(i)}
                  className="w-full p-4 rounded-xl border border-navy-600 text-left text-navy-200 hover:border-violet hover:bg-violet/10 transition-all hover:scale-[1.01]"
                >
                  {opt.text}
                </button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
