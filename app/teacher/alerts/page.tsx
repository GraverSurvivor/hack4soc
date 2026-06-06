"use client";

import { useEffect, useState } from "react";
import { PageTransition } from "@/components/shared/PageTransition";
import { AtRiskAlerts } from "@/components/dashboard/AtRiskAlerts";
import { Skeleton } from "@/components/ui/skeleton";

export default function TeacherAlerts() {
  const [alerts, setAlerts] = useState<Array<{
    studentId: string;
    studentName: string;
    reasons: string[];
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/classrooms")
      .then((r) => r.json())
      .then((classrooms) => {
        if (classrooms[0]) {
          return fetch(`/api/dashboard/${classrooms[0].id}`);
        }
      })
      .then((r) => r?.json())
      .then((data) => setAlerts(data?.atRiskAlerts || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageTransition>
      <div className="p-6 md:p-8 max-w-2xl">
        <h1 className="text-2xl font-bold text-white mb-6">Alerts</h1>
        {loading ? (
          <Skeleton className="h-48" />
        ) : (
          <AtRiskAlerts alerts={alerts} />
        )}
      </div>
    </PageTransition>
  );
}
