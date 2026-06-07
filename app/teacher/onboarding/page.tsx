"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Users, Share2, Check, BookOpen } from "lucide-react";

const STEPS = [
  { title: "Create Classroom", icon: Users },
  { title: "Invite Students", icon: Share2 },
];

export default function TeacherOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [classroomName, setClassroomName] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  const createClassroom = async () => {
    const res = await fetch("/api/classrooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: classroomName }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error);
      return;
    }
    setInviteCode(data.inviteCode);
    setStep(1);
    toast.success("Classroom created!");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-900 p-4">
      <div className="w-full max-w-lg">
        <div className="mb-8">
          <div className="flex justify-between mb-4">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <div
                  key={i}
                  className={`flex flex-col items-center gap-1 ${
                    i <= step ? "text-violet-light" : "text-navy-600"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                      i < step
                        ? "bg-violet border-violet"
                        : i === step
                        ? "border-violet bg-violet/20"
                        : "border-navy-600"
                    }`}
                  >
                    {i < step ? (
                      <Check className="w-5 h-5 text-white" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <span className="text-xs hidden sm:block">{s.title}</span>
                </div>
              );
            })}
          </div>
          <Progress value={((step + 1) / STEPS.length) * 100} />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-navy-800 rounded-2xl border border-navy-700 p-8"
          >
            {step === 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-white">Name Your Classroom</h2>
                <p className="text-navy-400 text-sm">
                  Give your class a name that students will recognize. You can add courses later
                  from the Courses page.
                </p>
                <div>
                  <Label>Classroom Name</Label>
                  <Input
                    value={classroomName}
                    onChange={(e) => setClassroomName(e.target.value)}
                    placeholder="Ms. Johnson's Science Class"
                    className="mt-1"
                  />
                </div>
                <Button
                  onClick={createClassroom}
                  disabled={!classroomName.trim()}
                  className="w-full"
                >
                  Create Classroom
                </Button>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4 text-center">
                <div className="text-5xl mb-4">🎉</div>
                <h2 className="text-xl font-bold text-white">You&apos;re All Set!</h2>
                <p className="text-navy-400 text-sm">
                  Share this invite code with your students:
                </p>
                <div className="text-4xl font-bold text-violet-light tracking-widest py-4 bg-navy-900 rounded-xl">
                  {inviteCode}
                </div>
                <p className="text-xs text-navy-500">
                  Students enter this code at Join Classroom. They can join multiple classes.
                </p>

                <div className="rounded-xl border border-navy-600 bg-navy-900/50 p-4 text-left mt-4">
                  <div className="flex gap-3">
                    <BookOpen className="w-5 h-5 text-violet-light shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-white">Ready to add lessons?</p>
                      <p className="text-xs text-navy-400 mt-1">
                        Go to Courses to upload materials and generate AI-powered lessons when
                        you&apos;re ready.
                      </p>
                      <Link href="/teacher/courses" className="inline-block mt-2">
                        <Button variant="outline" size="sm">
                          Go to Courses
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => router.push("/teacher/dashboard")}
                  className="w-full mt-2"
                >
                  Go to Dashboard
                </Button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
