"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { PageTransition } from "@/components/shared/PageTransition";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface Badge {
  id: string;
  badge: { name: string; description: string; icon: string; category: string };
  earnedAt: string;
}

export default function StudentBadges() {
  const { data: session } = useSession();
  const [earned, setEarned] = useState<Badge[]>([]);
  const [available, setAvailable] = useState<Array<{ id: string; name: string; description: string; icon: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return;

    fetch(`/api/students/${userId}/badges`)
      .then((r) => r.json())
      .then((data) => {
        setEarned(data.earned || []);
        setAvailable(data.available || []);
      })
      .finally(() => setLoading(false));
  }, [session?.user?.id]);

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-white mb-2">Badges</h1>
        <p className="text-navy-400 text-sm mb-8">
          {earned.length} of {earned.length + available.length} badges earned
        </p>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-white mb-4">Earned</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {earned.map((b, i) => (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="border-amber-500/30 bg-amber-500/5">
                    <CardContent className="p-4 text-center">
                      <span className="text-3xl">{b.badge.icon}</span>
                      <p className="font-medium text-white text-sm mt-2">{b.badge.name}</p>
                      <p className="text-xs text-navy-400 mt-1">{b.badge.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
              {earned.length === 0 && (
                <p className="col-span-full text-navy-400 text-sm">
                  Complete lessons to earn your first badge!
                </p>
              )}
            </div>

            <h2 className="text-lg font-semibold text-white mb-4">Locked</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {available.map((b) => (
                <Card key={b.id} className="opacity-50">
                  <CardContent className="p-4 text-center">
                    <span className="text-3xl grayscale">{b.icon}</span>
                    <p className="font-medium text-navy-400 text-sm mt-2">{b.name}</p>
                    <p className="text-xs text-navy-500 mt-1">{b.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </PageTransition>
  );
}
