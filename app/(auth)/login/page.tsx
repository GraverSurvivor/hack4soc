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

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      toast.error("Invalid email or password");
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-900 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Brain className="w-10 h-10 text-violet" />
            <h1 className="text-3xl font-bold text-white">NeuroSpark</h1>
          </div>
          <p className="text-navy-300">Welcome back! Sign in to continue learning.</p>
        </div>

        <div className="bg-navy-800 rounded-2xl border border-navy-700 p-8 shadow-card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@school.edu"
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
                placeholder="••••••••"
                required
                className="mt-1"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          {process.env.NEXT_PUBLIC_GOOGLE_ENABLED === "true" && (
            <div className="mt-4">
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-navy-600" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-navy-800 px-2 text-navy-400">or</span>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => signIn("google", { callbackUrl: "/" })}
              >
                Continue with Google
              </Button>
            </div>
          )}

          <p className="mt-6 text-center text-sm text-navy-400">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-violet-light hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
