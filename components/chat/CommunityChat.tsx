"use client";

import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Pin } from "lucide-react";
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
  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Helper to assign a gradient background color based on name hash
  const getAvatarBg = (name: string) => {
    if (name.includes("Spark")) return "bg-gradient-to-tr from-violet to-fuchsia-500 text-white";
    const colors = [
      "bg-gradient-to-tr from-sky-500 to-blue-600 text-white",
      "bg-gradient-to-tr from-emerald-500 to-teal-600 text-white",
      "bg-gradient-to-tr from-amber-500 to-orange-600 text-white",
      "bg-gradient-to-tr from-rose-500 to-pink-600 text-white",
      "bg-gradient-to-tr from-indigo-500 to-purple-600 text-white",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  useEffect(() => {
    // 1. Fetch initial messages
    const fetchMessages = () => {
      fetch(`/api/chat/${classroomId}`)
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setMessages(data);
          }
        })
        .catch(() => {});
    };

    fetchMessages();

    // 2. Poll messages every 5 seconds in case Socket.io fails/disconnects
    const interval = setInterval(fetchMessages, 5000);

    // 3. Set up Socket.io connection
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
    let socket: Socket | null = null;
    try {
      socket = io(socketUrl, { 
        transports: ["websocket", "polling"],
        timeout: 4000 
      });
      socketRef.current = socket;
      socket.emit("join-classroom", classroomId);
      
      socket.on("message", (msg: ChatMessage) => {
        setMessages((prev) => {
          // Avoid duplicate messages between socket and poll
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      });
    } catch (err) {
      console.warn("Socket.io connection failed, relying on HTTP polling:", err);
    }

    return () => {
      clearInterval(interval);
      if (socket) {
        socket.emit("leave-classroom", classroomId);
        socket.disconnect();
      }
    };
  }, [classroomId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);

    try {
      const res = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: input.trim(), classroomId }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to send message");
        return;
      }

      setMessages((prev) => {
        const updated = [...prev];
        if (!updated.some((m) => m.id === data.message.id)) {
          updated.push(data.message);
        }
        if (data.sparkReply && !updated.some((m) => m.id === data.sparkReply.id)) {
          updated.push(data.sparkReply);
        }
        return updated;
      });

      socketRef.current?.emit("new-message", {
        classroomId,
        message: data.message,
      });

      setInput("");
    } catch {
      toast.error("Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  const pinMessage = async (messageId: string) => {
    await fetch(`/api/chat/${classroomId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId, action: "pin" }),
    });
    toast.success("Message pinned");
  };

  const pinned = messages.filter((m) => m.isPinned);

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] rounded-3xl border border-navy-700 bg-navy-800/40 backdrop-blur-md overflow-hidden shadow-card">
      <div className="p-4 border-b border-navy-700 bg-navy-900/30 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-white">Class Community</h2>
          <p className="text-xs text-navy-400">Collaborate with peers. Type @Spark to consult AI.</p>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live
        </span>
      </div>

      {pinned.length > 0 && (
        <div className="p-3 bg-amber-500/5 border-b border-amber-500/15">
          {pinned.map((m) => (
            <div key={m.id} className="flex items-start gap-2 text-sm">
              <Pin className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
              <span className="text-amber-200">{m.content}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {messages
          .filter((m) => !m.isPinned)
          .map((msg) => {
            const initial = msg.userName ? msg.userName.charAt(0).toUpperCase() : "?";
            return (
              <div
                key={msg.id}
                className={`flex gap-3 items-start group ${
                  msg.isAI
                    ? "bg-violet/10 rounded-2xl p-4 border border-violet/20 shadow-sm"
                    : ""
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-inner ${getAvatarBg(
                    msg.userName
                  )}`}
                >
                  {initial}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-sm font-semibold truncate ${
                        msg.isAI ? "text-violet-light font-bold" : "text-white"
                      }`}
                    >
                      {msg.userName}
                    </span>
                    <span className="text-[10px] text-navy-500">
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {isTeacher && !msg.isAI && (
                      <button
                        onClick={() => pinMessage(msg.id)}
                        className="opacity-0 group-hover:opacity-100 text-navy-500 hover:text-amber-400 transition-opacity ml-1"
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-navy-200 leading-relaxed break-words">
                    {msg.content}
                  </p>
                </div>
              </div>
            );
          })}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 border-t border-navy-700 bg-navy-900/20 flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Say something... (@Spark for AI help)"
          disabled={loading}
          className="rounded-xl border-navy-600 bg-navy-900/50 text-white focus-visible:ring-violet"
        />
        <Button
          size="icon"
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="rounded-xl bg-violet hover:bg-violet-dark shadow-md active:scale-95 transition-transform"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
