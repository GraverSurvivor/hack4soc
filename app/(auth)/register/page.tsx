"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brain } from "lucide-react";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"TEACHER" | "STUDENT">("STUDENT");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });

    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Registration failed");
      setLoading(false);
      return;
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      toast.error("Account created but sign-in failed. Please log in.");
      router.push("/login");
      return;
    }

    toast.success("Welcome to NeuroSpark!");
    router.push(role === "TEACHER" ? "/teacher/onboarding" : "/student/onboarding");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-900 px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Brain className="w-10 h-10 text-violet" />
            <h1 className="text-3xl font-bold text-white">Join NeuroSpark</h1>
          </div>
          <p className="text-navy-300">Create your account to get started.</p>
        </div>

        <div className="bg-navy-800 rounded-2xl border border-navy-700 p-8 shadow-card">
          <div className="flex gap-2 mb-6 p-1 bg-navy-900 rounded-xl">
            {(["STUDENT", "TEACHER"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  role === r
                    ? "bg-violet text-white"
                    : "text-navy-400 hover:text-white"
                }`}
              >
                {r === "STUDENT" ? "🎒 Student" : "👩‍🏫 Teacher"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Johnson"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
                className="mt-1"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-navy-400">
            Already have an account?{" "}
            <Link href="/login" className="text-violet-light hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
