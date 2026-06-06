"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, MessageCircle, Award, User, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/student/home", label: "Home", icon: Home },
  { href: "/student/courses", label: "Courses", icon: BookOpen },
  { href: "/student/community", label: "Community", icon: MessageCircle },
  { href: "/student/badges", label: "Badges", icon: Award },
  { href: "/student/profile", label: "Profile", icon: User },
];

export function StudentNav() {
  const pathname = usePathname();

  return (
    <>
      <header className="hidden md:flex items-center justify-between px-8 py-4 bg-navy-900 border-b border-navy-700">
        <Link href="/student/home" className="flex items-center gap-2">
          <Brain className="w-6 h-6 text-violet" />
          <span className="font-bold text-white">NeuroSpark</span>
        </Link>
        <nav className="flex gap-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all",
                  active
                    ? "bg-violet/20 text-violet-light"
                    : "text-navy-300 hover:text-white hover:bg-navy-800"
                )}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-navy-900 border-t border-navy-700 flex z-50">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-colors",
                active ? "text-violet-light" : "text-navy-400"
              )}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
