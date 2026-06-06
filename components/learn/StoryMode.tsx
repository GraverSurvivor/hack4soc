"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { splitIntoPages } from "@/lib/utils";
import { ChevronRight, BookOpen } from "lucide-react";
import { toast } from "sonner";

interface StoryModeProps {
  content: string;
  title: string;
  onComplete: () => void;
  textToSpeech?: boolean;
  largeFont?: boolean;
}

export function StoryMode({
  content,
  title,
  onComplete,
  textToSpeech = false,
  largeFont = false,
}: StoryModeProps) {
  const pages = splitIntoPages(content);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<Record<number, string>>({});

  const speak = (text: string) => {
    if (textToSpeech && "speechSynthesis" in window) {
      const cleanText = text.replace(/\[Interactive Choice:[^\]]+\]/gi, "").trim();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 0.9;
      speechSynthesis.speak(utterance);
    }
  };

  const nextPage = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage((p) => p + 1);
    } else {
      onComplete();
    }
  };

  const progress = ((currentPage + 1) / pages.length) * 100;
  const currentPageText = pages[currentPage] || "";
  const hasChoiceOnPage = /\[Interactive Choice:\s*([^\]]+)\]/i.test(currentPageText);
  const choiceMade = selectedChoice[currentPage] !== undefined;
  const isContinueDisabled = hasChoiceOnPage && !choiceMade;

  const renderParagraph = (para: string, idx: number) => {
    const choiceMatch = para.match(/\[Interactive Choice:\s*([^\]]+)\]/i);
    if (choiceMatch) {
      const cleanText = para.replace(/\[Interactive Choice:\s*([^\]]+)\]/gi, "").trim();
      const optionsStr = choiceMatch[1];
      const choices = optionsStr.split("|").map((o) => o.trim());
      const currentChoice = selectedChoice[currentPage];

      return (
        <div key={idx} className="space-y-4">
          {cleanText && (
            <p className="mb-4 max-w-prose text-story-text/90 leading-relaxed font-story" style={{ maxHeight: "none" }}>
              {cleanText}
            </p>
          )}
          <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center space-y-4 shadow-inner">
            <p className="text-sm font-semibold text-amber-300 flex items-center justify-center gap-1.5">
              ✨ Help Spark choose:
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {choices.map((choice) => {
                const isChosen = currentChoice === choice;
                return (
                  <button
                    key={choice}
                    disabled={currentChoice !== undefined}
                    onClick={() => {
                      setSelectedChoice((prev) => ({ ...prev, [currentPage]: choice }));
                      toast.success(`Spark proceeds: "${choice}"!`);
                    }}
                    className={`px-4 py-2 text-sm font-bold rounded-xl transition-all duration-300 shadow-md border ${
                      isChosen
                        ? "bg-amber-500 text-navy-950 border-amber-400 scale-105"
                        : currentChoice !== undefined
                        ? "bg-navy-900/60 text-navy-500 border-navy-800 cursor-not-allowed"
                        : "bg-navy-900/40 text-amber-200 border-amber-500/30 hover:bg-amber-500/20 active:scale-95"
                    }`}
                  >
                    {choice}
                  </button>
                );
              })}
            </div>
            {currentChoice && (
              <p className="text-xs text-amber-200/70 italic animate-pulse">
                Nice choice! You selected "{currentChoice}". Click Continue below to proceed.
              </p>
            )}
          </div>
        </div>
      );
    }

    return (
      <p key={idx} className="mb-4 max-w-prose text-story-text/90 leading-relaxed font-story" style={{ maxHeight: "none" }}>
        {para}
      </p>
    );
  };

  return (
    <div
      className="min-h-screen bg-story-bg"
      style={{
        backgroundImage:
          "radial-gradient(circle at 20% 80%, rgba(245,158,11,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(251,191,36,0.08) 0%, transparent 50%)",
      }}
    >
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6 text-story-text">
          <BookOpen className="w-5 h-5 text-story-accent" />
          <span className="font-story text-sm font-medium">Story Mode</span>
        </div>

        <h1 className="font-story text-3xl font-bold text-story-text mb-2">{title}</h1>

        <div className="flex items-center justify-between mb-4">
          <span className="font-story text-sm text-story-text/70">
            Page {currentPage + 1} of {pages.length}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => speak(pages[currentPage])}
            className="text-story-text/60 hover:text-story-text"
          >
            🔊 Listen
          </Button>
        </div>

        <Progress value={progress} className="mb-8 h-1.5 bg-story-paper" />

        <div className="bg-story-paper/60 rounded-2xl p-8 shadow-lg border border-amber-200/50 min-h-[400px] relative overflow-hidden">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-amber-200/40">
            <div className="w-10 h-10 rounded-full bg-amber-400 flex items-center justify-center text-lg">
              ✨
            </div>
            <div>
              <p className="font-story text-xs text-story-text/60">Your guide, Spark, says...</p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, x: 40, rotateY: -5 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              exit={{ opacity: 0, x: -40, rotateY: 5 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className={`font-story text-story-text leading-relaxed whitespace-pre-wrap ${
                largeFont ? "text-xl" : "text-lg"
              }`}
            >
              {pages[currentPage].split("\n\n").map((para, i) => renderParagraph(para, i))}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-8 flex justify-end">
          <Button
            onClick={nextPage}
            disabled={isContinueDisabled}
            variant="amber"
            size="lg"
            className="font-story gap-2"
          >
            {currentPage < pages.length - 1 ? (
              <>
                {isContinueDisabled ? "Make choice to proceed" : "Continue"} <ChevronRight className="w-4 h-4" />
              </>
            ) : (
              "Finish Story → Take Quiz"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
