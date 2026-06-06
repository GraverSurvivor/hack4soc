"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Bell,
  Settings,
  LogOut,
  Brain,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useTheme } from "./ThemeProvider";

const NAV = [
  { href: "/teacher/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/teacher/courses", label: "Courses", icon: BookOpen },
  { href: "/teacher/students", label: "Students", icon: Users },
  { href: "/teacher/alerts", label: "Alerts", icon: Bell },
  { href: "/teacher/settings", label: "Settings", icon: Settings },
];

export function TeacherSidebar() {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();

  return (
    <aside className="hidden md:flex flex-col w-64 min-h-screen bg-navy-900 border-r border-navy-700 p-4">
      <div className="flex items-center gap-2 mb-8 px-2">
        <Brain className="w-7 h-7 text-violet" />
        <span className="font-bold text-white text-lg">NeuroSpark</span>
      </div>

      <nav className="flex-1 space-y-1">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all hover:scale-[1.02]",
                active
                  ? "bg-violet/20 text-violet-light font-medium"
                  : "text-navy-300 hover:bg-navy-800 hover:text-white"
              )}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-2 pt-4 border-t border-navy-700">
        <button
          onClick={toggle}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-navy-300 hover:bg-navy-800"
        >
          {theme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-navy-300 hover:bg-navy-800 hover:text-red-400"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
