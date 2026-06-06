"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { splitIntoLevels } from "@/lib/utils";
import { Zap, Star, Trophy } from "lucide-react";

interface GameModeProps {
  content: string;
  title: string;
  onComplete: () => void;
  largeFont?: boolean;
}

export function GameMode({ content, title, onComplete, largeFont = false }: GameModeProps) {
  const levels = splitIntoLevels(content);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [xp, setXp] = useState(0);
  const [showChallenge, setShowChallenge] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [hint, setHint] = useState(false);

  const level = levels[currentLevel];
  const totalXp = levels.length * 100;
  const xpProgress = (xp / totalXp) * 100;

  const challengeOptions = ["Got it!", "Need a hint", "Skip challenge"];

  const handleAnswer = (answer: string) => {
    setSelectedAnswer(answer);
    if (answer === "Got it!") {
      setFeedback("correct");
      setXp((x) => x + 100);
      setTimeout(() => {
        setFeedback(null);
        setShowChallenge(false);
        setSelectedAnswer(null);
        if (currentLevel < levels.length - 1) {
          setCurrentLevel((l) => l + 1);
        } else {
          onComplete();
        }
      }, 1500);
    } else if (answer === "Need a hint") {
      setHint(true);
    } else {
      if (currentLevel < levels.length - 1) {
        setCurrentLevel((l) => l + 1);
        setShowChallenge(false);
      } else {
        onComplete();
      }
    }
  };

  return (
    <div className="min-h-screen bg-game-bg text-game-text font-game">
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/opendyslexic@1.0.3/opendyslexic-regular.min.css"
      />

      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(168,85,247,0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(34,211,238,0.08) 0%, transparent 40%)",
        }}
      />

      <div className="relative max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-game-neon" />
            <span className="text-sm text-game-neon font-medium">Game Mode</span>
          </div>
          <div className="flex items-center gap-2 bg-game-bg/80 border border-purple-800/50 rounded-full px-4 py-1.5">
            <Star className="w-4 h-4 text-amber-400" />
            <span className="text-amber-400 font-bold">{xp} XP</span>
          </div>
        </div>

        <div className="mb-2">
          <div className="flex justify-between text-xs text-purple-300 mb-1">
            <span>Quest Progress</span>
            <span>Level {currentLevel + 1}/{levels.length}</span>
          </div>
          <Progress value={xpProgress} className="h-2 bg-purple-950" />
        </div>

        <h1 className={`font-bold text-game-text mb-6 ${largeFont ? "text-2xl" : "text-xl"}`}>
          🗺️ {title}
        </h1>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentLevel}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="rounded-2xl border border-purple-800/40 bg-purple-950/40 backdrop-blur p-6 shadow-neon"
          >
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-game-accent" />
              <h2 className={`font-bold text-game-accent ${largeFont ? "text-xl" : "text-lg"}`}>
                {level.title}
              </h2>
            </div>

            <div
              className={`leading-relaxed whitespace-pre-wrap text-purple-100 ${
                largeFont ? "text-lg" : "text-base"
              }`}
              style={{ fontFamily: "OpenDyslexic, sans-serif" }}
            >
              {level.body}
            </div>

            {!showChallenge && (
              <Button
                onClick={() => setShowChallenge(true)}
                className="mt-6 w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 shadow-glow"
              >
                ⚔️ Accept Challenge
              </Button>
            )}
          </motion.div>
        </AnimatePresence>

        <AnimatePresence>
          {showChallenge && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-4 rounded-2xl border border-game-neon/30 bg-purple-950/60 p-6"
            >
              <p className="text-game-neon font-bold mb-4 text-center">
                🎯 Level Challenge!
              </p>
              <p className="text-center text-purple-200 mb-4 text-sm">
                Ready to unlock the next level?
              </p>

              {hint && (
                <p className="text-amber-300 text-sm text-center mb-4 bg-amber-900/20 rounded-lg p-3">
                  💡 Hint: Review the key concept above — you&apos;ve got this!
                </p>
              )}

              {feedback === "correct" && (
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  className="text-center text-game-neon font-bold text-xl mb-4"
                >
                  ✨ +100 XP! Amazing work!
                </motion.div>
              )}

              <div className="grid gap-2">
                {challengeOptions.map((opt) => (
                  <Button
                    key={opt}
                    onClick={() => handleAnswer(opt)}
                    disabled={feedback === "correct"}
                    variant={selectedAnswer === opt ? "default" : "outline"}
                    className="border-purple-700 text-purple-100 hover:bg-purple-800/50"
                  >
                    {opt}
                  </Button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
