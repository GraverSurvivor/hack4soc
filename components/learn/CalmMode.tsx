"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { splitIntoCards } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Focus, Volume2 } from "lucide-react";

interface CalmModeProps {
  content: string;
  title: string;
  onComplete: () => void;
  textToSpeech?: boolean;
  largeFont?: boolean;
  extendedTime?: boolean;
}

export function CalmMode({
  content,
  title,
  onComplete,
  textToSpeech = false,
  largeFont = false,
  extendedTime = false,
}: CalmModeProps) {
  const cards = splitIntoCards(content);
  const [currentCard, setCurrentCard] = useState(0);
  const [focusMode, setFocusMode] = useState(false);

  const speak = (text: string) => {
    if (textToSpeech && "speechSynthesis" in window) {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.85;
      speechSynthesis.speak(utterance);
    }
  };

  const progress = ((currentCard + 1) / cards.length) * 100;
  const card = cards[currentCard];

  return (
    <div className={`min-h-screen transition-colors duration-500 ${focusMode ? "bg-white" : "bg-calm-bg"}`}>
      {!focusMode && (
        <header className="sticky top-0 z-10 bg-calm-bg/95 backdrop-blur border-b border-sky-100 px-4 py-4">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="font-calm text-sm text-calm-text/60">Calm Visual Mode</span>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFocusMode(true)}
                  className="text-calm-text/60"
                >
                  <Focus className="w-4 h-4 mr-1" /> Focus
                </Button>
              </div>
            </div>
            <h1 className={`font-calm font-semibold text-calm-text ${largeFont ? "text-2xl" : "text-xl"}`}>
              {title}
            </h1>
            {extendedTime && (
              <p className="text-xs text-sky-600 mt-1">⏱ Extended time enabled</p>
            )}
            <div className="mt-3">
              <div className="flex justify-between text-xs text-calm-text/50 mb-1">
                <span>Concept {currentCard + 1} of {cards.length}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-1 bg-sky-100" />
            </div>
          </div>
        </header>
      )}

      <main className="max-w-2xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentCard}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className={`rounded-2xl border border-sky-100 shadow-sm p-8 ${
              focusMode ? "bg-white shadow-none border-0" : "bg-calm-card"
            }`}
          >
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">{card.icon}</span>
              <h2 className={`font-calm font-semibold text-calm-text ${largeFont ? "text-2xl" : "text-xl"}`}>
                {card.title}
              </h2>
            </div>

            <div
              className={`font-calm text-calm-text/80 leading-relaxed whitespace-pre-wrap ${
                largeFont ? "text-xl" : "text-lg"
              }`}
            >
              {card.body}
            </div>

            {textToSpeech && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => speak(`${card.title}. ${card.body}`)}
                className="mt-4 text-calm-text/50"
              >
                <Volume2 className="w-4 h-4 mr-1" /> Read aloud
              </Button>
            )}
          </motion.div>
        </AnimatePresence>

        <nav className="mt-8 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setCurrentCard((c) => Math.max(0, c - 1))}
            disabled={currentCard === 0}
            className="text-calm-text"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Previous
          </Button>

          {currentCard < cards.length - 1 ? (
            <Button
              onClick={() => setCurrentCard((c) => c + 1)}
              className="bg-sky-500 hover:bg-sky-600 text-white"
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={onComplete}
              className="bg-sky-500 hover:bg-sky-600 text-white"
            >
              Complete → Quiz
            </Button>
          )}
        </nav>

        {focusMode && (
          <button
            onClick={() => setFocusMode(false)}
            className="fixed top-4 right-4 text-xs text-gray-400 hover:text-gray-600"
          >
            Exit Focus
          </button>
        )}
      </main>
    </div>
  );
}
