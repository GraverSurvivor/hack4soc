"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function IEPPanel({
  studentId,
  classroomId,
  initial,
  onClose,
}: {
  studentId: string;
  classroomId: string;
  initial?: {
    notes: string;
    difficulty: string;
    is504: boolean;
    extraSupport: boolean;
  };
  onClose: () => void;
}) {
  const [notes, setNotes] = useState(initial?.notes || "");
  const [difficulty, setDifficulty] = useState(initial?.difficulty || "standard");
  const [is504, setIs504] = useState(initial?.is504 || false);
  const [extraSupport, setExtraSupport] = useState(initial?.extraSupport || false);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/iep/${studentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes, difficulty, is504, extraSupport, classroomId }),
      });
      if (!res.ok) throw new Error();
      toast.success("Accommodation notes saved");
      onClose();
    } catch {
      toast.error("Failed to save notes");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-navy-800 border-l border-navy-700 shadow-2xl z-50 p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">IEP/504 Accommodations</h3>
        <button onClick={onClose} className="text-navy-400 hover:text-white">✕</button>
      </div>

      <div className="space-y-4">
        <div>
          <Label>Accommodation Notes</Label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1 w-full h-32 rounded-xl border border-navy-600 bg-navy-900 p-3 text-sm text-white resize-none focus:outline-none focus:ring-2 focus:ring-violet"
            placeholder="Extended time, prefer verbal instructions, etc."
          />
        </div>

        <div>
          <Label>Content Difficulty</Label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="mt-1 w-full h-11 rounded-xl border border-navy-600 bg-navy-900 px-3 text-sm text-white"
          >
            <option value="easy">Easy (Grade 4 level)</option>
            <option value="standard">Standard</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        <label className="flex items-center gap-2 text-sm text-navy-200">
          <input
            type="checkbox"
            checked={is504}
            onChange={(e) => setIs504(e.target.checked)}
            className="rounded"
          />
          504 Plan student
        </label>

        <label className="flex items-center gap-2 text-sm text-navy-200">
          <input
            type="checkbox"
            checked={extraSupport}
            onChange={(e) => setExtraSupport(e.target.checked)}
            className="rounded"
          />
          Flag for extra support
        </label>

        <Button onClick={save} disabled={saving} className="w-full">
          {saving ? "Saving..." : "Save Accommodations"}
        </Button>
      </div>
    </div>
  );
}
