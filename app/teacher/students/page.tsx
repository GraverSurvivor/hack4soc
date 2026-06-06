"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, Link, Mail, RefreshCw, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { PageTransition } from "@/components/shared/PageTransition";
import { StudentCards } from "@/components/dashboard/StudentCards";
import { IEPPanel } from "@/components/dashboard/IEPPanel";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Classroom {
  id: string;
  name: string;
  inviteCode: string;
  _count?: {
    members: number;
    courses: number;
  };
}

interface StudentCard {
  id: string;
  name: string;
  brainProfile: string;
  lastActive: string | null;
  completionPct: number;
  avgScore: number;
  trend: "up" | "down" | "stable";
  xp: number;
}

export default function TeacherStudents() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [classroomId, setClassroomId] = useState("");
  const [students, setStudents] = useState<StudentCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [studentEmail, setStudentEmail] = useState("");
  const [iepStudent, setIepStudent] = useState<string | null>(null);

  const activeClassroom = useMemo(
    () => classrooms.find((classroom) => classroom.id === classroomId),
    [classroomId, classrooms]
  );

  const inviteLink =
    typeof window === "undefined"
      ? ""
      : `${window.location.origin}/student/join?code=${activeClassroom?.inviteCode || ""}`;

  const loadClassroom = async (id: string) => {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/dashboard/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load students");
      setStudents(data.studentCards || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load students");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetch("/api/classrooms")
      .then((r) => r.json())
      .then((data: Classroom[]) => {
        setClassrooms(data);
        if (data[0]) {
          setClassroomId(data[0].id);
          return loadClassroom(data[0].id);
        }
        setLoading(false);
      })
      .catch(() => {
        toast.error("Could not load classrooms");
        setLoading(false);
      });
  }, []);

  const copyText = async (text: string, label: string) => {
    if (!text) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand("copy");
        document.body.removeChild(textArea);
        if (!successful) throw new Error("execCommand copy failed");
      }
      toast.success(`${label} copied`);
    } catch (err) {
      console.error("Clipboard copy failed:", err);
      toast.error(`Could not copy ${label}`);
    }
  };

  const addStudent = async () => {
    if (!classroomId || !studentEmail.trim()) return;
    setAdding(true);

    try {
      const res = await fetch(`/api/classrooms/${classroomId}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: studentEmail.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not add student");

      toast.success(`${data.student.name} added to ${activeClassroom?.name}`);
      setStudentEmail("");
      await loadClassroom(classroomId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add student");
    } finally {
      setAdding(false);
    }
  };

  const changeClassroom = (id: string) => {
    setClassroomId(id);
    setStudents([]);
    setLoading(true);
    loadClassroom(id);
  };

  return (
    <PageTransition>
      <div className="p-6 md:p-8 space-y-6">
        <div className="overflow-hidden rounded-2xl border border-navy-700 bg-gradient-to-br from-violet/30 via-navy-800 to-navy-900">
          <div className="p-6 md:p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm font-medium text-violet-light">People</p>
                <h1 className="mt-1 text-3xl font-bold text-white">
                  {activeClassroom?.name || "Classroom roster"}
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-navy-200">
                  Share the class code with students or add an existing student account by email.
                </p>
              </div>

              {classrooms.length > 1 && (
                <select
                  value={classroomId}
                  onChange={(event) => changeClassroom(event.target.value)}
                  className="h-11 rounded-xl border border-navy-600 bg-navy-900 px-4 text-sm text-white outline-none focus:border-violet"
                >
                  {classrooms.map((classroom) => (
                    <option key={classroom.id} value={classroom.id}>
                      {classroom.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {activeClassroom && (
              <div className="mt-6 grid gap-4 md:grid-cols-[1fr_1.3fr]">
                <div className="rounded-xl border border-white/10 bg-navy-950/50 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-navy-400">
                        Class code
                      </p>
                      <p className="mt-2 text-4xl font-bold tracking-[0.22em] text-white">
                        {activeClassroom.inviteCode}
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={() => copyText(activeClassroom.inviteCode, "Class code")}
                      aria-label="Copy class code"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyText(inviteLink, "Invite link")}
                    >
                      <Link className="h-4 w-4" />
                      Copy invite link
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadClassroom(activeClassroom.id)}
                      disabled={refreshing}
                    >
                      <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                      Refresh
                    </Button>
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-navy-950/50 p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet/20 text-violet-light">
                      <UserPlus className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-white">Add student</h2>
                      <p className="text-xs text-navy-400">
                        The student must already have a student account.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
                    <div>
                      <Label htmlFor="student-email">Student email</Label>
                      <Input
                        id="student-email"
                        type="email"
                        value={studentEmail}
                        onChange={(event) => setStudentEmail(event.target.value)}
                        onKeyDown={(event) => event.key === "Enter" && addStudent()}
                        placeholder="alex@student.edu"
                        className="mt-1"
                      />
                    </div>
                    <Button
                      onClick={addStudent}
                      disabled={adding || !studentEmail.trim()}
                      className="self-end"
                    >
                      <Mail className="h-4 w-4" />
                      {adding ? "Adding..." : "Add"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-violet-light" />
                <div>
                  <p className="text-2xl font-bold text-white">{students.length}</p>
                  <p className="text-xs text-navy-400">Students joined</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-2xl font-bold text-white">
                {activeClassroom?._count?.courses ?? 0}
              </p>
              <p className="text-xs text-navy-400">Courses assigned</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-2xl font-bold text-white">
                {students.length
                  ? Math.round(
                      students.reduce((sum, student) => sum + student.completionPct, 0) /
                        students.length
                    )
                  : 0}
                %
              </p>
              <p className="text-xs text-navy-400">Average completion</p>
            </CardContent>
          </Card>
        </div>

        <div>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-white">Roster</h2>
              <p className="text-sm text-navy-400">
                Select a student to manage IEP/504 accommodations.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="grid gap-4 md:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-36" />
              ))}
            </div>
          ) : students.length === 0 ? (
            <Card>
              <CardContent className="p-10 text-center">
                <Users className="mx-auto mb-3 h-10 w-10 text-navy-500" />
                <h3 className="font-semibold text-white">No students yet</h3>
                <p className="mt-1 text-sm text-navy-400">
                  Share the class code or add a student by email to build your roster.
                </p>
              </CardContent>
            </Card>
          ) : (
            <StudentCards students={students} onSelect={setIepStudent} />
          )}
        </div>

        {iepStudent && classroomId && (
          <IEPPanel
            studentId={iepStudent}
            classroomId={classroomId}
            onClose={() => setIepStudent(null)}
          />
        )}
      </div>
    </PageTransition>
  );
}
