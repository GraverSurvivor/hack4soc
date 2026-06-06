"use client";

import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Alert {
  studentId: string;
  studentName: string;
  reasons: string[];
}

export function AtRiskAlerts({ alerts }: { alerts: Alert[] }) {
  return (
    <Card className={alerts.length > 0 ? "border-amber-500/30" : ""}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          At-Risk Alerts
          {alerts.length > 0 && (
            <span className="ml-auto bg-amber-500 text-navy-900 text-xs font-bold px-2 py-0.5 rounded-full">
              {alerts.length}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <p className="text-navy-400 text-sm">All students are on track! 🎉</p>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.studentId}
                className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20"
              >
                <p className="font-medium text-amber-200">{alert.studentName}</p>
                <ul className="mt-1 space-y-0.5">
                  {alert.reasons.map((reason, i) => (
                    <li key={i} className="text-xs text-amber-300/80">
                      • {reason}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
