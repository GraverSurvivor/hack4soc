"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BookOpen, KeyRound, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useClassrooms } from "@/components/shared/ClassroomProvider";
import { toast } from "sonner";

export default function JoinClassroom() {
  const router = useRouter();
  const { setActiveClassroom, refreshClassrooms, classrooms } = useClassrooms();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const inviteCode = new URLSearchParams(window.location.search).get("code");
    if (inviteCode) setCode(inviteCode.toUpperCase());
  }, []);

  const join = async () => {
    if (!code.trim()) return;
    setLoading(true);

    try {
      const res = await fetch("/api/classrooms/join/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: code.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const alreadyJoined = classrooms.some((c) => c.id === data.classroom.id);
      setActiveClassroom(data.classroom.id);
      await refreshClassrooms();

      toast.success(
        alreadyJoined
          ? `You're already in ${data.classroom.name}`
          : `Joined ${data.classroom.name}!`
      );
      router.push("/student/home");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to join classroom");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-5xl grid gap-6 lg:grid-cols-[0.9fr_1.1fr]"
      >
        <Card className="border-violet/30">
          <CardContent className="p-8">
            <KeyRound className="w-10 h-10 text-violet-light mb-4" />
            <h1 className="text-2xl font-bold text-white">Join a Classroom</h1>
            <p className="text-navy-300 text-sm mt-2">
              Enter the invite code from your teacher. You can join multiple classes — they&apos;ll
              all appear on your dashboard.
            </p>
            <div className="mt-6">
              <Label>Invite Code</Label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                placeholder="ABC123"
                className="mt-2 text-center text-2xl tracking-widest font-bold"
                maxLength={8}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && code.length >= 4) join();
                }}
              />
            </div>
            <Button onClick={join} disabled={loading || code.length < 4} className="w-full mt-6">
              {loading ? "Joining..." : "Join Classroom"}
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card>
            <CardContent className="p-5 flex gap-4">
              <BookOpen className="w-7 h-7 text-amber-300 shrink-0" />
              <div>
                <h2 className="font-semibold text-white">Multiple classes</h2>
                <p className="text-sm text-navy-300 mt-1">
                  Join math, science, and more — switch between them from the header anytime.
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 flex gap-4">
              <ShieldCheck className="w-7 h-7 text-emerald-300 shrink-0" />
              <div>
                <h2 className="font-semibold text-white">If the code fails</h2>
                <p className="text-sm text-navy-300 mt-1">
                  Check for similar letters and numbers, then ask your teacher to confirm
                  the latest code.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
