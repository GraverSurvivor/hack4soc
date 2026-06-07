"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Lightbulb, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { normalizeCorrectAnswer } from "@/lib/content";
import { toast } from "sonner";

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct: string;
  explanation: string;
}

export function QuizPanel({
  questions,
  onSubmit,
}: {
  questions: QuizQuestion[];
  onSubmit: (score: number, answers: Record<string, string>) => void;
}) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const q = questions[current];
  const options = Array.isArray(q?.options) ? q.options : [];
  const correctLetter = normalizeCorrectAnswer(q?.correct ?? "A", options.length);

  if (!q) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center text-navy-300">
        No quiz questions are available for this unit yet.
      </div>
    );
  }

  const scoreQuiz = (nextAnswers: Record<string, string>) => {
    const correct = questions.filter(
      (question) =>
        nextAnswers[question.id] ===
        normalizeCorrectAnswer(question.correct, Array.isArray(question.options) ? question.options.length : 4)
    ).length;
    return Math.round((correct / questions.length) * 100);
  };

  const handleSelect = (letter: string) => {
    const nextAnswers = { ...answers, [q.id]: letter };
    setSelected(letter);
    setAnswers(nextAnswers);
    setShowExplanation(true);
  };

  const next = () => {
    if (current < questions.length - 1) {
      const nextIndex = current + 1;
      setCurrent(nextIndex);
      setSelected(answers[questions[nextIndex].id] || null);
      setShowExplanation(Boolean(answers[questions[nextIndex].id]));
      return;
    }

    const score = scoreQuiz(answers);
    onSubmit(score, answers);
    toast.success(`Quiz complete. Score: ${score}%`);
  };

  const isCorrect = selected === correctLetter;
  const progress = ((current + 1) / questions.length) * 100;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex justify-between text-sm text-navy-300 mb-2">
          <span>
            Question {current + 1} of {questions.length}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} />
      </div>

      <motion.div
        key={current}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-4"
      >
        <h3 className="text-xl font-semibold text-white">{q.question}</h3>

        <div className="grid gap-3">
          {options.map((option, i) => {
            const letter = String.fromCharCode(65 + i);
            const isSelected = selected === letter;
            return (
              <button
                key={option}
                onClick={() => !showExplanation && handleSelect(letter)}
                disabled={showExplanation}
                className={`p-4 rounded-lg border text-left transition-all ${
                  showExplanation && letter === correctLetter
                    ? "border-green-500 bg-green-500/10 text-green-200"
                    : showExplanation && isSelected && !isCorrect
                    ? "border-red-500 bg-red-500/10 text-red-200"
                    : isSelected
                    ? "border-violet bg-violet/10 text-white"
                    : "border-navy-600 hover:border-violet/50 text-navy-200"
                }`}
              >
                <span className="font-medium mr-2">{letter}.</span>
                {option}
              </button>
            );
          })}
        </div>

        {showExplanation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`p-4 rounded-lg border ${
              isCorrect
                ? "bg-green-500/10 border-green-500/30"
                : "bg-amber-500/10 border-amber-500/30"
            }`}
          >
            <div className="flex gap-3">
              {isCorrect ? (
                <CheckCircle2 className="w-5 h-5 text-green-300 shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-amber-300 shrink-0" />
              )}
              <div>
                <p className="text-sm font-medium text-white">
                  {isCorrect ? "Correct" : "Review this idea"}
                </p>
                <p className="text-sm text-navy-200 mt-1">{q.explanation}</p>
                {!isCorrect && (
                  <p className="flex items-center gap-2 text-xs text-amber-200 mt-3">
                    <Lightbulb className="w-4 h-4" />
                    Try the calm mode again if this felt rushed.
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {showExplanation && (
          <Button onClick={next} className="w-full">
            {current < questions.length - 1 ? "Next Question" : "Finish Unit"}
          </Button>
        )}
      </motion.div>
    </div>
  );
}
