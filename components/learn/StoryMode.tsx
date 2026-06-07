"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { splitIntoPages } from "@/lib/utils";
import { parseStoryContent } from "@/lib/content";
import { ChevronRight, BookOpen, Volume2, Sparkles } from "lucide-react";

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
  const narrative = useMemo(() => parseStoryContent(content), [content]);
  const pages = useMemo(() => splitIntoPages(narrative, 3), [narrative]);
  const [currentPage, setCurrentPage] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = (text: string) => {
    if (!textToSpeech || !("speechSynthesis" in window)) return;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.88;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    speechSynthesis.speak(utterance);
  };

  const nextPage = () => {
    speechSynthesis.cancel();
    setIsSpeaking(false);
    if (currentPage < pages.length - 1) {
      setCurrentPage((p) => p + 1);
    } else {
      onComplete();
    }
  };

  const progress = ((currentPage + 1) / pages.length) * 100;
  const pageText = pages[currentPage] ?? "";

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
          <span className="ml-auto text-xs text-story-text/50 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Guided by Spark
          </span>
        </div>

        <h1 className="font-story text-3xl font-bold text-story-text mb-2">{title}</h1>

        <div className="flex items-center justify-between mb-4">
          <span className="font-story text-sm text-story-text/70">
            Chapter {currentPage + 1} of {pages.length}
          </span>
          {textToSpeech && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => speak(pageText)}
              className={`text-story-text/60 hover:text-story-text ${isSpeaking ? "text-story-accent" : ""}`}
            >
              <Volume2 className="w-4 h-4 mr-1" />
              {isSpeaking ? "Reading..." : "Listen"}
            </Button>
          )}
        </div>

        <Progress value={progress} className="mb-8 h-1.5 bg-story-paper" />

        <div className="bg-story-paper/60 rounded-2xl p-8 shadow-lg border border-amber-200/50 min-h-[400px] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/20 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-amber-200/40">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="w-10 h-10 rounded-full bg-amber-400 flex items-center justify-center text-lg shadow-md"
            >
              ✨
            </motion.div>
            <div>
              <p className="font-story text-xs text-story-text/60">Your guide, Spark, says...</p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className={`font-story text-story-text leading-relaxed ${
                largeFont ? "text-xl" : "text-lg"
              }`}
            >
              {pageText.split("\n\n").map((para, i) => (
                <p key={i} className="mb-4 max-w-prose whitespace-pre-wrap">
                  {para.split(/(".*?")/).map((part, j) =>
                    part.startsWith('"') && part.endsWith('"') ? (
                      <span key={j} className="text-amber-700 font-medium italic">
                        {part}
                      </span>
                    ) : (
                      <span key={j}>{part}</span>
                    )
                  )}
                </p>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-8 flex justify-between items-center">
          <p className="text-xs text-story-text/50">
            {currentPage === pages.length - 1 ? "Final chapter — quiz up next!" : "Keep going, you're doing great!"}
          </p>
          <Button onClick={nextPage} variant="amber" size="lg" className="font-story gap-2">
            {currentPage < pages.length - 1 ? (
              <>
                Continue <ChevronRight className="w-4 h-4" />
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
