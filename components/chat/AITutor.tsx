"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ReactMarkdown from "react-markdown";
import { MessageCircle, X, Send } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function AITutor({ unitId }: { unitId: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  const sendMessage = async () => {
    if (!input.trim() || thinking) return;

    const question = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setThinking(true);

    try {
      const res = await fetch("/api/ai/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          unitId,
          history: messages,
        }),
      });

      if (!res.ok) throw new Error("Failed");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantText += decoder.decode(value);
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: assistantText };
          return updated;
        });
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I'm having trouble right now. Try again in a moment!",
        },
      ]);
    } finally {
      setThinking(false);
    }
  };

  return (
    <>
      <motion.button
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-violet shadow-glow flex items-center justify-center text-white"
      >
        <MessageCircle className="w-6 h-6" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-50 w-96 max-h-[500px] rounded-2xl border border-navy-600 bg-navy-800 shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-navy-700">
              <div className="flex items-center gap-2">
                <span className="text-xl">✨</span>
                <div>
                  <p className="font-semibold text-white text-sm">Spark AI Tutor</p>
                  <p className="text-xs text-navy-400">Ask about this lesson</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-navy-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px]">
              {messages.length === 0 && (
                <p className="text-navy-400 text-sm text-center py-8">
                  Hi! I&apos;m Spark ✨ Ask me anything about this lesson!
                </p>
              )}
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                      msg.role === "user"
                        ? "bg-violet text-white"
                        : "bg-navy-700 text-navy-100"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <ReactMarkdown className="prose prose-invert prose-sm max-w-none">
                        {msg.content}
                      </ReactMarkdown>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))}
              {thinking && (
                <div className="flex items-center gap-2 text-navy-400 text-sm">
                  <span className="animate-pulse-soft">✨</span>
                  Spark is thinking...
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="p-3 border-t border-navy-700 flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Ask a question..."
                className="flex-1"
              />
              <Button size="icon" onClick={sendMessage} disabled={thinking}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
