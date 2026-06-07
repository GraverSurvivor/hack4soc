"use client";

import { ChevronDown, GraduationCap, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useClassrooms } from "@/components/shared/ClassroomProvider";
import { cn } from "@/lib/utils";

export function ClassroomSwitcher({ compact = false }: { compact?: boolean }) {
  const { classrooms, activeClassroom, setActiveClassroom, loading } = useClassrooms();
  const [open, setOpen] = useState(false);

  if (loading) {
    return (
      <div className="h-9 w-36 rounded-lg bg-navy-800 animate-pulse" />
    );
  }

  if (classrooms.length === 0) {
    return (
      <Link
        href="/student/join"
        className="inline-flex items-center gap-2 rounded-lg border border-violet/40 bg-violet/10 px-3 py-2 text-sm text-violet-light hover:bg-violet/20"
      >
        <Plus className="w-4 h-4" />
        Join Class
      </Link>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex items-center gap-2 rounded-lg border border-navy-600 bg-navy-800 hover:bg-navy-700 transition-colors text-left",
          compact ? "px-3 py-2 text-sm max-w-[180px]" : "px-4 py-2 text-sm max-w-[220px]"
        )}
      >
        <GraduationCap className="w-4 h-4 text-violet-light shrink-0" />
        <span className="truncate text-white font-medium">
          {activeClassroom?.name ?? "Select class"}
        </span>
        <ChevronDown className={cn("w-4 h-4 text-navy-400 shrink-0 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-2 z-50 w-72 rounded-xl border border-navy-600 bg-navy-800 shadow-xl overflow-hidden">
            <div className="p-2 border-b border-navy-700">
              <p className="text-xs text-navy-400 px-2 py-1">My Classes ({classrooms.length})</p>
            </div>
            <div className="max-h-64 overflow-y-auto p-1">
              {classrooms.map((classroom) => (
                <button
                  key={classroom.id}
                  onClick={() => {
                    setActiveClassroom(classroom.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full text-left rounded-lg px-3 py-2.5 transition-colors",
                    classroom.id === activeClassroom?.id
                      ? "bg-violet/20 text-violet-light"
                      : "text-navy-200 hover:bg-navy-700"
                  )}
                >
                  <p className="font-medium text-sm truncate">{classroom.name}</p>
                  <p className="text-xs text-navy-400 mt-0.5">
                    {classroom._count?.courses ?? classroom.courses?.length ?? 0} courses
                    {classroom.teacher?.name ? ` · ${classroom.teacher.name}` : ""}
                  </p>
                </button>
              ))}
            </div>
            <Link
              href="/student/join"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-3 text-sm text-violet-light border-t border-navy-700 hover:bg-navy-700/50"
            >
              <Plus className="w-4 h-4" />
              Join another class
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
