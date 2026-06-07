"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { parseGameMode, type GameLevel } from "@/lib/content";
import { Zap, Star, Trophy, Shield, Target } from "lucide-react";

interface GameModeProps {
  content: string;
  title: string;
  onComplete: () => void;
  largeFont?: boolean;
}

export function GameMode({ content, title, onComplete, largeFont = false }: GameModeProps) {
  const gameData = useMemo(() => parseGameMode(content), [content]);
  const levels = gameData.levels;
  const [currentLevel, setCurrentLevel] = useState(0);
  const [xp, setXp] = useState(0);
  const [showChallenge, setShowChallenge] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const level: GameLevel = levels[currentLevel] ?? { title: "Complete", body: "" };
  const challenge = level.challenge;
  const xpPerLevel = gameData.xpReward ? Math.round(gameData.xpReward / levels.length) : 100;
  const totalXp = levels.length * xpPerLevel;
  const xpProgress = Math.min(100, (xp / totalXp) * 100);

  const advanceLevel = () => {
    setFeedback(null);
    setShowChallenge(false);
    setSelectedIndex(null);
    setShowHint(false);
    setAttempts(0);

    if (currentLevel < levels.length - 1) {
      setCurrentLevel((l) => l + 1);
    } else {
      onComplete();
    }
  };

  const handleAnswer = (optionIndex: number) => {
    if (feedback === "correct" || !challenge) return;

    setSelectedIndex(optionIndex);
    const isCorrect = optionIndex === challenge.correctIndex;

    if (isCorrect) {
      setFeedback("correct");
      setXp((x) => x + xpPerLevel);
      setTimeout(advanceLevel, 1400);
    } else {
      setFeedback("wrong");
      setAttempts((a) => a + 1);
    }
  };

  const handleLegacyContinue = () => {
    setXp((x) => x + xpPerLevel);
    advanceLevel();
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
            <span>{gameData.questTitle ?? "Quest Progress"}</span>
            <span>
              Level {currentLevel + 1}/{levels.length}
            </span>
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
                {challenge ? "⚔️ Accept Challenge" : "Continue →"}
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
              {challenge ? (
                <>
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Target className="w-5 h-5 text-game-neon" />
                    <p className="text-game-neon font-bold">Level Challenge</p>
                  </div>

                  <p className={`text-purple-100 mb-4 text-center ${largeFont ? "text-lg" : "text-base"}`}>
                    {challenge.question}
                  </p>

                  {showHint && challenge.hint && (
                    <p className="text-amber-300 text-sm text-center mb-4 bg-amber-900/20 rounded-lg p-3">
                      💡 {challenge.hint}
                    </p>
                  )}

                  {feedback === "correct" && (
                    <motion.div
                      animate={{ scale: [1, 1.15, 1] }}
                      className="text-center text-game-neon font-bold text-xl mb-4"
                    >
                      ✨ +{xpPerLevel} XP! Level cleared!
                    </motion.div>
                  )}

                  {feedback === "wrong" && (
                    <p className="text-center text-red-300 text-sm mb-4">
                      Not quite — try again! {attempts >= 2 && "Use the hint if you need help."}
                    </p>
                  )}

                  <div className="grid gap-2 mb-3">
                    {challenge.options.map((opt, i) => {
                      const letter = String.fromCharCode(65 + i);
                      const isSelected = selectedIndex === i;
                      const isCorrect = i === challenge.correctIndex;

                      return (
                        <Button
                          key={opt}
                          onClick={() => handleAnswer(i)}
                          disabled={feedback === "correct"}
                          variant={isSelected ? "default" : "outline"}
                          className={`border-purple-700 text-purple-100 hover:bg-purple-800/50 justify-start ${
                            feedback && isCorrect
                              ? "border-green-500 bg-green-500/20"
                              : feedback === "wrong" && isSelected
                              ? "border-red-500 bg-red-500/20"
                              : ""
                          }`}
                        >
                          <span className="font-bold mr-2">{letter}.</span> {opt}
                        </Button>
                      );
                    })}
                  </div>

                  {!showHint && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowHint(true)}
                      className="w-full text-amber-300 hover:text-amber-200"
                    >
                      💡 Need a hint?
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Shield className="w-5 h-5 text-game-neon" />
                    <p className="text-game-neon font-bold">Checkpoint</p>
                  </div>
                  <p className="text-center text-purple-200 mb-4">
                    Ready to move to the next level?
                  </p>
                  <Button
                    onClick={handleLegacyContinue}
                    className="w-full bg-gradient-to-r from-purple-600 to-violet-600"
                  >
                    Continue → +{xpPerLevel} XP
                  </Button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
