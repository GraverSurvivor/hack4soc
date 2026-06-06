"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageTransition } from "@/components/shared/PageTransition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Upload, Plus, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface Course {
  id: string;
  title: string;
  fileName: string | null;
  createdAt: string;
  units: { id: string; title: string }[];
}

export default function TeacherCourses() {
  const [classroomId, setClassroomId] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetch("/api/classrooms")
      .then((r) => r.json())
      .then((classrooms) => {
        if (classrooms[0]) {
          setClassroomId(classrooms[0].id);
          return fetch(`/api/classrooms/${classrooms[0].id}`);
        }
      })
      .then((r) => r?.json())
      .then((data) => setCourses(data?.courses || []))
      .finally(() => setLoading(false));
  }, []);

  const handleUpload = async () => {
    if (!file || !title || !classroomId) return;
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    formData.append("classroomId", classroomId);

    try {
      const res = await fetch("/api/courses/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCourses((prev) => [data, ...prev]);
      setShowUpload(false);
      setFile(null);
      setTitle("");
      toast.success("Course uploaded and AI-generated!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <PageTransition>
      <div className="p-6 md:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Courses</h1>
            <p className="text-navy-400 text-sm">Manage your uploaded course materials</p>
          </div>
          <Button onClick={() => setShowUpload(true)}>
            <Plus className="w-4 h-4 mr-2" /> Upload Course
          </Button>
        </div>

        {showUpload && (
          <Card className="mb-6">
            <CardContent className="p-6 space-y-4">
              <div>
                <Label>Course Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>File (PDF, DOCX, PPTX, TXT)</Label>
                <input
                  type="file"
                  accept=".pdf,.docx,.pptx,.txt"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="mt-1 w-full text-sm text-navy-300 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-violet file:text-white"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleUpload} disabled={uploading}>
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? "Generating..." : "Upload"}
                </Button>
                <Button variant="ghost" onClick={() => setShowUpload(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[...Array(2)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <BookOpen className="w-12 h-12 text-navy-600 mx-auto mb-4" />
              <p className="text-navy-400">No courses yet. Upload your first course material!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {courses.map((course) => (
              <Link key={course.id} href={`/teacher/courses/${course.id}`}>
                <Card className="h-full cursor-pointer hover:border-violet/50">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-lg">{course.title}</CardTitle>
                        {course.fileName && (
                          <p className="text-xs text-navy-400 mt-1">{course.fileName}</p>
                        )}
                      </div>
                      <ArrowRight className="w-4 h-4 text-navy-400 shrink-0 mt-1" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-navy-300">
                      {course.units.length} learning units
                    </p>
                    <p className="text-xs text-navy-500 mt-1">
                      Created {new Date(course.createdAt).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
