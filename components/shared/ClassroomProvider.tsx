"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "activeClassroomId";

export interface ClassroomUnit {
  id: string;
  title: string;
  summary: string;
  progress?: Array<{ completed: boolean; quizScore?: number | null; learningMode?: string | null }>;
}

export interface ClassroomCourse {
  id: string;
  title: string;
  units: ClassroomUnit[];
}

export interface ClassroomSummary {
  id: string;
  name: string;
  inviteCode?: string;
  joinedAt?: string;
  teacher?: { name: string | null };
  _count?: { members: number; courses: number };
  courses?: ClassroomCourse[];
}

interface ClassroomContextValue {
  classrooms: ClassroomSummary[];
  activeClassroom: ClassroomSummary | null;
  activeClassroomId: string | null;
  setActiveClassroom: (id: string) => void;
  refreshClassrooms: () => Promise<void>;
  loading: boolean;
}

const ClassroomContext = createContext<ClassroomContextValue | null>(null);

export function ClassroomProvider({ children }: { children: React.ReactNode }) {
  const [classrooms, setClassrooms] = useState<ClassroomSummary[]>([]);
  const [activeClassroomId, setActiveClassroomId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshClassrooms = useCallback(async () => {
    try {
      const res = await fetch("/api/classrooms");
      const data = await res.json();
      if (!Array.isArray(data)) return;

      setClassrooms(data);

      const stored =
        localStorage.getItem(STORAGE_KEY) || localStorage.getItem("classroomId");
      const validStored = stored && data.some((c: ClassroomSummary) => c.id === stored);

      if (validStored) {
        setActiveClassroomId(stored);
      } else if (data.length > 0) {
        setActiveClassroomId(data[0].id);
        localStorage.setItem(STORAGE_KEY, data[0].id);
      } else {
        setActiveClassroomId(null);
        localStorage.removeItem(STORAGE_KEY);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshClassrooms();
  }, [refreshClassrooms]);

  const setActiveClassroom = useCallback((id: string) => {
    setActiveClassroomId(id);
    localStorage.setItem(STORAGE_KEY, id);
  }, []);

  const activeClassroom = useMemo(
    () => classrooms.find((c) => c.id === activeClassroomId) ?? null,
    [classrooms, activeClassroomId]
  );

  return (
    <ClassroomContext.Provider
      value={{
        classrooms,
        activeClassroom,
        activeClassroomId,
        setActiveClassroom,
        refreshClassrooms,
        loading,
      }}
    >
      {children}
    </ClassroomContext.Provider>
  );
}

export function useClassrooms() {
  const ctx = useContext(ClassroomContext);
  if (!ctx) {
    throw new Error("useClassrooms must be used within ClassroomProvider");
  }
  return ctx;
}

export function getClassroomProgress(classroom: ClassroomSummary) {
  const units =
    classroom.courses?.flatMap((course) =>
      course.units.map((unit) => ({
        ...unit,
        courseId: course.id,
        courseTitle: course.title,
        completed: Boolean(unit.progress?.[0]?.completed),
        score: unit.progress?.[0]?.quizScore,
      }))
    ) ?? [];

  const completed = units.filter((u) => u.completed).length;
  const total = units.length;
  const percent = total ? Math.round((completed / total) * 100) : 0;
  const nextUnit = units.find((u) => !u.completed) ?? units[0];

  return { units, completed, total, percent, nextUnit };
}
