"use client";

import Link from "next/link";
import { PageTransition } from "@/components/shared/PageTransition";
import { CommunityChat } from "@/components/chat/CommunityChat";
import { useClassrooms } from "@/components/shared/ClassroomProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { GraduationCap } from "lucide-react";

export default function StudentCommunity() {
  const { classrooms, activeClassroom, activeClassroomId, setActiveClassroom, loading } =
    useClassrooms();

  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-white mb-2">Community</h1>
        <p className="text-sm text-navy-400 mb-4">
          Chat with classmates in each classroom. Tip: @Spark for AI help.
        </p>

        {loading ? (
          <Skeleton className="h-96" />
        ) : classrooms.length === 0 ? (
          <div className="text-center py-12 text-navy-400 rounded-2xl border border-navy-700">
            <GraduationCap className="w-10 h-10 mx-auto mb-3 text-navy-500" />
            <p>Join a classroom to access community chat.</p>
            <Link href="/student/join" className="inline-block mt-4">
              <Button size="sm">Join now</Button>
            </Link>
          </div>
        ) : (
          <>
            {classrooms.length > 1 && (
              <div className="flex gap-2 flex-wrap mb-4">
                {classrooms.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveClassroom(c.id)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      c.id === activeClassroomId
                        ? "bg-violet/20 text-violet-light border border-violet/40"
                        : "bg-navy-800 text-navy-300 border border-navy-700 hover:border-navy-600"
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}

            {activeClassroomId && activeClassroom ? (
              <CommunityChat classroomId={activeClassroomId} />
            ) : (
              <p className="text-navy-400 text-center py-8">Select a classroom above.</p>
            )}
          </>
        )}
      </div>
    </PageTransition>
  );
}
