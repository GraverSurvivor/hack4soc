"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Pin, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  content: string;
  isPinned: boolean;
  isAnnouncement: boolean;
  isAI: boolean;
  createdAt: string;
}

function upsertMessage(prev: ChatMessage[], msg: ChatMessage): ChatMessage[] {
  const idx = prev.findIndex((m) => m.id === msg.id);
  if (idx >= 0) {
    const updated = [...prev];
    updated[idx] = msg;
    return updated;
  }
  return [...prev, msg].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

export function CommunityChat({
  classroomId,
  isTeacher = false,
}: {
  classroomId: string;
  isTeacher?: boolean;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sparkThinking, setSparkThinking] = useState(false);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const shouldAutoScroll = useRef(true);

  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  }, []);

  useEffect(() => {
    fetch(`/api/chat/${classroomId}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setMessages(
            data.sort(
              (a: ChatMessage, b: ChatMessage) =>
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            )
          );
        }
      })
      .catch(() => {});

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
    const socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("join-classroom", classroomId);
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("message", (msg: ChatMessage) => {
      setMessages((prev) => upsertMessage(prev, msg));
    });

    return () => {
      socket.emit("leave-classroom", classroomId);
      socket.disconnect();
    };
  }, [classroomId]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      shouldAutoScroll.current = scrollHeight - scrollTop - clientHeight < 80;
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (shouldAutoScroll.current) {
      scrollToBottom();
    }
  }, [messages, sparkThinking, scrollToBottom]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setLoading(true);
    const isSpark = /@spark/i.test(text);
    if (isSpark) setSparkThinking(true);

    try {
      const res = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text, classroomId }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to send message");
        return;
      }

      setMessages((prev) => {
        let updated = upsertMessage(prev, data.message);
        if (data.sparkReply) updated = upsertMessage(updated, data.sparkReply);
        return updated;
      });

      socketRef.current?.emit("new-message", {
        classroomId,
        message: data.message,
      });
      if (data.sparkReply) {
        socketRef.current?.emit("new-message", {
          classroomId,
          message: data.sparkReply,
        });
      }

      setInput("");
    } catch {
      toast.error("Failed to send message");
    } finally {
      setLoading(false);
      setSparkThinking(false);
    }
  };

  const pinMessage = async (messageId: string) => {
    const res = await fetch(`/api/chat/${classroomId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId, action: "pin" }),
    });

    if (res.ok) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, isPinned: true } : m
        )
      );
      toast.success("Message pinned");
    }
  };

  const pinned = messages.filter((m) => m.isPinned);
  const regularMessages = messages.filter((m) => !m.isPinned);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] rounded-2xl border border-navy-700 bg-navy-800/50 overflow-hidden">
      <div className="p-4 border-b border-navy-700 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-white">Class Community</h2>
          <p className="text-xs text-navy-400">Tip: @Spark to ask the AI tutor</p>
        </div>
        <span
          className={`text-xs px-2 py-1 rounded-full ${
            connected ? "bg-green-500/20 text-green-300" : "bg-navy-700 text-navy-400"
          }`}
        >
          {connected ? "Live" : "Connecting..."}
        </span>
      </div>

      {pinned.length > 0 && (
        <div className="p-3 bg-amber-500/10 border-b border-amber-500/20 space-y-2">
          {pinned.map((m) => (
            <div key={m.id} className="flex items-start gap-2 text-sm">
              <Pin className="w-3 h-3 text-amber-400 mt-0.5 shrink-0" />
              <span className="text-amber-200">{m.content}</span>
            </div>
          ))}
        </div>
      )}

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth">
        {regularMessages.length === 0 && !sparkThinking && (
          <p className="text-center text-navy-500 text-sm py-12">
            No messages yet. Say hello to your class!
          </p>
        )}

        {regularMessages.map((msg) => (
          <div
            key={msg.id}
            className={`group transition-opacity duration-200 ${
              msg.isAI
                ? "bg-violet/10 rounded-xl p-3 border border-violet/20"
                : "hover:bg-navy-700/30 rounded-xl p-2"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              {msg.isAI && <Sparkles className="w-3 h-3 text-violet-light shrink-0" />}
              <span className={`text-sm font-medium ${msg.isAI ? "text-violet-light" : "text-white"}`}>
                {msg.userName}
              </span>
              <span className="text-xs text-navy-500">
                {new Date(msg.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              {isTeacher && !msg.isAI && (
                <button
                  onClick={() => pinMessage(msg.id)}
                  className="opacity-0 group-hover:opacity-100 text-navy-500 hover:text-amber-400 transition-opacity ml-auto"
                >
                  <Pin className="w-3 h-3" />
                </button>
              )}
            </div>
            <p className="text-sm text-navy-200 whitespace-pre-wrap break-words">{msg.content}</p>
          </div>
        ))}

        {sparkThinking && (
          <div className="bg-violet/10 rounded-xl p-3 border border-violet/20 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-light animate-pulse" />
            <span className="text-sm text-violet-light">Spark is thinking...</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t border-navy-700 flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder="Say something... (@Spark for AI help)"
          disabled={loading}
          className="transition-opacity"
        />
        <Button size="icon" onClick={sendMessage} disabled={loading || !input.trim()}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}
