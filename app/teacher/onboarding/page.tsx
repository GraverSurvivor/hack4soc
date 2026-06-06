"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Upload, Users, BookOpen, Check } from "lucide-react";

const STEPS = [
  { title: "Create Your Classroom", icon: Users },
  { title: "Upload Course Content", icon: BookOpen },
  { title: "Invite Students", icon: Upload },
];

export default function TeacherOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [classroomName, setClassroomName] = useState("");
  const [classroomId, setClassroomId] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [courseTitle, setCourseTitle] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState("");

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
    setClassroomId(data.id);
    setInviteCode(data.inviteCode);
    setStep(1);
    toast.success("Classroom created!");
  };

  const uploadCourse = async () => {
    if (!file || !courseTitle) {
      toast.error("Please provide a file and course title");
      return;
    }
    setGenerating(true);
    setGenProgress("Extracting text from document...");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", courseTitle);
    formData.append("classroomId", classroomId);

    setTimeout(() => setGenProgress("Generating your lessons... 🧠"), 2000);

    try {
      const res = await fetch("/api/courses/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStep(2);
      toast.success(`Course created with ${data.units.length} learning units!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setGenerating(false);
    }
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
                  Give your class a name that students will recognize.
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
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-white">Upload Course Material</h2>
                <p className="text-navy-400 text-sm">
                  Upload a PDF, DOCX, PPTX, or TXT file. AI will transform it into inclusive lessons.
                </p>
                <div>
                  <Label>Course Title</Label>
                  <Input
                    value={courseTitle}
                    onChange={(e) => setCourseTitle(e.target.value)}
                    placeholder="Introduction to Photosynthesis"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Course File (max 50MB)</Label>
                  <input
                    type="file"
                    accept=".pdf,.docx,.pptx,.txt"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="mt-1 w-full text-sm text-navy-300 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-violet file:text-white file:cursor-pointer"
                  />
                </div>
                {generating && (
                  <div className="p-4 rounded-xl bg-violet/10 border border-violet/20">
                    <p className="text-violet-light text-sm animate-pulse-soft">
                      {genProgress}
                    </p>
                  </div>
                )}
                <Button
                  onClick={uploadCourse}
                  disabled={generating || !file || !courseTitle}
                  className="w-full"
                >
                  {generating ? "Generating Lessons..." : "Upload & Generate"}
                </Button>
              </div>
            )}

            {step === 2 && (
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
                  Students enter this code when joining a classroom.
                </p>
                <Button
                  onClick={() => router.push("/teacher/dashboard")}
                  className="w-full"
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
