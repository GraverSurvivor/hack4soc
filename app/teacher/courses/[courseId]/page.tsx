"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, BookOpen, FileText, ListChecks, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { PageTransition } from "@/components/shared/PageTransition";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface Course {
  id: string;
  title: string;
  fileName: string | null;
  rawText: string;
  createdAt: string;
  classroom: { id: string; name: string };
  units: Array<{
    id: string;
    title: string;
    summary: string;
    order: number;
    quizQuestions?: Array<{ id: string }>;
  }>;
}

export default function TeacherCourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  const [expandedUnitId, setExpandedUnitId] = useState<string | null>(null);
  const [unitDetails, setUnitDetails] = useState<Record<string, any>>({});
  const [detailsLoading, setDetailsLoading] = useState<Record<string, boolean>>({});
  const [activeTabs, setActiveTabs] = useState<Record<string, "story" | "calm" | "game" | "quiz">>({});

  useEffect(() => {
    fetch(`/api/courses/${courseId}`)
      .then((r) => r.json())
      .then(setCourse)
      .finally(() => setLoading(false));
  }, [courseId]);

  const toggleUnit = async (unitId: string) => {
    if (expandedUnitId === unitId) {
      setExpandedUnitId(null);
      return;
    }
    setExpandedUnitId(unitId);

    if (!unitDetails[unitId] && !detailsLoading[unitId]) {
      setDetailsLoading((prev) => ({ ...prev, [unitId]: true }));
      try {
        const res = await fetch(`/api/units/${unitId}`);
        const data = await res.json();
        setUnitDetails((prev) => ({ ...prev, [unitId]: data }));
        setActiveTabs((prev) => ({ ...prev, [unitId]: "story" }));
      } catch (err) {
        console.error("Failed to fetch unit details", err);
      } finally {
        setDetailsLoading((prev) => ({ ...prev, [unitId]: false }));
      }
    }
  };

  const parseModeContent = (mode: string, rawContent: string) => {
    if (!rawContent) return { content: "No content generated." };
    try {
      const parsed = JSON.parse(rawContent);
      if (mode === "story") {
        return { content: parsed.narrative || parsed.content || rawContent };
      }
      if (mode === "calm") {
        if (Array.isArray(parsed.cards)) {
          return {
            cards: parsed.cards.map((c: any) => ({
              title: c.heading || c.title || c.concept || "Concept",
              body: c.body || c.content || ""
            }))
          };
        }
        return { content: parsed.content || rawContent };
      }
      if (mode === "game") {
        return {
          questTitle: parsed.questTitle || "Quest",
          questObjective: parsed.questObjective || "",
          xpReward: parsed.xpReward || 100,
          content: parsed.content || ""
        };
      }
    } catch {
      // plain text
    }
    return { content: rawContent };
  };

  const sourcePreview = useMemo(() => {
    if (!course?.rawText) return "No extracted source text is available for this course.";
    return course.rawText.length > 1800
      ? `${course.rawText.slice(0, 1800)}...`
      : course.rawText;
  }, [course]);

  if (loading) {
    return (
      <div className="p-6 md:p-8 space-y-4">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-40" />
        <Skeleton className="h-56" />
      </div>
    );
  }

  if (!course || "error" in course) {
    return <div className="p-8 text-center text-navy-400">Course not found</div>;
  }

  return (
    <PageTransition>
      <div className="p-6 md:p-8 space-y-6">
        <Link href="/teacher/courses" className="inline-flex items-center gap-2 text-sm text-navy-300 hover:text-white">
          <ArrowLeft className="w-4 h-4" />
          Back to courses
        </Link>

        <Card className="border-violet/30">
          <CardContent className="p-6">
            <p className="text-sm text-violet-light font-medium">{course.classroom.name}</p>
            <h1 className="text-2xl md:text-3xl font-bold text-white mt-1">{course.title}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-navy-300 mt-4">
              {course.fileName && (
                <span className="inline-flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  {course.fileName}
                </span>
              )}
              <span className="inline-flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                {course.units.length} learning units
              </span>
              <span>Created {new Date(course.createdAt).toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>

        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Generated Units (Click to view subsections)</h2>
          <div className="grid gap-4">
            {course.units.map((unit, index) => {
              const isExpanded = expandedUnitId === unit.id;
              const isLoading = detailsLoading[unit.id];
              const details = unitDetails[unit.id];
              const activeTab = activeTabs[unit.id] || "story";

              return (
                <Card 
                  key={unit.id} 
                  className={`transition-all duration-300 ${
                    isExpanded 
                      ? "border-violet bg-navy-900/60 shadow-neon" 
                      : "hover:border-violet/50 hover:bg-navy-900/30 cursor-pointer"
                  }`}
                >
                  <CardContent className="p-5">
                    <div 
                      className="flex items-start justify-between gap-4 cursor-pointer"
                      onClick={() => toggleUnit(unit.id)}
                    >
                      <div className="flex gap-4">
                        <span className="w-10 h-10 rounded-full bg-violet/15 text-violet-light flex items-center justify-center font-bold shrink-0">
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-white text-base md:text-lg">{unit.title}</h3>
                          <p className="text-sm text-navy-300 mt-1">{unit.summary}</p>
                          <div className="flex flex-wrap items-center gap-3 mt-3">
                            <span className="inline-flex items-center gap-1 text-xs text-navy-400">
                              <ListChecks className="w-3 h-3" />
                              {unit.quizQuestions?.length ?? 0} quiz questions
                            </span>
                            <span className="text-xs text-navy-500">•</span>
                            <span className="text-xs text-violet-light font-medium">3 interactive modes</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-navy-400 shrink-0 self-center">
                        {isLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin text-violet-light" />
                        ) : isExpanded ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-5 pt-5 border-t border-navy-700 space-y-4">
                        {isLoading ? (
                          <div className="space-y-3">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-24 w-full" />
                          </div>
                        ) : details ? (
                          <div className="space-y-4">
                            {/* Tabs Header */}
                            <div className="flex flex-wrap gap-2 border-b border-navy-800 pb-3">
                              {(["story", "calm", "game", "quiz"] as const).map((tab) => (
                                <button
                                  key={tab}
                                  onClick={() => setActiveTabs((prev) => ({ ...prev, [unit.id]: tab }))}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                                    activeTab === tab
                                      ? "bg-violet text-white shadow-glow"
                                      : "bg-navy-800 text-navy-300 hover:text-white"
                                  }`}
                                >
                                  {tab} Mode
                                </button>
                              ))}
                            </div>

                            {/* Tab Content */}
                            <div className="rounded-lg bg-navy-950/40 border border-navy-800 p-4 min-h-[150px]">
                              {activeTab === "story" && (
                                <div className="space-y-2">
                                  <h4 className="text-sm font-semibold text-violet-light">Story Mode Preview</h4>
                                  <p className="text-sm text-navy-200 leading-relaxed whitespace-pre-wrap">
                                    {parseModeContent("story", details.storyMode).content}
                                  </p>
                                </div>
                              )}

                              {activeTab === "calm" && (
                                <div className="space-y-3">
                                  <h4 className="text-sm font-semibold text-sky-400">Calm Visual Mode Preview</h4>
                                  {(() => {
                                    const parsed = parseModeContent("calm", details.calmMode);
                                    if (parsed.cards) {
                                      return (
                                        <div className="grid gap-3">
                                          {parsed.cards.map((c: any, i: number) => (
                                            <div key={i} className="border border-sky-500/20 bg-sky-500/5 rounded-lg p-3">
                                              <h5 className="text-sm font-medium text-white">{c.title}</h5>
                                              <p className="text-xs text-navy-200 mt-1 leading-relaxed">{c.body}</p>
                                            </div>
                                          ))}
                                        </div>
                                      );
                                    }
                                    return (
                                      <p className="text-sm text-navy-200 leading-relaxed whitespace-pre-wrap">
                                        {parsed.content}
                                      </p>
                                    );
                                  })()}
                                </div>
                              )}

                              {activeTab === "game" && (
                                <div className="space-y-2">
                                  <h4 className="text-sm font-semibold text-emerald-400">Game Mode Preview</h4>
                                  {(() => {
                                    const parsed = parseModeContent("game", details.gameMode);
                                    if (parsed.questTitle) {
                                      return (
                                        <div className="border border-emerald-500/20 bg-emerald-500/5 rounded-lg p-3 space-y-2">
                                          <div className="flex justify-between items-center">
                                            <h5 className="text-sm font-bold text-white">⚔️ {parsed.questTitle}</h5>
                                            <span className="text-xs bg-amber-500/15 text-amber-300 font-bold px-2 py-0.5 rounded-full">
                                              {parsed.xpReward} XP
                                            </span>
                                          </div>
                                          <p className="text-xs text-navy-200 leading-relaxed">{parsed.questObjective}</p>
                                          {parsed.content && (
                                            <p className="text-xs text-navy-300 whitespace-pre-wrap border-t border-emerald-500/10 pt-2 mt-2">
                                              {parsed.content}
                                            </p>
                                          )}
                                        </div>
                                      );
                                    }
                                    return (
                                      <p className="text-sm text-navy-200 leading-relaxed whitespace-pre-wrap">
                                        {parsed.content}
                                      </p>
                                    );
                                  })()}
                                </div>
                              )}

                              {activeTab === "quiz" && (
                                <div className="space-y-4">
                                  <h4 className="text-sm font-semibold text-amber-400">Quiz Preview</h4>
                                  {details.quizQuestions?.length > 0 ? (
                                    <div className="space-y-4">
                                      {details.quizQuestions.map((q: any, qi: number) => {
                                        const options = Array.isArray(q.options) ? q.options : [];
                                        const correctVal = q.correct;
                                        let correctLetter = correctVal;
                                        if (/^\d+$/.test(correctVal)) {
                                          correctLetter = String.fromCharCode(65 + parseInt(correctVal, 10));
                                        }
                                        return (
                                          <div key={q.id} className="border border-navy-800 bg-navy-900/30 rounded-lg p-3 space-y-2">
                                            <p className="text-sm font-medium text-white">
                                              {qi + 1}. {q.question}
                                            </p>
                                            <div className="grid gap-1.5 pl-2">
                                              {options.map((opt: string, oi: number) => {
                                                const currentLetter = String.fromCharCode(65 + oi);
                                                const isCorrect = currentLetter === correctLetter;
                                                return (
                                                  <div key={opt} className={`text-xs p-1.5 rounded ${isCorrect ? "bg-green-500/10 text-green-200 font-medium" : "text-navy-300"}`}>
                                                    <span className="font-bold mr-1">{currentLetter}.</span> {opt} {isCorrect && "✓"}
                                                  </div>
                                                );
                                              })}
                                            </div>
                                            {q.explanation && (
                                              <p className="text-xs text-navy-400 italic bg-navy-900/60 p-2 rounded border-l-2 border-violet mt-2 pl-3">
                                                Explanation: {q.explanation}
                                              </p>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <p className="text-xs text-navy-400">No quiz questions generated for this unit.</p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-red-400">Failed to load unit details.</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-white">Extracted Material Preview</h2>
            <p className="mt-4 max-h-96 overflow-auto whitespace-pre-wrap rounded-lg border border-navy-700 bg-navy-900/50 p-4 text-sm leading-6 text-navy-300">
              {sourcePreview}
            </p>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
