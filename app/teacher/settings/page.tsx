"use client";

import { PageTransition } from "@/components/shared/PageTransition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "@/components/shared/ThemeProvider";
import { useSession } from "next-auth/react";

export default function TeacherSettings() {
  const { theme, toggle } = useTheme();
  const { data: session } = useSession();

  return (
    <PageTransition>
      <div className="p-6 md:p-8 max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold text-white">Settings</h1>

        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-navy-300">
              Name: <span className="text-white">{session?.user?.name}</span>
            </p>
            <p className="text-navy-300">
              Email: <span className="text-white">{session?.user?.email}</span>
            </p>
            <p className="text-navy-300">
              Role: <span className="text-white">Teacher</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
          </CardHeader>
          <CardContent>
            <button
              onClick={toggle}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-navy-700 hover:bg-navy-600 transition-colors w-full text-left"
            >
              <span className="text-2xl">{theme === "dark" ? "🌙" : "☀️"}</span>
              <div>
                <p className="text-white font-medium">
                  {theme === "dark" ? "Dark Mode" : "Light Mode"}
                </p>
                <p className="text-xs text-navy-400">Click to toggle</p>
              </div>
            </button>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
