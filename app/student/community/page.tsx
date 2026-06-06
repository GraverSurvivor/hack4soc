"use client";

import { useEffect, useState } from "react";
import { PageTransition } from "@/components/shared/PageTransition";
import { CommunityChat } from "@/components/chat/CommunityChat";
import { Skeleton } from "@/components/ui/skeleton";

export default function StudentCommunity() {
  const [classroomId, setClassroomId] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("classroomId");
    setClassroomId(stored);
  }, []);

  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-white mb-4">Community</h1>
        {!classroomId ? (
          <div className="text-center py-12 text-navy-400">
            <p>Join a classroom to access community chat.</p>
            <a href="/student/join" className="text-violet-light text-sm hover:underline">
              Join now
            </a>
          </div>
        ) : (
          <CommunityChat classroomId={classroomId} />
        )}
      </div>
    </PageTransition>
  );
}
